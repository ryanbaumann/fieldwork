// gateway/lib/auth.js
//
// Minimal, auditable private-demo authentication.
//
// Design constraints:
//   1. No npm dependencies — only node:crypto.
//   2. No user accounts — a single password per private demo, stored
//      in a server-side env var named in apps.json `auth.envVar`.
//   3. Passwords are never committed or exposed to the browser.
//   4. Constant-time string comparison prevents timing side-channels.
//   5. HMAC-signed cookies avoid per-request password re-entry without
//      needing a session store.  Cookie name uses the `__Host-` prefix
//      (binding to the origin, Secure, no Domain, Path=/) so it can't
//      be scoped to a subpath — we encode the app name *inside* the
//      cookie value instead.
//   6. Lockout/rate-limiting is handled by a dedicated per-IP limiter
//      created in server.js (authRateLimiter).

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// Constant-time string comparison
// ---------------------------------------------------------------------------

/**
 * Constant-time comparison of two strings.  Returns `true` only when both
 * are non-empty and byte-identical.
 */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length === 0 || b.length === 0) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still burn time to avoid leaking length difference via timing.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Password verification
// ---------------------------------------------------------------------------

/**
 * Check a submitted password against the env-var-backed secret for `app`.
 *
 * @param {object} app  - App manifest entry (must have `auth.envVar`).
 * @param {object} env  - Process environment (or test stub).
 * @param {string} password - Candidate password from the login form.
 * @returns {boolean}
 */
export function checkPassword(app, env, password) {
  if (!app?.auth?.envVar) return false;
  const secret = env[app.auth.envVar];
  if (!secret) return false;
  return constantTimeEqual(password, secret);
}

// ---------------------------------------------------------------------------
// HMAC-signed auth cookie
// ---------------------------------------------------------------------------

export const AUTH_COOKIE_NAME = '__Host-demo-auth';

/**
 * Derive a deterministic HMAC key from the demo password itself.
 *
 * This is intentionally simple: the password *is* the shared secret, so
 * using it as the HMAC key is no weaker than the password itself.  A
 * separate signing key would only add value if we wanted to revoke cookies
 * without changing the password; for a portfolio demo that's over-engineering.
 */
function hmacSign(appName, secret) {
  return createHmac('sha256', secret).update(appName).digest('hex');
}

/**
 * Build the cookie value: `appName:hmac`.
 */
function cookieValue(appName, secret) {
  return `${appName}:${hmacSign(appName, secret)}`;
}

/**
 * Set the auth cookie on `response`.
 *
 * Uses `__Host-` prefix which requires Secure, Path=/, no Domain.
 * In local HTTP dev the browser will reject it; that's fine — local
 * devs can set the password env var and rely on form re-posts.
 */
export function setAuthCookie(response, appName, secret) {
  const value = cookieValue(appName, secret);
  response.setHeader('Set-Cookie', [
    `${AUTH_COOKIE_NAME}=${value}; ` +
    'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400',
  ]);
}

/**
 * Verify the auth cookie from the `Cookie` header.
 *
 * @returns {boolean} true if the cookie is present and carries a valid
 *   HMAC for `appName`.
 */
export function verifyAuthCookie(request, appName, secret) {
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return false;

  // Parse cookies (simple; no need for a library).
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const idx = c.indexOf('=');
      if (idx < 0) return [c.trim(), ''];
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    }),
  );

  const raw = cookies[AUTH_COOKIE_NAME];
  if (!raw) return false;

  const colonIdx = raw.indexOf(':');
  if (colonIdx < 0) return false;

  const cookieApp = raw.slice(0, colonIdx);
  const cookieHmac = raw.slice(colonIdx + 1);

  if (cookieApp !== appName) return false;
  return constantTimeEqual(cookieHmac, hmacSign(appName, secret));
}

// ---------------------------------------------------------------------------
// Login page HTML
// ---------------------------------------------------------------------------

/**
 * Returns minimal HTML for the private-demo login form.
 * Pure `<form method="POST">` — no JS required.
 */
export function loginPageHtml(app, errorMsg = '') {
  const title = app.title || app.name;
  const errorBlock = errorMsg
    ? `<p class="error" role="alert">${escapeHtml(errorMsg)}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — ${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#e0e0e0}
.card{max-width:380px;width:100%;padding:2.5rem;border:1px solid #222;border-radius:12px;background:#111}
h1{font-size:1.2rem;margin-bottom:.5rem;color:#fff}
p.desc{font-size:.85rem;color:#888;margin-bottom:1.5rem}
label{display:block;font-size:.85rem;margin-bottom:.4rem;color:#aaa}
input[type=password]{width:100%;padding:.6rem .75rem;border:1px solid #333;border-radius:6px;background:#0a0a0a;color:#e0e0e0;font-size:1rem;outline:none}
input[type=password]:focus{border-color:#4a9eff}
button{width:100%;margin-top:1rem;padding:.65rem;border:none;border-radius:6px;background:#2563eb;color:#fff;font-size:.95rem;cursor:pointer}
button:hover{background:#1d4ed8}
.error{color:#f87171;font-size:.85rem;margin-bottom:1rem;padding:.5rem;border:1px solid #7f1d1d;border-radius:6px;background:#1a0505}
</style>
</head>
<body>
<div class="card">
<h1>${escapeHtml(title)}</h1>
<p class="desc">This demo requires a password to access.</p>
${errorBlock}
<form method="POST" action="${escapeHtml(app.path)}__auth">
<label for="pwd">Password</label>
<input type="password" id="pwd" name="password" autocomplete="current-password" required autofocus>
<button type="submit">Sign in</button>
</form>
</div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Auth POST handler
// ---------------------------------------------------------------------------

/**
 * Read a `application/x-www-form-urlencoded` body (no dependency needed for
 * this one-field form).
 */
function readFormBody(request, maxBytes = 4096) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => {
      if (bytes > maxBytes) return;
      resolve(Object.fromEntries(new URLSearchParams(body)));
    });
    request.on('error', reject);
  });
}

/**
 * Handle POST to `/<app-path>__auth`.
 *
 * On success: sets auth cookie, redirects to the demo.
 * On failure: re-renders the login form with an error message.
 *
 * @param {object} request  - Node IncomingMessage.
 * @param {object} response - Node ServerResponse.
 * @param {object} app      - The matched private-demo manifest entry.
 * @param {object} env      - Process environment (or test stub).
 * @param {Function} applyHeaders - Function that sets security headers.
 * @param {object} [authLimiter] - Rate limiter for auth attempts.
 * @param {string} [ip] - Client IP for rate limiting.
 */
export function handleAuthRequest(request, response, app, env, applyHeaders, authLimiter, ip) {
  return readFormBody(request).then((fields) => {
    // Rate-limit auth attempts per IP.
    if (authLimiter && ip && !authLimiter.check(ip)) {
      applyHeaders(response);
      response.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(loginPageHtml(app, 'Too many attempts. Please wait and try again.'));
      return;
    }

    const password = fields.password || '';
    if (checkPassword(app, env, password)) {
      const secret = env[app.auth.envVar];
      setAuthCookie(response, app.name, secret);
      applyHeaders(response);
      response.writeHead(303, { Location: app.path });
      response.end();
    } else {
      applyHeaders(response);
      response.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(loginPageHtml(app, 'Incorrect password.'));
    }
  });
}
