import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allowedGeminiModels,
  capGenerateContentRequest,
  validateGeminiCredential,
  selectGeminiCredential,
  validateMetadata,
  validateMcpRpcRequest,
  toProxyDiagRecord,
  classifyProxyOutcome,
  shouldHeartbeat,
  HEARTBEAT_MS,
  GMP_SOLUTION_ID,
  upstreamHeaders,
} from './lib.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = normalize(join(__dirname, '..'));
const dist = join(root, 'dist');
const port = Number(process.env.PORT || 8080);
const gmpKey = (process.env.GMP_SERVER_KEY || '').trim();
const gmpMcpKey = (process.env.GMP_MCP_KEY || process.env.RWR_GMP_MCP_KEY || '').trim() || gmpKey;
const geminiKey = (process.env.GEMINI_KEY || '').trim();
const aiLimit = Number(process.env.AI_RATE_LIMIT || 36000);
const gmpLimit = Number(process.env.GMP_RATE_LIMIT || 180000);
const mcpLimit = Number(process.env.RWR_MCP_RATE_LIMIT || process.env.MCP_RATE_LIMIT || 120);
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
// Hosted-key budget guard. Defaults bound a UTC day's aggregate request payload
// to ~1.4 MB and allow up to 32,768 output tokens per turn so thinking tokens
// never starve visible output. BYOK traffic bypasses hosted spend caps.
const dailyAiCap = Number(process.env.DAILY_AI_CAP || 50);
const dailyAiInputBytes = Number(process.env.DAILY_AI_INPUT_BYTES || 1_400_000);
const hostedAiMaxOutputTokens = Number(process.env.HOSTED_AI_MAX_OUTPUT_TOKENS || 32_768);
const dailyMcpCap = Number(process.env.RWR_DAILY_MCP_CAP || process.env.DAILY_MCP_CAP || 250);
const dailyVideoCap = Number(process.env.DAILY_VIDEO_CAP || 0);
const bodyCap = Number(process.env.BODY_CAP_BYTES || 1024 * 1024);
const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 60_000);
// Omni video generation (Interactions API) is far slower than a chat/vision turn,
// so its upstream call gets a longer, separately-tunable timeout.
const videoTimeoutMs = Number(process.env.VIDEO_UPSTREAM_TIMEOUT_MS || 300_000);
// Base allowlist plus any comma-separated ids in GENAI_EXTRA_MODELS, so a deployer
// can enable a heavier "omni" chat/image model without editing code.
const allowedModels = allowedGeminiModels(process.env.GENAI_EXTRA_MODELS);
const buckets = new Map();
// Min interval between `ok` proxy heartbeats per endpoint; 0 disables them.
const heartbeatMs = Number(process.env.PROXY_HEARTBEAT_MS ?? HEARTBEAT_MS);
const heartbeats = new Map();
let daily = { day: new Date().toISOString().slice(0, 10), ai: 0, inputBytes: 0, video: 0, mcp: 0 };

const MAX_RATE_BUCKETS = 10_000;
const SAFE_UPSTREAM_RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'etag',
  'last-modified',
  'content-disposition',
  'retry-after',
];
const AI_GENERATE_PATH_RE = /^\/v1(?:beta)?\/models\/([A-Za-z0-9._-]+):(?:streamGenerateContent|generateContent)$/;
const AI_INTERACTIONS_PATH_RE = /^\/v1(?:beta)?\/interactions$/;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
// Cloud Run / GFE appends the real client IP as the LAST X-Forwarded-For hop.
// Ignore untrusted X-Forwarded-For on direct non-GFE sockets unless TRUST_PROXY=true.
function ip(req) {
  const remote = req.socket.remoteAddress || 'unknown';
  const xff = (req.headers['x-forwarded-for'] || '').toString().split(',').map((s) => s.trim()).filter(Boolean);
  if (/^(:{2}ffff:)?169\.254\./i.test(remote) && xff.length >= 1) return xff[xff.length - 1];
  if (process.env.TRUST_PROXY === 'true' && xff.length >= 2) return xff[xff.length - 2];
  return remote;
}
function rate(req, kind, limit) {
  const key = `${kind}:${ip(req)}`;
  const now = Date.now();
  if (!buckets.has(key) && buckets.size >= MAX_RATE_BUCKETS) {
    for (const [entryKey, times] of buckets.entries()) {
      const kept = times.filter((t) => now - t < windowMs);
      if (kept.length === 0) buckets.delete(entryKey);
      else buckets.set(entryKey, kept);
    }
    if (buckets.size >= MAX_RATE_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
  }
  const b = buckets.get(key) || [];
  const fresh = b.filter((t) => now - t < windowMs);
  fresh.push(now);
  buckets.set(key, fresh);
  return fresh.length <= limit;
}
function sameOrigin(req) {
  const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (secFetchSite === 'cross-site') return false;
  const originHeader = req.headers.origin;
  if (originHeader === 'null') return false;
  if (secFetchSite === 'same-origin') return true;
  const host = req.headers.host;
  const source = originHeader || req.headers.referer;
  if (!source) return true;
  try { return Boolean(host) && new URL(source).host === host; } catch { return false; }
}
function appendKey(url, key) { url.searchParams.set('key', key); return url; }
function send(res, status, body, headers = {}) { res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...security(), ...headers }); res.end(body); }
function sendJson(res, status, value) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...security(), 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); }
// Coarsen to the minute so proxy telemetry can't be used for fine-grained
// timing correlation (mirrors TS_BUCKET_MS in src/diagnostics/telemetry.ts).
function minuteBucket() { return Math.floor(Date.now() / 60_000) * 60_000; }
// Emit privacy-safe, structural proxy telemetry. FAILURES are always logged; a
// 2xx would otherwise be dropped (a tile stream would flood logs), so instead we
// emit a rate-limited `ok` HEARTBEAT — at most one per endpoint per interval — so
// the triage loop can tell a healthy, quiet service from a dead/undeployed one.
// Content-free by construction; toProxyDiagRecord fails closed if it ever isn't.
function logProxy(endpoint, status) {
  if (classifyProxyOutcome(status) === 'ok' && !shouldHeartbeat(heartbeats, endpoint, Date.now(), heartbeatMs)) return;
  const rec = toProxyDiagRecord(endpoint, status, minuteBucket());
  if (rec) console.log(JSON.stringify({ evt: 'proxy', ...rec, at: new Date().toISOString() }));
}
// Log the proxy outcome, then send the (usually error) response, in one call so
// gate rejections (429/403/…) become telemetry without repeating the log line.
function sendProxy(res, endpoint, status, body, headers = {}) { logProxy(endpoint, status); return send(res, status, body, headers); }
function security() {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY',
    'permissions-policy': 'camera=(), microphone=(self), geolocation=(self)',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com https://www.google-analytics.com https://www.google.com https://stats.g.doubleclick.net; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.google.com;"
  };
}
async function body(req) { const chunks = []; let total = 0; for await (const c of req) { total += c.length; if (total > bodyCap) throw new Error('body_too_large'); chunks.push(c); } return Buffer.concat(chunks); }
function resetDaily() { const day = new Date().toISOString().slice(0, 10); if (daily.day !== day) daily = { day, ai: 0, inputBytes: 0, video: 0, mcp: 0 }; }
const PHOTO_MEDIA_PATH_RE = /^\/v1\/places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+\/media$/;

function allowedPhotoTarget(raw) {
  try {
    const target = new URL(raw);
    if (
      target.protocol !== 'https:'
      || target.username
      || target.password
      || (target.port && target.port !== '443')
      || target.hostname !== 'places.googleapis.com'
      || hasDotSegment(target.pathname)
      || !PHOTO_MEDIA_PATH_RE.test(target.pathname)
    ) return null;
    const cleanTarget = new URL(target.pathname, 'https://places.googleapis.com');
    for (const name of ['maxWidthPx', 'maxHeightPx']) {
      const values = target.searchParams.getAll(name);
      if (values.length > 1) return null;
      if (values.length === 1) {
        const value = values[0];
        if (!/^\d{1,4}$/.test(value) || Number(value) < 1 || Number(value) > 1_600) return null;
        cleanTarget.searchParams.set(name, value);
      }
    }
    return appendKey(cleanTarget, gmpKey);
  } catch {
    return null;
  }
}

function safeUpstreamHeaders(upstreamHeadersObj) {
  const safe = {};
  for (const name of SAFE_UPSTREAM_RESPONSE_HEADERS) {
    const value = upstreamHeadersObj.get(name);
    if (value) safe[name] = value;
  }
  return safe;
}

async function proxy(req, res, target, opts = {}) {
  const limit = opts.timeoutMs ?? timeoutMs;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), limit);
  try {
    // Callers that must read the body first (e.g. to inspect the model) pass it
    // back in via opts.buffer so we don't try to consume the stream twice.
    const buf = opts.buffer !== undefined ? opts.buffer : (['GET','HEAD'].includes(req.method || '') ? undefined : await body(req));
    // Forward ORIGIN-ONLY referer/origin upstream: a replay link's raw ?prompt=
    // lives in the full Referer URL and must never reach Google (reliability §5).
    // rawHeaders bypasses upstreamHeaders entirely for server-to-server calls
    // that must NOT send browser referer/origin (e.g. MCP API-key auth).
    const hdrs = opts.rawHeaders ?? { ...upstreamHeaders(req.headers, target), ...opts.headers };
    const up = await fetch(target, { method: req.method, headers: hdrs, body: buf, redirect: 'manual', signal: ctrl.signal });
    res.writeHead(up.status, { ...safeUpstreamHeaders(up.headers), ...security() });
    if (opts.endpoint) logProxy(opts.endpoint, up.status);
    if (up.body) { for await (const chunk of up.body) res.write(chunk); }
    res.end();
  } catch (e) {
    // Once the response has started streaming (headers sent) we can't send an
    // error body — a second writeHead throws and leaves the socket open, wedging
    // the client on a silent stream. Destroy it instead so the client sees a
    // failed read and can retry, rather than hanging forever.
    const status = e.message === 'body_too_large' ? 413 : 502;
    if (res.headersSent) res.destroy(e);
    else send(res, status, 'Upstream request failed');
    if (opts.endpoint) logProxy(opts.endpoint, res.headersSent ? 502 : status);
  }
  finally { clearTimeout(timer); }
}

function hasDotSegment(pathname) {
  if (pathname.includes('\\') || /[\u0000-\u001f\u007f]/.test(pathname)) return true;
  for (const segment of pathname.split('/')) {
    if (segment === '.' || segment === '..') return true;
    try {
      const decoded = decodeURIComponent(segment);
      if (decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\')) return true;
    } catch {
      return true;
    }
  }
  return false;
}

// Build a target URL pinned to `host`. Rejects any `rest` that would let the
// WHATWG URL parser override the host or resolve dot-segments (`..`) to a
// disallowed path/model.
function pinnedTarget(rest, query, host) {
  if (!rest.startsWith('/') || rest.startsWith('//') || rest.includes('?') || rest.includes('#')) return null;
  if (hasDotSegment(rest)) return null;
  let target;
  try {
    target = new URL(rest + query, host);
  } catch {
    return null;
  }
  if (target.origin !== host || target.pathname !== rest) return null;
  return target;
}
function gmpTarget(path, query, method) {
  const allowed = [
    ['GET', /^\/gmp\/geocode\/json$/],
    ['POST', /^\/gmp\/airquality\/v1\/currentConditions:lookup$/],
    ['GET', /^\/gmp\/airquality\/v1\/mapTypes\/US_AQI\/heatmapTiles\/\d+\/\d+\/\d+$/],
    ['GET', /^\/gmp\/weather\/v1\/currentConditions:lookup$/],
    ['GET', /^\/gmp\/pollen\/v1\/forecast:lookup$/],
    ['GET', /^\/gmp\/pollen\/v1\/mapTypes\/TREE_UPI\/heatmapTiles\/\d+\/\d+\/\d+$/],
    ['GET', /^\/gmp\/solar\/v1\/buildingInsights:findClosest$/],
    ['GET', /^\/gmp\/streetview\/maps\/api\/streetview(?:\/metadata)?$/],
    ['GET', /^\/gmp\/staticmap\/maps\/api\/staticmap$/],
  ];
  if (!allowed.some(([verb, pattern]) => verb === method && pattern.test(path))) return null;
  let host = 'https://maps.googleapis.com'; let rest = path;
  if (path.startsWith('/gmp/geocode')) rest = '/maps/api/geocode' + path.slice('/gmp/geocode'.length);
  else if (path.startsWith('/gmp/airquality')) { host = 'https://airquality.googleapis.com'; rest = path.slice('/gmp/airquality'.length); }
  else if (path.startsWith('/gmp/weather')) { host = 'https://weather.googleapis.com'; rest = path.slice('/gmp/weather'.length); }
  else if (path.startsWith('/gmp/pollen')) { host = 'https://pollen.googleapis.com'; rest = path.slice('/gmp/pollen'.length); }
  else if (path.startsWith('/gmp/solar')) { host = 'https://solar.googleapis.com'; rest = path.slice('/gmp/solar'.length); }
  else if (path.startsWith('/gmp/streetview')) rest = path.slice('/gmp/streetview'.length);
  else if (path.startsWith('/gmp/staticmap')) rest = path.slice('/gmp/staticmap'.length);
  else return null;
  const target = pinnedTarget(rest, query, host); if (!target) return null;
  return appendKey(target, gmpKey);
}
function aiTarget(path, query) {
  if (!path.startsWith('/ai/')) return null;
  const target = pinnedTarget(path.replace(/^\/ai/, ''), query, 'https://generativelanguage.googleapis.com');
  if (!target) return null;
  const m = target.pathname.match(AI_GENERATE_PATH_RE);
  if (!m || !allowedModels.has(m[1])) return null;
  target.searchParams.delete('key');
  return target;
}
// The omni video model uses the Interactions API, which POSTs to
// `/{version}/interactions` — there is no `models/<id>` in the path, so the model
// to allowlist lives in the request BODY. This only matches the interactions
// collection endpoint (create); per-id sub-paths (/interactions/<id>...) are not
// exposed. The caller checks the body's `model` against allowedModels.
function aiInteractionsTarget(path, query) {
  if (!path.startsWith('/ai/')) return null;
  const target = pinnedTarget(path.replace(/^\/ai/, ''), query, 'https://generativelanguage.googleapis.com');
  if (!target || !AI_INTERACTIONS_PATH_RE.test(target.pathname)) return null;
  target.searchParams.delete('key');
  return target;
}

createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  } catch {
    return send(res, 400, 'Bad Request');
  }
  if (url.pathname === '/capabilities') {
    if (req.method !== 'GET') return send(res, 405, 'Capabilities only accepts GET');
    return sendJson(res, 200, {
      maps: Boolean(gmpKey),
      gemini: Boolean(geminiKey),
      hostedGemini: Boolean(geminiKey),
      mapsGrounding: Boolean(geminiKey),
      groundingLite: Boolean(geminiKey),
    });
  }
  if (url.pathname === '/mcp' || url.pathname === '/api/real-world-reasoning-agent/mcp') {
    resetDaily();
    if (req.method !== 'POST') return sendProxy(res, 'mcp', 405, 'MCP proxy only accepts POST');
    if (!sameOrigin(req) || !rate(req, 'mcp', mcpLimit)) return sendProxy(res, 'mcp', 429, 'The demo is busy right now; try again in a few minutes');
    if (!gmpMcpKey) return sendProxy(res, 'mcp', 503, 'GMP MCP key is not configured');
    let buf;
    try { buf = await body(req); } catch (e) { return sendProxy(res, 'mcp', e.message === 'body_too_large' ? 413 : 400, 'Invalid request body'); }
    let rpc;
    try { rpc = JSON.parse(buf.toString('utf8')); } catch { return sendProxy(res, 'mcp', 400, 'Invalid JSON-RPC request body'); }
    const v = validateMcpRpcRequest(rpc);
    if (!v.ok) return sendProxy(res, 'mcp', v.status, v.reason);
    if (daily.mcp >= dailyMcpCap) return sendProxy(res, 'mcp', 429, 'The shared Maps MCP daily budget is exhausted');
    daily.mcp++;
    return proxy(req, res, new URL('https://mapstools.googleapis.com/mcp'), {
      buffer: buf,
      endpoint: 'mcp',
      rawHeaders: {
        'content-type': 'application/json',
        accept: req.headers.accept || 'application/json, text/event-stream',
        'X-Goog-Api-Key': gmpMcpKey,
        'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
      },
    });
  }
  if (url.pathname.startsWith('/gmp/')) {
    if (!gmpKey) return send(res, 500, 'GMP server key is not configured');
    if (url.pathname === '/gmp/placephoto') {
      if (req.method !== 'GET') return sendProxy(res, 'gmp:photo', 405, 'Photo proxy only accepts GET');
      if (!sameOrigin(req) || !rate(req, 'gmp', gmpLimit * 10)) return sendProxy(res, 'gmp:photo', 429, 'The demo is busy right now — try again in a few minutes');
      const target = allowedPhotoTarget(url.searchParams.get('url') || ''); if (!target) return sendProxy(res, 'gmp:photo', 400, 'Unsupported photo URL');
      return proxy(req, res, target, { endpoint: 'gmp:photo' });
    }
    const isTile = url.pathname.includes('/heatmapTiles/') || url.pathname.includes('/streetview') || url.pathname.includes('/staticmap');
    const endpoint = isTile ? 'gmp:tile' : 'gmp';
    const limit = isTile ? gmpLimit * 10 : gmpLimit;
    if (!sameOrigin(req) || !rate(req, 'gmp', limit)) return sendProxy(res, endpoint, 429, 'The demo is busy right now — try again in a few minutes');
    const target = gmpTarget(url.pathname, url.search, req.method || 'GET'); if (!target) return sendProxy(res, endpoint, 404, 'Unknown GMP proxy route');
    return proxy(req, res, target, { endpoint });
  }
  // Consent-gated browser metadata sink (reliability §5). Accepts ONLY strictly
  // validated, sanitized structural metadata AND only when the client asserts
  // consent (X-Atlas-Consent: 1). Nothing is forwarded to a third party; the
  // server just logs a structured, content-free counter. No consent -> 403.
  if (url.pathname === '/metadata') {
    if (req.method !== 'POST') return send(res, 405, 'Metadata only accepts POST');
    if (!sameOrigin(req) || !rate(req, 'gmp', gmpLimit)) return send(res, 429, 'The demo is busy right now — try again in a few minutes');
    if (req.headers['x-atlas-consent'] !== '1') return send(res, 403, 'Diagnostics consent required');
    let buf;
    try { buf = await body(req); } catch (e) { return send(res, e.message === 'body_too_large' ? 413 : 400, 'Invalid request body'); }
    let payload;
    try { payload = JSON.parse(buf.toString('utf8')); } catch { return send(res, 400, 'Invalid metadata JSON'); }
    const v = validateMetadata(payload);
    if (!v.ok) return send(res, 400, `Rejected metadata: ${v.reason}`);
    // Log the VALIDATED, content-free sanitized batch so the telemetry-triage job
    // can cluster it from production logs. validateMetadata has already proven the
    // payload is structural-only (no urls/coords/ids/prompt) — never its content.
    console.log(JSON.stringify({ evt: 'diag_batch', records: payload, at: new Date().toISOString() }));
    return send(res, 204, '');
  }
  if (url.pathname.startsWith('/ai/')) {
    resetDaily();
    if (req.method !== 'POST') return send(res, 405, 'AI proxy only accepts POST');
    if (!sameOrigin(req) || !rate(req, 'ai', aiLimit)) return sendProxy(res, 'ai', 429, 'The demo is busy right now — try again in a few minutes');
    const credential = selectGeminiCredential(req.headers, geminiKey);
    if (credential.source === 'invalid') return sendProxy(res, 'ai', 401, 'Gemini key is invalid');
    if (credential.source === 'none') return sendProxy(res, 'ai', 500, 'Gemini key is not configured');

    if (url.pathname === '/ai/validate') {
      const result = await validateGeminiCredential(credential.key);
      const status = result.ok ? 200
        : result.reason === 'invalid' ? 401
          : result.reason === 'quota' ? 429
            : result.reason === 'model_unavailable' ? 424
              : 502;
      return sendJson(res, status, result);
    }

    // The hosted demo has a shared spend cap. A personal key uses its owner's
    // project quota while remaining subject to this service's per-IP rate limit.
    if (credential.source === 'hosted' && daily.ai >= dailyAiCap) {
      return sendProxy(res, 'ai', 429, 'The demo is busy right now — try again in a few minutes');
    }
    // Interactions API (omni video): the model lives in the body, so buffer +
    // parse it, enforce the same allowlist, then forward with the longer video timeout.
    const interTarget = aiInteractionsTarget(url.pathname, url.search);
    if (interTarget) {
      let buf;
      try { buf = await body(req); } catch (e) { return send(res, e.message === 'body_too_large' ? 413 : 400, 'Invalid request body'); }
      let model;
      try { model = JSON.parse(buf.toString('utf8'))?.model; } catch { return send(res, 400, 'Invalid interactions request body'); }
      if (typeof model !== 'string' || !allowedModels.has(model)) return sendProxy(res, 'ai', 403, 'AI model or method is not allowed');
      if (credential.source === 'hosted' && daily.video >= dailyVideoCap) {
        return sendProxy(res, 'ai', 429, 'Video generation requires a personal Gemini API key on this demo');
      }
      if (credential.source === 'hosted' && daily.inputBytes + buf.length > dailyAiInputBytes) {
        return sendProxy(res, 'ai', 429, 'The hosted Gemini daily budget is exhausted — connect a personal key to continue');
      }
      if (credential.source === 'hosted') {
        daily.ai++;
        daily.video++;
        daily.inputBytes += buf.length;
      }
      return proxy(req, res, interTarget, {
        buffer: buf,
        timeoutMs: videoTimeoutMs,
        endpoint: 'ai',
        headers: { 'x-goog-api-key': credential.key },
      });
    }
    const target = aiTarget(url.pathname, url.search); if (!target) return sendProxy(res, 'ai', 403, 'AI model or method is not allowed');
    let buf;
    try { buf = await body(req); } catch (e) { return send(res, e.message === 'body_too_large' ? 413 : 400, 'Invalid request body'); }
    if (credential.source === 'hosted') {
      if (daily.inputBytes + buf.length > dailyAiInputBytes) {
        return sendProxy(res, 'ai', 429, 'The hosted Gemini daily budget is exhausted — connect a personal key to continue');
      }
      try { buf = capGenerateContentRequest(buf, hostedAiMaxOutputTokens); }
      catch { return sendProxy(res, 'ai', 400, 'Invalid Gemini request body'); }
      daily.ai++;
      daily.inputBytes += buf.length;
    }
    return proxy(req, res, target, { buffer: buf, endpoint: 'ai', headers: { 'x-goog-api-key': credential.key } });
  }
  let reqPath;
  try {
    let p = decodeURIComponent(url.pathname);
    if (p.startsWith('/labs/atlas')) p = p.slice('/labs/atlas'.length);
    reqPath = normalize(p === '' || p === '/' ? '/index.html' : p);
  }
  catch { return send(res, 400, 'Bad Request'); }
  const file = normalize(join(dist, reqPath));
  const safe = file === dist || file.startsWith(dist + sep); const finalFile = safe && existsSync(file) && statSync(file).isFile() ? file : join(dist, 'index.html');
  // Fall back to 404 if the SPA shell isn't built (e.g. tests run before `build`)
  // rather than serving a missing file — an unhandled stream error would crash
  // the whole process.
  if (!existsSync(finalFile)) return send(res, 404, 'Not found');
  const ext = extname(finalFile); const cache = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
  res.writeHead(200, { ...security(), 'content-type': mime[ext] || 'application/octet-stream', 'cache-control': cache });
  const stream = createReadStream(finalFile);
  // A read error after headers are sent can't become an error response; destroy
  // the socket instead of letting the unhandled 'error' crash the process.
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}).listen(port, () => console.log(`Atlas server listening on :${port}`));
