import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { CSP_POLICIES, cspForApp } from './staticFiles.js';

const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
const MAX_PAGE_HASHES = 128;

function validPagePath(path) {
  return typeof path === 'string' && path.endsWith('.html')
    && !path.includes('\\') && !isAbsolute(path)
    && path.split('/').every((part) => part && part !== '.' && part !== '..');
}

function validHash(source) {
  if (typeof source !== 'string' || !/^'sha256-[A-Za-z0-9+/]{43}='$/.test(source)) return false;
  const encoded = source.slice(8, -1);
  return Buffer.from(encoded, 'base64').toString('base64') === encoded;
}

function loadPages(dir) {
  try {
    const path = join(dir, 'csp-hashes.json');
    if (statSync(path).size > MAX_MANIFEST_BYTES) return new Map();
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    if (manifest?.version !== 1 || !manifest.pages || typeof manifest.pages !== 'object' || Array.isArray(manifest.pages)) return new Map();
    const pages = Object.entries(manifest.pages);
    if (pages.some(([path, hashes]) => !validPagePath(path) || !Array.isArray(hashes)
      || hashes.length > MAX_PAGE_HASHES || hashes.some((hash) => !validHash(hash)))) return new Map();
    return new Map(pages.map(([path, hashes]) => [path, [...new Set(hashes)]]));
  } catch {
    // Missing, unreadable or malformed build metadata must never relax policy.
    return new Map();
  }
}

/** Read trusted build metadata once; select hashes by the resolved static file. */
export function createAppCsp(app) {
  const basePolicy = cspForApp(app);
  // Maps policies keep their separately verified SDK requirements. A manifest
  // cannot broaden them or transfer scripts between app trust boundaries.
  if (!app?.dir || basePolicy !== CSP_POLICIES.default) return () => basePolicy;
  const dir = resolve(app.dir);
  const policies = new Map([...loadPages(dir)].map(([path, hashes]) => [path,
    hashes.length ? basePolicy.replace(/(^|; )script-src ([^;]+)/,
      (_, prefix, sources) => `${prefix}script-src ${sources} ${hashes.join(' ')}`) : basePolicy,
  ]));
  return (filePath) => {
    if (typeof filePath !== 'string' || !isAbsolute(filePath)) return basePolicy;
    const path = relative(dir, filePath);
    if (isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`)) return basePolicy;
    return policies.get(path.split(sep).join('/')) || basePolicy;
  };
}
