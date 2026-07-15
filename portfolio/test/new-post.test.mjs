import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const SCRIPT = resolve(import.meta.dirname, '..', '..', 'scripts', 'new-post.mjs');

function scaffold(...args) {
  const writingDir = mkdtempSync(join(tmpdir(), 'new-post-'));
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PORTFOLIO_WRITING_DIR: writingDir },
  });
  return { writingDir, result };
}

test('new posts are safe drafts by default', () => {
  const { writingDir, result } = scaffold('A Safe Draft');
  assert.equal(result.status, 0, result.stderr);
  const post = readFileSync(join(writingDir, 'a-safe-draft.md'), 'utf8');
  assert.match(post, /draft: true/);
  assert.match(post, /noindex: true/);
});

test('--publish creates an indexable post', () => {
  const { writingDir, result } = scaffold('A Published Post', '--publish');
  assert.equal(result.status, 0, result.stderr);
  const post = readFileSync(join(writingDir, 'a-published-post.md'), 'utf8');
  assert.match(post, /draft: false/);
  assert.match(post, /noindex: false/);
});

test('--schedule creates a future indexable post with an explicit UTC gate', () => {
  const { writingDir, result } = scaffold('A Scheduled Post', '--schedule', '2099-07-14T16:00:00Z');
  assert.equal(result.status, 0, result.stderr);
  const post = readFileSync(join(writingDir, 'a-scheduled-post.md'), 'utf8');
  assert.match(post, /draft: false/);
  assert.match(post, /noindex: false/);
  assert.match(post, /publishAt: 2099-07-14T16:00:00Z/);
});

test('--schedule rejects local timestamps and cannot be combined with --publish', () => {
  assert.notEqual(scaffold('Bad Local Time', '--schedule', '2026-07-14T16:00').result.status, 0);
  assert.notEqual(scaffold('Impossible Date', '--schedule', '2099-02-30T16:00:00Z').result.status, 0);
  assert.notEqual(scaffold('Past Time', '--schedule', '2020-07-14T16:00:00Z').result.status, 0);
  assert.notEqual(scaffold('Two States', '--publish', '--schedule', '2026-07-14T16:00:00Z').result.status, 0);
});
