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
