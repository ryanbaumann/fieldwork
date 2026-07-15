import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { server, publicApps, appsByPathLength } from '../server.js';
import { toPublicApp } from '../lib/apps.js';

// Comfortably over the gateway's 1KB compression threshold, and repetitive
// enough that gzip/brotli both shrink it a lot (a realistic stand-in for
// real HTML, which is heavy on repeated tags/whitespace).
const LARGE_HTML = `<!doctype html><html><body>${'<p>Hello world, this is a paragraph of filler text used to pad the response past the compression threshold.</p>'.repeat(20)}</body></html>`;
const SMALL_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(64).fill(0)]);

function rawRequest(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
  });
}

test('static file compression and conditional requests', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'gateway-compression-'));
  const dir = join(root, 'compress-demo');
  mkdirSync(dir);
  writeFileSync(join(dir, 'index.html'), LARGE_HTML);
  writeFileSync(join(dir, 'logo.png'), SMALL_PNG);
  const app = {
    name: 'compress-demo',
    title: 'compress-demo',
    description: 'compress-demo',
    path: '/compress-demo/',
    visibility: 'public',
    auth: null,
    dir,
    available: true,
  };

  const originalByPath = [...appsByPathLength];
  const originalPublic = [...publicApps];
  appsByPathLength.splice(0, appsByPathLength.length, app, ...originalByPath);
  publicApps.splice(0, publicApps.length, toPublicApp(app));
  server.listen(0);
  const port = server.address().port;

  t.after(async () => {
    appsByPathLength.splice(0, appsByPathLength.length, ...originalByPath);
    publicApps.splice(0, publicApps.length, ...originalPublic);
    await new Promise((resolve) => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });

  await t.test('gzip Accept-Encoding gets a gzip body that decompresses to the original, with Vary set', async () => {
    const { res, body } = await rawRequest(port, '/compress-demo/', { 'Accept-Encoding': 'gzip' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-encoding'], 'gzip');
    assert.equal(res.headers.vary, 'Accept-Encoding');
    assert.equal(res.headers['content-length'], undefined);
    assert.equal(gunzipSync(body).toString('utf8'), LARGE_HTML);
  });

  await t.test('brotli is preferred over gzip when both are offered', async () => {
    const { res, body } = await rawRequest(port, '/compress-demo/', { 'Accept-Encoding': 'gzip, br' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-encoding'], 'br');
    assert.equal(res.headers.vary, 'Accept-Encoding');
    assert.equal(brotliDecompressSync(body).toString('utf8'), LARGE_HTML);
  });

  await t.test('no Accept-Encoding gets an identity body but still varies on Accept-Encoding', async () => {
    const { res, body } = await rawRequest(port, '/compress-demo/');
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-encoding'], undefined);
    assert.equal(res.headers.vary, 'Accept-Encoding');
    assert.equal(body.toString('utf8'), LARGE_HTML);
  });

  await t.test('a matching If-None-Match returns 304 with an empty body and no Content-Encoding', async () => {
    const first = await rawRequest(port, '/compress-demo/');
    const etag = first.res.headers.etag;
    assert.ok(etag, 'expected an ETag header on the first response');

    const conditional = await rawRequest(port, '/compress-demo/', { 'If-None-Match': etag });
    assert.equal(conditional.res.statusCode, 304);
    assert.equal(conditional.body.length, 0);
    assert.equal(conditional.res.headers['content-encoding'], undefined);
    assert.equal(conditional.res.headers['cache-control'], first.res.headers['cache-control']);
    assert.equal(conditional.res.headers.vary, 'Accept-Encoding');
  });

  await t.test('images are never compressed even when the client offers gzip/br', async () => {
    const { res, body } = await rawRequest(port, '/compress-demo/logo.png', { 'Accept-Encoding': 'gzip, br' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-encoding'], undefined);
    assert.equal(res.headers.vary, undefined);
    assert.equal(Number(res.headers['content-length']), SMALL_PNG.length);
    assert.ok(body.equals(SMALL_PNG));
  });
});
