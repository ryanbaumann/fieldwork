import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs, { mkdtempSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { serveFromDir, serveFileWithStatus, sendCompressibleBody } from '../lib/staticFiles.js';

const HTML = '<p>Negotiated representation.</p>'.repeat(128);

function request(port, path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, headers, method }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(5000, () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end();
  });
}
function decoded(result) {
  if (result.headers['content-encoding'] === 'gzip') return gunzipSync(result.body).toString();
  if (result.headers['content-encoding'] === 'br') return brotliDecompressSync(result.body).toString();
  return result.body.toString();
}

test('negotiation at static and generated HTTP boundaries', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'gateway-negotiation-'));
  for (const [name, body] of [['large.html', HTML], ['small.html', 'tiny'], ['image.png', Buffer.alloc(2048)]]) {
    writeFileSync(join(dir, name), body);
  }
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/generated')) {
      res.setHeader('Vary', 'Origin');
      sendCompressibleBody(req, res, 200, {
        'Content-Type': 'text/html', 'Cache-Control': 'private, no-store',
        vary: req.url.endsWith('/star') ? '*' : 'Cookie', 'content-length': 999,
      }, req.url.endsWith('/small') ? 'tiny' : HTML);
    } else if (req.url === '/missing') {
      serveFileWithStatus(join(dir, 'large.html'), req, res, 404);
    } else if (!serveFromDir(dir, req.url, req, res, { private: req.url === '/large.html' })) {
      res.writeHead(404); res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });
  const port = server.address().port;

  for (const path of ['/large.html', '/generated']) {
    for (const [header, encoding] of [
      ['br ;q=0, *;q=1', 'gzip'], ['identity;q=1, br;q=0.2', undefined],
      ['br;q=1e0, gzip;q=0.4', 'gzip'], ['gzip, br', 'br'],
    ]) {
      const result = await request(port, path, { 'Accept-Encoding': header });
      assert.equal(result.status, 200);
      assert.equal(result.headers['content-encoding'], encoding);
      assert.equal(decoded(result), HTML);
      assert.equal(result.headers['cache-control'], 'private, no-store');
      if (result.headers['content-length']) assert.equal(Number(result.headers['content-length']), result.body.length);
      const head = await request(port, path, { 'Accept-Encoding': header }, 'HEAD');
      assert.equal(head.status, result.status);
      assert.equal(head.headers['content-encoding'], result.headers['content-encoding']);
      assert.equal(head.headers['content-length'], result.headers['content-length']);
      assert.equal(head.body.length, 0);
    }
  }
  const generated = await request(port, '/generated');
  assert.equal(generated.headers.vary, 'Origin, Cookie, Accept-Encoding');
  assert.equal((await request(port, '/generated/star')).headers.vary, '*');

  for (const path of ['/small.html', '/generated/small']) {
    const ordinary = await request(port, path, { 'Accept-Encoding': 'gzip, br' });
    assert.equal(ordinary.headers['content-encoding'], undefined);
    assert.equal(decoded(ordinary), 'tiny');
    const required = await request(port, path, { 'Accept-Encoding': 'gzip, identity;q=0' });
    assert.equal(required.headers['content-encoding'], 'gzip');
    assert.equal(decoded(required), 'tiny');
    const preferred = await request(port, path, { 'Accept-Encoding': 'gzip, identity;q=0.1' });
    assert.equal(preferred.headers['content-encoding'], 'gzip');
    assert.equal(decoded(preferred), 'tiny');
  }
  for (const path of ['/large.html', '/small.html', '/image.png', '/generated', '/generated/small']) {
    for (const method of ['GET', 'HEAD']) {
      const result = await request(port, path, { 'Accept-Encoding': '*;q=0' }, method);
      assert.equal(result.status, 406, path);
      assert.equal(result.body.length, 0);
      assert.equal(result.headers['content-length'], '0');
      assert.equal(result.headers.etag, undefined);
      assert.equal(result.headers['cache-control'], 'no-store');
    }
  }
  assert.equal((await request(port, '/image.png', { 'Accept-Encoding': 'gzip, identity;q=0' })).status, 406);

  const first = await request(port, '/large.html');
  for (const headers of [
    { 'If-None-Match': '*' }, { 'If-None-Match': first.headers.etag.replace(/^W\//, '') },
    { 'If-None-Match': `"other", ${first.headers.etag}` },
    { 'If-Modified-Since': first.headers['last-modified'] },
  ]) {
    const result = await request(port, '/large.html', { ...headers, 'Accept-Encoding': 'br' });
    assert.equal(result.status, 304);
    assert.equal(result.body.length, 0);
    assert.equal(result.headers.vary, 'Accept-Encoding');
    assert.equal(result.headers['cache-control'], first.headers['cache-control']);
  }
  assert.equal((await request(port, '/large.html', {
    'If-None-Match': '"other"', 'If-Modified-Since': first.headers['last-modified'],
  })).status, 200);
  assert.equal((await request(port, '/large.html', { 'If-None-Match': '*', 'Accept-Encoding': '*;q=0' })).status, 406);
  assert.equal((await request(port, '/missing', { 'If-None-Match': first.headers.etag })).status, 404);
});

test('static streams stop on HEAD, read errors, and client disconnects', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'gateway-stream-lifetime-'));
  const opened = [];
  const original = fs.createReadStream;
  t.mock.method(fs, 'createReadStream', (...args) => {
    const stream = original(...args);
    opened.push(stream);
    return stream;
  });
  syncBuiltinESMExports();
  const server = http.createServer((req, res) => {
    const file = join(dir, 'large.html');
    serveFileWithStatus(file, req, res, 200);
    if (req.url === '/read-error') unlinkSync(file);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    t.mock.restoreAll();
    syncBuiltinESMExports();
    rmSync(dir, { recursive: true, force: true });
  });
  const port = server.address().port;
  writeFileSync(join(dir, 'large.html'), HTML);
  assert.equal((await request(port, '/', { 'Accept-Encoding': 'br' }, 'HEAD')).body.length, 0);
  assert.equal(opened.length, 0, 'HEAD must not open a file or compression stream');
  for (const encoding of ['identity', 'gzip', 'br']) {
    writeFileSync(join(dir, 'large.html'), HTML);
    await assert.rejects(request(port, '/read-error', { 'Accept-Encoding': encoding }), /socket hang up|aborted|reset/i);
    assert.equal(opened.at(-1).destroyed, true);
  }
  writeFileSync(join(dir, 'large.html'), Buffer.alloc(16 * 1024 * 1024, 'x'));
  await new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/', headers: { 'Accept-Encoding': 'identity' } }, (res) => {
      res.once('data', () => {
        const stream = opened.at(-1);
        stream.once('close', resolve);
        res.destroy();
      });
    });
    req.on('error', reject);
  });
  assert.equal(opened.at(-1).destroyed, true);
  assert.equal((await request(port, '/', {}, 'HEAD')).status, 200, 'server survives stream failures');
});
