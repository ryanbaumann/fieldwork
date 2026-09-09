import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { createAppCsp } from '../lib/cspManifest.js';
import { CSP_POLICIES, cspForApp } from '../lib/staticFiles.js';

const hash = (script) => `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
const homeHash = hash('window.home = true;');
const otherHash = hash('window.other = true;');
const writerHash = hash('window.writer = true;');

function fixture(context) {
  const dir = mkdtempSync(join(tmpdir(), 'gateway-csp-'));
  context.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function manifest(dir, pages) {
  writeFileSync(join(dir, 'csp-hashes.json'), JSON.stringify({ version: 1, pages }));
}

test('CSP hashes apply only to their resolved page and app', (context) => {
  const dir = fixture(context);
  manifest(dir, { 'index.html': [homeHash, homeHash], 'other/index.html': [otherHash] });
  const policy = createAppCsp({ dir });
  assert.ok(policy(join(dir, 'index.html')).includes(homeHash));
  assert.equal(policy(join(dir, 'index.html')).split(homeHash).length, 2);
  assert.ok(!policy(join(dir, 'index.html')).includes(otherHash));
  assert.ok(policy(join(dir, 'other/index.html')).includes(otherHash));
  for (const path of [join(dir, 'main.js'), join(dir, 'missing.html'), join(dir, '../index.html'), 'index.html', undefined]) {
    assert.equal(policy(path), CSP_POLICIES.default);
  }
  const secondDir = fixture(context);
  manifest(secondDir, { 'index.html': [writerHash] });
  assert.ok(!createAppCsp({ dir: secondDir })(join(secondDir, 'index.html')).includes(homeHash));
  assert.equal(policy(join(secondDir, 'index.html')), CSP_POLICIES.default);
  assert.equal(createAppCsp({})(join(dir, 'index.html')), CSP_POLICIES.default);
});

test('CSP metadata is cached once and cannot be changed by later disk contents', (context) => {
  const dir = fixture(context);
  manifest(dir, { 'index.html': [homeHash] });
  const policy = createAppCsp({ dir });
  manifest(dir, { 'index.html': [otherHash] });
  assert.ok(policy(join(dir, 'index.html')).includes(homeHash));
  assert.ok(!policy(join(dir, 'index.html')).includes(otherHash));
  assert.ok(createAppCsp({ dir })(join(dir, 'index.html')).includes(otherHash));
});

test('absent and malformed manifests fail closed for every page', (context) => {
  const dir = fixture(context);
  const page = join(dir, 'index.html');
  assert.equal(createAppCsp({ dir })(page), CSP_POLICIES.default);
  const valid = { version: 1, pages: { 'index.html': [homeHash] } };
  for (const invalid of [
    'invalid JSON', null, [], {}, { ...valid, version: 2 }, { ...valid, pages: [] },
    { ...valid, pages: { 'index.html': 'unsafe-inline' } },
    { ...valid, pages: { 'index.html': ["'unsafe-inline'"] } },
    { ...valid, pages: { 'index.html': [homeHash, "'sha256-invalid'"] } },
    { ...valid, pages: { 'index.html': Array(129).fill(homeHash) } },
    ...['../index.html', '/index.html', './index.html', 'other//index.html', 'other/../index.html', 'other\\index.html', 'main.js'].map((path) => ({
      ...valid, pages: { 'index.html': [homeHash], [path]: [otherHash] },
    })),
  ]) {
    writeFileSync(join(dir, 'csp-hashes.json'), typeof invalid === 'string' ? invalid : JSON.stringify(invalid));
    assert.equal(createAppCsp({ dir })(page), CSP_POLICIES.default, JSON.stringify(invalid));
  }
  writeFileSync(join(dir, 'csp-hashes.json'), ' '.repeat(2 * 1024 * 1024 + 1));
  assert.equal(createAppCsp({ dir })(page), CSP_POLICIES.default);
});

test('manifest hashes do not alter Maps or Strava policies or style allowances', (context) => {
  const dir = fixture(context);
  manifest(dir, { 'index.html': [homeHash] });
  for (const csp of ['maps', 'maps-strava']) {
    const app = { dir, csp };
    assert.equal(createAppCsp(app)(join(dir, 'index.html')), cspForApp(app));
  }
  const policy = createAppCsp({ dir })(join(dir, 'index.html'));
  assert.doesNotMatch(policy.match(/(?:^|; )script-src [^;]*/)[0], /unsafe-inline|unsafe-eval/);
  assert.match(policy.match(/(?:^|; )style-src [^;]*/)[0], /unsafe-inline/);
});

function get(port, path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path, headers, method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ response, body: Buffer.concat(chunks).toString() }));
    });
    request.on('error', reject);
    request.end();
  });
}

test('gateway sends page-specific hashes on public, private, HEAD, conditional and 404 responses', async (context) => {
  const dir = fixture(context);
  const root = join(dir, 'fieldwork');
  const writer = join(dir, 'fieldwork-writer');
  mkdirSync(root);
  mkdirSync(writer);
  writeFileSync(join(root, 'index.html'), '<!doctype html><script>window.home = true;</script>');
  writeFileSync(join(root, '404.html'), '<!doctype html><script>window.other = true;</script>');
  writeFileSync(join(writer, 'index.html'), '<!doctype html><script>window.writer = true;</script>');
  manifest(root, { 'index.html': [homeHash], '404.html': [otherHash] });
  manifest(writer, { 'index.html': [writerHash] });
  const fixtureEnv = { APPS_ROOT: dir, GOOGLE_OAUTH_ALLOWED_EMAIL: 'writer@example.test', GOOGLE_OAUTH_SESSION_SECRET: 'fixture-signing-secret' };
  const previous = Object.fromEntries(Object.keys(fixtureEnv).map((name) => [name, process.env[name]]));
  Object.assign(process.env, fixtureEnv);
  const { server } = await import('../server.js');
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address();
    const home = await get(port, '/');
    assert.equal(home.response.statusCode, 200);
    assert.ok(home.response.headers['content-security-policy'].includes(homeHash));
    assert.ok(!home.response.headers['content-security-policy'].includes(writerHash));
    const head = await get(port, '/', {}, 'HEAD');
    assert.equal(head.response.statusCode, 200);
    assert.equal(head.body, '');
    assert.equal(head.response.headers['content-security-policy'], home.response.headers['content-security-policy']);
    const conditional = await get(port, '/', { 'If-None-Match': home.response.headers.etag });
    assert.equal(conditional.response.statusCode, 304);
    assert.equal(conditional.response.headers['content-security-policy'], home.response.headers['content-security-policy']);
    const missing = await get(port, '/missing/');
    assert.equal(missing.response.statusCode, 404);
    assert.ok(missing.response.headers['content-security-policy'].includes(otherHash));
    assert.ok(!missing.response.headers['content-security-policy'].includes(homeHash));
    const deniedWriter = await get(port, '/writer/');
    assert.equal(deniedWriter.response.statusCode, 401);
    assert.ok(!deniedWriter.response.headers['content-security-policy'].includes(writerHash));
    const session = `writer@example.test:${Math.floor(Date.now() / 1000) + 60}:${'a'.repeat(32)}`;
    const signature = createHmac('sha256', fixtureEnv.GOOGLE_OAUTH_SESSION_SECRET).update(session).digest('hex');
    const acceptedWriter = await get(port, '/writer/', { Cookie: `__Host-writer-auth=${session}:${signature}` });
    assert.equal(acceptedWriter.response.statusCode, 200);
    assert.equal(acceptedWriter.response.headers['cache-control'], 'private, no-store');
    assert.ok(acceptedWriter.response.headers['content-security-policy'].includes(writerHash));
    assert.ok(!acceptedWriter.response.headers['content-security-policy'].includes(homeHash));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
