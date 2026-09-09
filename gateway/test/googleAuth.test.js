import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  beginGoogleLogin,
  finishGoogleLogin,
  GOOGLE_AUTH_COOKIE,
  hasGoogleSession,
} from '../lib/googleAuth.js';
import { server } from '../server.js';

const env = {
  GOOGLE_OAUTH_CLIENT_ID: 'fixture-client',
  GOOGLE_OAUTH_CLIENT_SECRET: 'fixture-client-secret',
  GOOGLE_OAUTH_SESSION_SECRET: 'fixture-session-secret',
  GOOGLE_OAUTH_ALLOWED_EMAIL: 'writer@example.test',
  WRITER_PUBLIC_ORIGIN: 'https://example.test',
};

function responseRecorder() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; } };
}

function loginRequest() {
  const response = responseRecorder();
  const url = new URL(beginGoogleLogin({ headers: {} }, response, env));
  return {
    request: { headers: { cookie: response.headers['Set-Cookie'].split(';')[0] } },
    params: new URLSearchParams({ state: url.searchParams.get('state'), code: 'fixture-code' }),
  };
}

function claims(overrides = {}) {
  return {
    email: env.GOOGLE_OAUTH_ALLOWED_EMAIL,
    email_verified: 'true',
    aud: env.GOOGLE_OAUTH_CLIENT_ID,
    iss: 'https://accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    ...overrides,
  };
}

function provider(payload) {
  return async (url) => {
    const target = new URL(url);
    assert.equal(target.origin, 'https://oauth2.googleapis.com');
    if (target.pathname === '/token') return { ok: true, json: async () => ({ id_token: 'fixture-token' }) };
    assert.equal(target.pathname, '/tokeninfo');
    return { ok: true, json: async () => payload };
  };
}

test('Google sign-in accepts verified boolean/string claims and numeric/string expiry', async () => {
  for (const email_verified of [true, 'true']) {
    for (const exp of [Math.floor(Date.now() / 1000) + 3600, String(Math.floor(Date.now() / 1000) + 3600)]) {
      const { request, params } = loginRequest();
      const response = responseRecorder();
      await finishGoogleLogin(request, response, params, env, provider(claims({ email_verified, exp })));
      const cookies = response.headers['Set-Cookie'];
      const cookie = cookies.find((value) => value.startsWith(`${GOOGLE_AUTH_COOKIE}=`));
      assert.match(cookie, /HttpOnly; Secure; SameSite=Lax; Path=\//);
      assert.equal(hasGoogleSession({ headers: { cookie: cookie.split(';')[0] } }, env), true);
      assert.ok(cookies.some((value) => value.startsWith('__Host-writer-state=;')));
    }
  }
});

test('Google sign-in denies unverified and malformed verification claims before creating a session', async () => {
  for (const email_verified of [false, 'false', '', undefined, null, 1, 'TRUE', [], {}]) {
    const { request, params } = loginRequest();
    const response = responseRecorder();
    await assert.rejects(
      finishGoogleLogin(request, response, params, env, provider(claims({ email_verified }))),
      { statusCode: 403 },
      `email_verified ${JSON.stringify(email_verified)} must be denied`,
    );
    assert.equal(response.headers['Set-Cookie'], undefined);
  }
});

test('Google sign-in denies expired, absent and malformed expiry claims', async () => {
  const expired = Math.floor(Date.now() / 1000) - 1;
  for (const exp of [expired, String(expired), undefined, null, '', 'future', 'Infinity', Infinity, NaN, 1e30, expired + 3600.5, [], {}, true]) {
    const { request, params } = loginRequest();
    const response = responseRecorder();
    await assert.rejects(
      finishGoogleLogin(request, response, params, env, provider(claims({ exp }))),
      { statusCode: 403 },
      `exp ${JSON.stringify(exp)} must be denied`,
    );
    assert.equal(response.headers['Set-Cookie'], undefined);
  }
});

test('Google sign-in still rejects other users, audiences, issuers, and invalid state', async () => {
  for (const invalid of [{ email: 'other@example.test' }, { aud: 'other-client' }, { iss: 'https://other.example.test' }]) {
    const { request, params } = loginRequest();
    await assert.rejects(finishGoogleLogin(request, responseRecorder(), params, env, provider(claims(invalid))), { statusCode: 403 });
  }
  const { request, params } = loginRequest();
  params.set('state', 'wrong-state');
  await assert.rejects(finishGoogleLogin(request, responseRecorder(), params, env, async () => assert.fail('Invalid state must not reach Google')), { statusCode: 401 });
});

function get(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: '127.0.0.1', port, path, headers }, (response) => {
      response.resume();
      response.on('end', () => resolve(response));
    });
    request.on('error', reject);
  });
}

test('Google callback HTTP boundary grants only verified claims access to the private writer', async (context) => {
  const previous = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  Object.assign(process.env, env);
  let payload = claims();
  context.mock.method(globalThis, 'fetch', async (...args) => provider(payload)(...args));
  context.mock.method(console, 'error', () => {});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const deniedWriter = await get(port, '/writer/');
    assert.equal(deniedWriter.statusCode, 401);
    for (const email_verified of ['true', 'false']) {
      payload = claims({ email_verified });
      const { request, params } = loginRequest();
      const callback = await get(port, `/auth/google/callback?${params}`, request.headers);
      if (email_verified === 'true') {
        assert.equal(callback.statusCode, 303);
        assert.equal(callback.headers.location, '/writer/');
        assert.ok(callback.headers['set-cookie'].some((value) => value.startsWith(`${GOOGLE_AUTH_COOKIE}=`)));
      } else {
        assert.ok(callback.statusCode >= 400);
        assert.equal(callback.headers['set-cookie'], undefined);
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
