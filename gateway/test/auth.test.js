import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  constantTimeEqual,
  checkPassword,
  AUTH_COOKIE_NAME,
  setAuthCookie,
  verifyAuthCookie,
  loginPageHtml,
  handleAuthRequest,
} from '../lib/auth.js';

import { toPublicApp, appVisibility } from '../lib/apps.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal mock ServerResponse that captures headers and body. */
function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    headersSent: false,
    setHeader(key, value) { res.headers[key] = value; },
    writeHead(code, headers = {}) {
      res.statusCode = code;
      Object.assign(res.headers, headers);
      res.headersSent = true;
    },
    end(data = '') { res.body += data; },
  };
  return res;
}

/** Minimal mock IncomingMessage with cookie support. */
function mockRequest({ cookies = '', method = 'GET' } = {}) {
  return {
    method,
    headers: cookies ? { cookie: cookies } : {},
    socket: { remoteAddress: '127.0.0.1' },
  };
}

/** Build a valid HMAC cookie value for testing. */
function validCookieValue(appName, secret) {
  const hmac = createHmac('sha256', secret).update(appName).digest('hex');
  return `${appName}:${hmac}`;
}

function noop() {}

// ---------------------------------------------------------------------------
// constantTimeEqual
// ---------------------------------------------------------------------------

describe('constantTimeEqual', () => {
  test('returns true for identical strings', () => {
    assert.equal(constantTimeEqual('hello', 'hello'), true);
  });

  test('returns false for different strings of same length', () => {
    assert.equal(constantTimeEqual('hello', 'world'), false);
  });

  test('returns false for different lengths', () => {
    assert.equal(constantTimeEqual('short', 'longer-string'), false);
  });

  test('returns false for empty strings', () => {
    assert.equal(constantTimeEqual('', ''), false);
    assert.equal(constantTimeEqual('a', ''), false);
    assert.equal(constantTimeEqual('', 'a'), false);
  });

  test('returns false for non-string inputs', () => {
    assert.equal(constantTimeEqual(null, 'a'), false);
    assert.equal(constantTimeEqual('a', undefined), false);
    assert.equal(constantTimeEqual(123, 'abc'), false);
  });
});

// ---------------------------------------------------------------------------
// checkPassword
// ---------------------------------------------------------------------------

describe('checkPassword', () => {
  const app = { auth: { envVar: 'MY_DEMO_PASSWORD' } };

  test('returns true for correct password', () => {
    const env = { MY_DEMO_PASSWORD: 's3cret' };
    assert.equal(checkPassword(app, env, 's3cret'), true);
  });

  test('returns false for wrong password', () => {
    const env = { MY_DEMO_PASSWORD: 's3cret' };
    assert.equal(checkPassword(app, env, 'wrong'), false);
  });

  test('returns false when env var is missing', () => {
    assert.equal(checkPassword(app, {}, 's3cret'), false);
  });

  test('returns false when app has no auth config', () => {
    assert.equal(checkPassword({}, {}, 'x'), false);
    assert.equal(checkPassword({ auth: {} }, {}, 'x'), false);
  });
});

// ---------------------------------------------------------------------------
// Auth cookie
// ---------------------------------------------------------------------------

describe('setAuthCookie', () => {
  test('sets a __Host-demo-auth cookie with secure flags', () => {
    const res = mockResponse();
    setAuthCookie(res, 'my-demo', 'secret123');
    const cookie = res.headers['Set-Cookie'];
    assert.ok(Array.isArray(cookie));
    const val = cookie[0];
    assert.ok(val.startsWith(`${AUTH_COOKIE_NAME}=my-demo:`));
    assert.ok(val.includes('HttpOnly'));
    assert.ok(val.includes('Secure'));
    assert.ok(val.includes('SameSite=Strict'));
    assert.ok(val.includes('Path=/'));
  });
});

describe('verifyAuthCookie', () => {
  const secret = 'test-secret';
  const appName = 'secure-demo';

  test('returns true for a valid cookie', () => {
    const value = validCookieValue(appName, secret);
    const req = mockRequest({ cookies: `${AUTH_COOKIE_NAME}=${value}` });
    assert.equal(verifyAuthCookie(req, appName, secret), true);
  });

  test('returns false for wrong app name in cookie', () => {
    const value = validCookieValue('other-app', secret);
    const req = mockRequest({ cookies: `${AUTH_COOKIE_NAME}=${value}` });
    assert.equal(verifyAuthCookie(req, appName, secret), false);
  });

  test('returns false for tampered HMAC', () => {
    const value = `${appName}:deadbeef`;
    const req = mockRequest({ cookies: `${AUTH_COOKIE_NAME}=${value}` });
    assert.equal(verifyAuthCookie(req, appName, secret), false);
  });

  test('returns false when cookie is absent', () => {
    const req = mockRequest();
    assert.equal(verifyAuthCookie(req, appName, secret), false);
  });

  test('returns false when cookie header is empty', () => {
    const req = mockRequest({ cookies: '' });
    // Empty cookie string => no cookies header
    req.headers = {};
    assert.equal(verifyAuthCookie(req, appName, secret), false);
  });
});

// ---------------------------------------------------------------------------
// loginPageHtml
// ---------------------------------------------------------------------------

describe('loginPageHtml', () => {
  const app = { name: 'secret-demo', title: 'Secret Demo', path: '/secret-demo/' };

  test('produces valid HTML with form', () => {
    const html = loginPageHtml(app);
    assert.ok(html.includes('<form'));
    assert.ok(html.includes('method="POST"'));
    assert.ok(html.includes('action="/secret-demo/__auth"'));
    assert.ok(html.includes('type="password"'));
    assert.ok(html.includes('Secret Demo'));
  });

  test('includes error message when provided', () => {
    const html = loginPageHtml(app, 'Incorrect password.');
    assert.ok(html.includes('Incorrect password.'));
    assert.ok(html.includes('role="alert"'));
  });

  test('escapes HTML in error messages', () => {
    const html = loginPageHtml(app, '<script>alert(1)</script>');
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });
});

// ---------------------------------------------------------------------------
// appVisibility / toPublicApp filtering
// ---------------------------------------------------------------------------

describe('appVisibility', () => {
  test('defaults to public when visibility is absent', () => {
    assert.equal(appVisibility({ name: 'foo' }), 'public');
  });

  test('recognises public, unlisted, private', () => {
    assert.equal(appVisibility({ visibility: 'public' }), 'public');
    assert.equal(appVisibility({ visibility: 'unlisted' }), 'unlisted');
    assert.equal(appVisibility({ visibility: 'private' }), 'private');
  });

  test('is case-insensitive', () => {
    assert.equal(appVisibility({ visibility: 'PRIVATE' }), 'private');
  });

  test('falls back to public for unknown values', () => {
    assert.equal(appVisibility({ visibility: 'weirdo' }), 'public');
  });
});

describe('toPublicApp visibility filtering', () => {
  const base = {
    name: 'demo', title: 'Demo', description: 'A demo',
    path: '/demo/', tags: [], preview: null, available: true,
  };

  test('includes public apps (default)', () => {
    assert.notEqual(toPublicApp(base), null);
  });

  test('includes explicitly public apps', () => {
    assert.notEqual(toPublicApp({ ...base, visibility: 'public' }), null);
  });

  test('excludes unlisted apps', () => {
    assert.equal(toPublicApp({ ...base, visibility: 'unlisted' }), null);
  });

  test('excludes private apps', () => {
    assert.equal(toPublicApp({ ...base, visibility: 'private' }), null);
  });
});

// ---------------------------------------------------------------------------
// handleAuthRequest (integration-style)
// ---------------------------------------------------------------------------

describe('handleAuthRequest', () => {
  const app = {
    name: 'private-demo',
    title: 'Private Demo',
    path: '/private-demo/',
    auth: { type: 'password', envVar: 'PRIVATE_DEMO_PW' },
  };
  const env = { PRIVATE_DEMO_PW: 'correct-password' };

  /** Create a mock request that emits form-urlencoded body chunks. */
  function mockPostRequest(body) {
    const listeners = {};
    return {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      socket: { remoteAddress: '10.0.0.1' },
      on(event, fn) {
        listeners[event] = fn;
        // Simulate body delivery on next tick.
        if (event === 'end') {
          process.nextTick(() => {
            if (body) listeners.data?.(Buffer.from(body));
            listeners.end?.();
          });
        }
      },
      destroy() {},
    };
  }

  test('sets cookie and redirects on correct password', async () => {
    const req = mockPostRequest('password=correct-password');
    const res = mockResponse();
    await handleAuthRequest(req, res, app, env, noop);
    assert.equal(res.statusCode, 303);
    assert.equal(res.headers.Location, '/private-demo/');
    assert.ok(res.headers['Set-Cookie']);
  });

  test('returns 403 and login form on wrong password', async () => {
    const req = mockPostRequest('password=wrong');
    const res = mockResponse();
    await handleAuthRequest(req, res, app, env, noop);
    assert.equal(res.statusCode, 403);
    assert.ok(res.body.includes('Incorrect password'));
  });

  test('returns 429 when rate limiter blocks', async () => {
    // Create a limiter that always blocks.
    const alwaysBlocked = { check: () => false };
    const req = mockPostRequest('password=anything');
    const res = mockResponse();
    await handleAuthRequest(req, res, app, env, noop, alwaysBlocked, '1.2.3.4');
    assert.equal(res.statusCode, 429);
    assert.ok(res.body.includes('Too many attempts'));
  });
});
