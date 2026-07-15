import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleStravaApi, handlePhotoProxy, isAllowedPhotoUrl } from '../lib/strava.js';

test('handleStravaApi returns 400 for a missing code, even with no key configured', async () => {
  const result = await handleStravaApi(
    { pathname: '/api/strava/token', method: 'POST', body: {} },
    { env: {} },
  );
  assert.equal(result.statusCode, 400);
});

test('handleStravaApi returns 400 for a missing refresh_token, even with no key configured', async () => {
  const result = await handleStravaApi(
    { pathname: '/api/strava/refresh', method: 'POST', body: {} },
    { env: {} },
  );
  assert.equal(result.statusCode, 400);
});

test('handleStravaApi returns 503 for a well-formed token request when no key is configured', async () => {
  const result = await handleStravaApi(
    { pathname: '/api/strava/token', method: 'POST', body: { code: 'abc123' } },
    { env: {} },
  );
  assert.equal(result.statusCode, 503);
});

test('isAllowedPhotoUrl only allows the CloudFront photo host over https', () => {
  assert.equal(isAllowedPhotoUrl('https://dgtzuqphqg23d.cloudfront.net/photo.jpg'), true);
  assert.equal(isAllowedPhotoUrl('http://dgtzuqphqg23d.cloudfront.net/photo.jpg'), false);
  assert.equal(isAllowedPhotoUrl('https://evil.example.com/photo.jpg'), false);
  assert.equal(isAllowedPhotoUrl('https://user:pass@dgtzuqphqg23d.cloudfront.net/photo.jpg'), false);
  assert.equal(isAllowedPhotoUrl('https://dgtzuqphqg23d.cloudfront.net:444/photo.jpg'), false);
  assert.equal(isAllowedPhotoUrl('not a url'), false);
});

test('handlePhotoProxy rejects redirects outside the allowlist', async () => {
  const fetch = async () => ({
    status: 302,
    headers: new Headers({ location: 'https://evil.example.com/photo.jpg' }),
  });
  await assert.rejects(
    handlePhotoProxy('https://dgtzuqphqg23d.cloudfront.net/photo.jpg', { fetch, maxPhotoBytes: 1024 }),
    (error) => error.statusCode === 502,
  );
});

test('handlePhotoProxy follows a bounded allowlisted redirect', async () => {
  let calls = 0;
  let redirectBodyCancelled = false;
  const signals = [];
  const fetch = async (_url, options) => {
    calls += 1;
    signals.push(options.signal);
    if (calls === 1) {
      return {
        status: 302,
        headers: new Headers({ location: '/final.jpg' }),
        body: { cancel: async () => { redirectBodyCancelled = true; } },
      };
    }
    return {
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': '4' }),
      arrayBuffer: async () => new ArrayBuffer(4),
    };
  };
  const result = await handlePhotoProxy('https://dgtzuqphqg23d.cloudfront.net/photo.jpg', { fetch, maxPhotoBytes: 1024 });
  assert.equal(calls, 2);
  assert.equal(redirectBodyCancelled, true);
  assert.equal(signals[0], signals[1]);
  assert.equal(result.body.byteLength, 4);
});

test('handlePhotoProxy stops reading a streamed body at the byte limit', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(700));
      controller.enqueue(new Uint8Array(700));
      controller.close();
    },
  });
  const fetch = async () => new Response(body, { headers: { 'content-type': 'image/jpeg' } });
  await assert.rejects(
    handlePhotoProxy('https://dgtzuqphqg23d.cloudfront.net/photo.jpg', { fetch, maxPhotoBytes: 1024 }),
    (error) => error.statusCode === 413,
  );
});

test('handleStravaApi returns 400 for unsupported photo URL', async () => {
  const result = await handleStravaApi(
    { pathname: '/api/strava/photo', method: 'GET', searchParams: new URLSearchParams('url=https://evil.example.com/photo.jpg') },
    { env: {} },
  );
  assert.equal(result.statusCode, 400);
  assert.equal(result.json.error, 'Invalid or unsupported photo URL.');
});
