import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { loadEnvFile } from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)));

try {
  loadEnvFile(join(root, '.env'));
} catch (e) {
  // Ignore if .env is missing
}

const isDev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 5174);
const dist = resolve(root, 'dist');
const MAX_BODY_BYTES = 16 * 1024;

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

const vite = isDev
  ? await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' })
  : null;

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Request body too large.'), { statusCode: 413 });
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function validateIsochroneBody(body) {
  const latitude = Number(body.location?.latitude);
  const longitude = Number(body.location?.longitude);
  const rawDuration = String(body.travelDuration ?? '').trim();
  const seconds = /^\d+s?$/.test(rawDuration) ? Number.parseInt(rawDuration.replace('s', ''), 10) : NaN;
  const travelMode = String(body.travelMode || '');
  const travelDirection = String(body.travelDirection || '');
  const routingPreference = String(body.routingPreference || '');
  const polygonFidelity = String(body.polygonFidelity || 'MEDIUM');

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Latitude must be between -90 and 90.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Longitude must be between -180 and 180.';
  if (!['DRIVE', 'BICYCLE', 'WALK'].includes(travelMode)) return 'Unsupported travel mode.';
  if (!['FROM', 'TO'].includes(travelDirection)) return 'Unsupported travel direction.';
  if (!['TRAFFIC_UNAWARE', 'TRAFFIC_AWARE'].includes(routingPreference)) return 'Unsupported routing preference.';
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(polygonFidelity)) return 'Unsupported polygon fidelity.';
  if (!Number.isInteger(seconds) || seconds <= 0 || seconds > 7200) return 'Travel duration must be between 1 and 7200 seconds.';
  if (travelMode === 'DRIVE' && seconds > 3600) return 'Drive mode is limited to 3600 seconds.';
  return null;
}

async function handleIsochrone(request, response) {
  const apiKey = (process.env.GMP_SERVER_API_KEY || '').trim();
  if (!apiKey) {
    sendJson(response, 503, { error: 'Isochrones proxy is not configured on this server.' });
    return;
  }

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    if (error?.statusCode === 413) {
      sendJson(response, 413, { error: 'Request body too large.' });
      return;
    }
    sendJson(response, 400, { error: 'Request body must be valid JSON.' });
    return;
  }

  const validationError = validateIsochroneBody(body);
  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const sanitizedBody = {
    location: {
      latitude: Number(body.location.latitude),
      longitude: Number(body.location.longitude),
    },
    travelDuration: `${Number.parseInt(String(body.travelDuration || '').replace('s', ''), 10)}s`,
    travelMode: String(body.travelMode),
    travelDirection: String(body.travelDirection),
    routingPreference: String(body.routingPreference),
    polygonFidelity: String(body.polygonFidelity || 'MEDIUM'),
  };

  let upstream;
  try {
    upstream = await fetch('https://isochrones.googleapis.com/v1/isochrones:generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
        'x-goog-fieldmask': 'isochrone.geoJson',
      },
      body: JSON.stringify(sanitizedBody),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error('Isochrones API connection error:', error);
    sendJson(response, 502, { error: 'Failed to connect to Google Maps Isochrones API.' });
    return;
  }

  try {
    const text = await upstream.text();
    response.writeHead(upstream.status, {
      ...SECURITY_HEADERS,
      'content-type': upstream.headers.get('content-type') || 'application/json',
      'cache-control': 'no-store',
    });
    response.end(text);
  } catch (error) {
    console.error('Failed to read response from Isochrones API:', error);
    sendJson(response, 502, { error: 'Invalid response from Google Maps Isochrones API.' });
  }
}

async function serveStatic(pathname, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: 'Bad request path.' });
    return;
  }
  const safePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = resolve(dist, `.${safePath.startsWith('/') ? safePath : `/${safePath}`}`);
  const insideDist = filePath === dist || filePath.startsWith(dist + sep);
  try {
    if (!insideDist) throw new Error('outside dist');
    const file = await readFile(filePath);
    response.writeHead(200, {
      ...SECURITY_HEADERS,
      'content-type': mimeTypes.get(extname(filePath)) || 'application/octet-stream',
    });
    response.end(file);
  } catch {
    const index = await readFile(join(dist, 'index.html'));
    response.writeHead(200, {
      ...SECURITY_HEADERS,
      'content-type': 'text/html; charset=utf-8',
    });
    response.end(index);
  }
}

const server = createHttpServer(async (request, response) => {
  let pathname;
  try {
    pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
  } catch {
    sendJson(response, 400, { error: 'Bad request URL.' });
    return;
  }
  // /api/isochrone (singular) is this standalone dev server's original
  // route; /api/isochrones (plural) matches the gateway's route so the
  // client code can call the same path in both standalone and
  // gateway-mounted deployments.
  if (request.method === 'POST' && (pathname === '/api/isochrone' || pathname === '/api/isochrones')) {
    await handleIsochrone(request, response);
    return;
  }

  if (vite) {
    vite.middlewares(request, response, () => {});
    return;
  }

  await serveStatic(pathname, response);
});

server.listen(port, () => {
  console.log(`Isochrones running at http://localhost:${port}`);
});
