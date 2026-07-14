#!/usr/bin/env node
// serve.mjs — tiny static preview server for dist/. Zero dependencies.
// Rebuild with `node build.mjs` after editing content; this just serves files.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('./dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 4000);

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.pdf', 'application/pdf'],
  ['.json', 'application/json; charset=utf-8'],
]);

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let filePath = normalize(join(DIST, pathname)).replace(/\\/g, '/');
  if (!filePath.startsWith(DIST.replace(/\/$/, ''))) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (filePath.endsWith('/')) filePath += 'index.html';

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': MIME.get(extname(filePath)) || 'application/octet-stream' });
    response.end(body);
  } catch {
    try {
      const body = await readFile(join(filePath, 'index.html'));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found. Run `node build.mjs` first.');
    }
  }
}).listen(PORT, () => {
  console.log(`[portfolio] preview at http://localhost:${PORT}/`);
});
