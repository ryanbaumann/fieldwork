import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(path.dirname(__dirname));
const CLI_PATH = path.join(ROOT_DIR, 'scripts', 'hemmingway.mjs');

const hasUv = spawnSync('which', ['uv']).status === 0;
const isAppleSilicon = process.platform === 'darwin';

test('hemmingway.mjs runs --help cleanly and exits 0', { skip: !isAppleSilicon || !hasUv ? 'Requires Apple Silicon (darwin) and uv' : false }, () => {
  const res = spawnSync('node', [CLI_PATH, '--help'], {
    encoding: 'utf-8',
    cwd: ROOT_DIR,
  });

  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('Local Hemmingway Runner'));
  assert.ok(res.stdout.includes('review'));
  assert.ok(res.stdout.includes('edit'));
});
