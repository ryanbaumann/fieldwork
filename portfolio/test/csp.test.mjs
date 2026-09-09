import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inlineScriptHashes, writeCspManifest } from '../lib/csp.mjs';

test('hashes exact inline script bytes, deduplicates, and normalizes HTML newlines', () => {
  const source = '\nwindow.approved = true;\n';
  const expected = `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
  assert.deepEqual(inlineScriptHashes(`<script>${source}</script><script>${source.replaceAll('\n', '\r\n')}</script>`), [expected]);
  assert.notDeepEqual(inlineScriptHashes('<script>window.approved = false;</script>'), [expected]);
  assert.deepEqual(inlineScriptHashes('<script src="/app.js"></script><script type="application/ld+json">{"name":"Fieldwork"}</script><button onclick="alert(1)">Go</button>'), []);
  assert.equal(inlineScriptHashes('<script type="module">window.module = true;</script>').length, 1);
});

test('manifest is per HTML file, includes copied pages, and never reuses another page’s hashes', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-csp-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'decks'));
  writeFileSync(join(dir, 'index.html'), '<script>window.home=true;</script>');
  writeFileSync(join(dir, 'decks', 'talk.html'), '<script>window.talk=true;</script>');
  writeFileSync(join(dir, 'app.js'), 'window.external=true;');
  writeCspManifest(dir);
  const manifest = JSON.parse(readFileSync(join(dir, 'csp-hashes.json'), 'utf8'));
  assert.equal(manifest.version, 1);
  assert.deepEqual(Object.keys(manifest.pages), ['decks/talk.html', 'index.html']);
  assert.notDeepEqual(manifest.pages['index.html'], manifest.pages['decks/talk.html']);
});
