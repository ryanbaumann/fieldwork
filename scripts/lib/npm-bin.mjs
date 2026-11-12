// scripts/lib/npm-bin.mjs
//
// Ensures `npm` and `npx` are invocable in child processes even on macOS
// Homebrew Node upgrades where `/opt/homebrew/bin/npm` is a broken symlink
// while Node's bundled `npm-cli.js` lives under `../libexec/lib/node_modules`.

import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

let cachedShimDir = null;

function findBundledNpmDir(execPath = process.execPath) {
  let realExec = execPath;
  try {
    realExec = realpathSync(execPath);
  } catch {
    // Keep original execPath if realpath resolution fails.
  }
  const nodeBinDir = dirname(realExec);
  const candidates = [
    resolve(nodeBinDir, '..', 'libexec', 'lib', 'node_modules', 'npm', 'bin'),
    resolve(nodeBinDir, '..', 'lib', 'node_modules', 'npm', 'bin'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'npm-cli.js'))) {
      return { nodeBinDir, npmBinDir: dir, execPath: realExec };
    }
  }
  return null;
}

function getOrCreateShimDir() {
  if (cachedShimDir && existsSync(cachedShimDir)) return cachedShimDir;
  const bundled = findBundledNpmDir();
  if (!bundled) return null;

  const dir = mkdtempSync(join(tmpdir(), 'fieldwork-npm-bin-'));
  const npmScript = `#!/bin/sh\nexec "${bundled.execPath}" "${join(bundled.npmBinDir, 'npm-cli.js')}" "$@"\n`;
  writeFileSync(join(dir, 'npm'), npmScript, { mode: 0o755 });
  chmodSync(join(dir, 'npm'), 0o755);

  const npxCli = join(bundled.npmBinDir, 'npx-cli.js');
  if (existsSync(npxCli)) {
    const npxScript = `#!/bin/sh\nexec "${bundled.execPath}" "${npxCli}" "$@"\n`;
    writeFileSync(join(dir, 'npx'), npxScript, { mode: 0o755 });
    chmodSync(join(dir, 'npx'), 0o755);
  }

  cachedShimDir = dir;
  process.once('exit', () => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup on exit.
    }
  });
  return dir;
}

export function ensureNpmInEnv(baseEnv = process.env) {
  const probe = spawnSync('npm', ['--version'], { env: baseEnv, stdio: 'ignore' });
  if (!probe.error && probe.status === 0) {
    return { ...baseEnv };
  }
  const shimDir = getOrCreateShimDir();
  if (!shimDir) {
    return { ...baseEnv };
  }
  const currentPath = baseEnv.PATH || '';
  return {
    ...baseEnv,
    PATH: currentPath ? `${shimDir}${delimiter}${currentPath}` : shimDir,
  };
}
