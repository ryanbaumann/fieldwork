#!/usr/bin/env node
// gateway/server.js
//
// Zero-npm-dependency Node ES-module server that is the single entry point
// for the trails.ninja container: it serves the portfolio landing page,
// every demo app's static build, and brokers all secret-bearing API calls
// same-origin under /api/*. See docs/ARCHITECTURE.md for the full picture.

import { createServer } from 'node:http';
import { join } from 'node:path';

import { loadApps, toPublicApp, REPO_ROOT } from './lib/apps.js';
import { applySecurityHeaders, serveFromDir } from './lib/staticFiles.js';
import { createRateLimiter, clientIp } from './lib/rateLimit.js';
import { handleStravaApi } from './lib/strava.js';
import { handleIsochronesApi } from './lib/isochrones.js';
import { handlePurpleAirApi } from './lib/purpleair.js';
import { getAqiMapConfig } from './lib/config.js';

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = join(REPO_ROOT, 'gateway', 'public');
const JSON_BODY_LIMIT_BYTES = 16 * 1024;

const { apps } = loadApps(process.env);
const publicApps = apps.map(toPublicApp);

const proxyRateLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

function sendJson(response, statusCode, payload) {
  applySecurityHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function sendRaw(response, statusCode, body, contentType) {
  applySecurityHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesRead = 0;
    request.on('data', (chunk) => {
      bytesRead += chunk.length;
      if (bytesRead > JSON_BODY_LIMIT_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => {
      if (bytesRead > JSON_BODY_LIMIT_BYTES) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON request body.'), { statusCode: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function findAppForPath(pathname) {
  return apps.find((app) => pathname === app.path.slice(0, -1) || pathname.startsWith(app.path));
}

async function handleApi(request, response, pathname, searchParams) {
  const ip = clientIp(request);

  if (pathname === '/healthz') {
    sendJson(response, 200, { ok: true, apps: publicApps.map((app) => app.name) });
    return;
  }

  if (pathname === '/api/apps') {
    sendJson(response, 200, { apps: publicApps });
    return;
  }

  if (pathname === '/api/config/aqi-map') {
    const result = getAqiMapConfig();
    sendJson(response, result.statusCode, result.json);
    return;
  }

  const isProxyRoute = pathname.startsWith('/api/strava/') || pathname === '/api/isochrones' || pathname === '/api/purpleair/sensors';
  if (isProxyRoute && !proxyRateLimiter.check(ip)) {
    sendJson(response, 429, { error: 'Too many requests. Please try again later.' });
    return;
  }

  if (pathname.startsWith('/api/strava/')) {
    let body = {};
    if (request.method === 'POST') {
      try {
        body = await readJsonBody(request);
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
        return;
      }
    }
    const result = await handleStravaApi({
      pathname,
      method: request.method,
      body,
      authHeader: request.headers.authorization,
      searchParams,
    });
    if (result.binary) {
      applySecurityHeaders(response);
      response.writeHead(200, {
        'Content-Type': result.binary.contentType,
        'Content-Length': result.binary.body.byteLength,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Security-Policy': 'sandbox',
      });
      response.end(Buffer.from(result.binary.body));
      return;
    }
    sendJson(response, result.statusCode, result.json);
    return;
  }

  if (pathname === '/api/isochrones') {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }
    let body;
    try {
      body = await readJsonBody(request);
    } catch (err) {
      sendJson(response, err.statusCode || 400, { error: err.message });
      return;
    }
    const result = await handleIsochronesApi(body);
    if (result.rawJson !== undefined) {
      sendRaw(response, result.statusCode, result.rawJson, result.contentType);
      return;
    }
    sendJson(response, result.statusCode, result.json);
    return;
  }

  if (pathname === '/api/purpleair/sensors') {
    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }
    const result = await handlePurpleAirApi(searchParams);
    sendJson(response, result.statusCode, result.json);
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
}

const server = createServer(async (request, response) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  } catch {
    sendJson(response, 400, { error: 'Bad request URL.' });
    return;
  }

  const { pathname, searchParams } = requestUrl;

  try {
    if (pathname === '/healthz' || pathname.startsWith('/api/')) {
      await handleApi(request, response, pathname, searchParams);
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    const app = findAppForPath(pathname);
    if (app) {
      if (!app.available) {
        applySecurityHeaders(response);
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(`${app.name} is not built. Run scripts/build-local.mjs first.`);
        return;
      }
      const subPath = pathname.slice(app.path.length - 1);
      if (serveFromDir(app.dir, subPath, response)) return;
      applySecurityHeaders(response);
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found.');
      return;
    }

    if (serveFromDir(PUBLIC_DIR, pathname, response)) return;

    applySecurityHeaders(response);
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found.');
  } catch (error) {
    console.error('Unhandled gateway error:', error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: 'Internal server error' });
    } else {
      response.end();
    }
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`trails.ninja gateway listening on :${PORT}`);
    console.log(`Apps: ${publicApps.map((app) => `${app.name}${app.available ? '' : ' (unbuilt)'}`).join(', ') || '(none found in apps.json)'}`);
  });
}

export { server, apps, publicApps };
