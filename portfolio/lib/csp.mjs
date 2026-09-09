import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// This scans our generated HTML, not user input. Hash the exact inline script
// text the browser sees (HTML normalizes line endings). Event handlers are
// deliberately excluded; they must use addEventListener instead.
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/(?:^|\s)src\s*=/i.test(attributes) || !body.trim()) continue;
    const typeMatch = attributes.match(/(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
    const type = (typeMatch?.[1] ?? typeMatch?.[2] ?? typeMatch?.[3] ?? '').trim().toLowerCase();
    if (type && type !== 'module' && !/^(?:text|application)\/(?:java|ecma)script(?:1\.[0-5])?$/.test(type)) continue;
    const hash = createHash('sha256').update(body.replace(/\r\n?/g, '\n')).digest('base64');
    hashes.add(`'sha256-${hash}'`);
  }
  return [...hashes];
}

export function writeCspManifest(directory) {
  const pages = {};
  for (const file of readdirSync(directory, { recursive: true }).sort()) {
    if (!file.endsWith('.html')) continue;
    pages[file.replaceAll('\\', '/')] = inlineScriptHashes(readFileSync(join(directory, file), 'utf8'));
  }
  writeFileSync(join(directory, 'csp-hashes.json'), `${JSON.stringify({ version: 1, pages }, null, 2)}\n`);
}
