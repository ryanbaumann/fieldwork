import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { server, publicApps, appsByPathLength } from '../server.js';
import { toPublicApp } from '../lib/apps.js';
import { AUTH_COOKIE_NAME, setAuthCookie } from '../lib/auth.js';

function request(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
  });
}

function postForm(port, path, form) {
  const body = new URLSearchParams(form).toString();
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('server includes CORS headers on photo proxy binary response', async () => {
  server.listen(0);
  const port = server.address().port;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    return {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '10',
      }),
      arrayBuffer: async () => new ArrayBuffer(10),
    };
  };

  try {
    const res = await new Promise((resolve) => {
      http.get(`http://localhost:${port}/api/strava/photo?url=https://dgtzuqphqg23d.cloudfront.net/test.jpg`, resolve);
    });
    
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-allow-origin'], '*');
    assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin');
    
  } finally {
    globalThis.fetch = originalFetch;
    server.close();
  }
});

test('server enforces public, unlisted, and private manifest behavior before static serving', async () => {
  const root = mkdtempSync(join(tmpdir(), 'gateway-visibility-'));
  const makeApp = (name, visibility, auth) => {
    const dir = join(root, name);
    mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), `${name} index`);
    writeFileSync(join(dir, 'asset.js'), `${name} asset`);
    return { name, title: name, description: name, path: `/${name}/`, visibility, auth, dir, available: true };
  };
  const injected = [
    makeApp('public-demo', 'public'),
    makeApp('unlisted-demo', 'unlisted'),
    makeApp('private-demo', 'private', { type: 'password', envVar: 'TEST_PRIVATE_DEMO_PASSWORD' }),
  ];
  const originalByPath = [...appsByPathLength];
  const originalPublic = [...publicApps];
  const previousSecret = process.env.TEST_PRIVATE_DEMO_PASSWORD;
  process.env.TEST_PRIVATE_DEMO_PASSWORD = 'test-secret';
  appsByPathLength.splice(0, appsByPathLength.length, ...injected);
  publicApps.splice(0, publicApps.length, toPublicApp(injected[0]));
  server.listen(0);
  const port = server.address().port;

  try {
    assert.equal((await request(port, '/public-demo/')).res.statusCode, 200);
    assert.equal((await request(port, '/unlisted-demo/')).res.statusCode, 200);
    assert.equal((await request(port, '/private-demo/')).res.statusCode, 401);
    assert.equal((await request(port, '/private-demo/asset.js')).res.statusCode, 401);
    const appsResponse = await request(port, '/api/apps');
    assert.equal(appsResponse.res.statusCode, 200);
    assert.deepEqual(JSON.parse(appsResponse.body).apps.map((app) => app.name), ['public-demo']);

    const cookieResponse = { setHeader(_name, value) { this.value = value; } };
    setAuthCookie(cookieResponse, 'private-demo', 'test-secret');
    const cookie = cookieResponse.value[0].split(';', 1)[0];
    assert.ok(cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.equal((await request(port, '/private-demo/asset.js', { Cookie: cookie })).res.statusCode, 200);

    delete process.env.TEST_PRIVATE_DEMO_PASSWORD;
    assert.equal((await request(port, '/private-demo/')).res.statusCode, 503);
  } finally {
    if (previousSecret === undefined) delete process.env.TEST_PRIVATE_DEMO_PASSWORD;
    else process.env.TEST_PRIVATE_DEMO_PASSWORD = previousSecret;
    appsByPathLength.splice(0, appsByPathLength.length, ...originalByPath);
    publicApps.splice(0, publicApps.length, ...originalPublic);
    await new Promise((resolve) => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  }
});

test('contact delivery validates intent and marks only provider-confirmed success', async () => {
  const previousEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  };
  const originalFetch = globalThis.fetch;
  const delivered = [];
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.CONTACT_TO_EMAIL = 'ryan@example.com';
  globalThis.fetch = async (_url, options) => {
    delivered.push(JSON.parse(options.body));
    return { ok: true, status: 200 };
  };
  server.listen(0);
  const port = server.address().port;
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'I am building a developer platform and would like to compare notes.',
  };

  try {
    const missingIntent = await postForm(port, '/api/contact', valid);
    assert.equal(missingIntent.res.statusCode, 400);
    assert.match(missingIntent.body, /data-contact-delivery="failure"/);
    assert.match(missingIntent.body, /role="alert"/);
    assert.doesNotMatch(missingIntent.body, /data-contact-delivery="success"/);

    const invalidIntent = await postForm(port, '/api/contact', { ...valid, intent: 'Consulting' });
    assert.equal(invalidIntent.res.statusCode, 400);
    assert.doesNotMatch(invalidIntent.body, /data-contact-delivery="success"/);

    const invalidMessage = await postForm(port, '/api/contact', {
      ...valid,
      intent: 'Other',
      message: 'Too short',
    });
    assert.equal(invalidMessage.res.statusCode, 400);
    assert.match(invalidMessage.body, /message with at least 20 characters/);
    assert.doesNotMatch(invalidMessage.body, /data-contact-delivery="success"/);

    const success = await postForm(port, '/api/contact', {
      ...valid,
      intent: 'Executive opportunity',
    });
    assert.equal(success.res.statusCode, 303);
    assert.equal(success.res.headers.location, '/contact-success/?delivered=1');
    assert.equal(success.body, '');
    assert.equal(delivered.length, 1);
    assert.equal(delivered[0].subject, '[Executive opportunity] Portfolio contact from Ada Lovelace');
    assert.match(delivered[0].text, /^Intent: Executive opportunity\nName: Ada Lovelace\nEmail: ada@example\.com\n\n/);

    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const rejected = await postForm(port, '/api/contact', {
      ...valid,
      intent: 'Speaking or media',
    });
    assert.equal(rejected.res.statusCode, 502);
    assert.match(rejected.body, /data-contact-delivery="failure"/);
    assert.doesNotMatch(rejected.body, /data-contact-delivery="success"/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await new Promise((resolve) => server.close(resolve));
  }
});
