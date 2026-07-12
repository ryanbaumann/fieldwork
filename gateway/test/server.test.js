import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server } from '../server.js';

test('server includes CORS headers on photo proxy binary response', async () => {
  server.listen(0);
  const port = server.address().port;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    return {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '10',
      }),
      arrayBuffer: async () => new ArrayBuffer(10),
    };
  };

  try {
    const res = await new Promise((resolve) => {
      http.get(`http://localhost:${port}/api/strava/photo?url=https://dgtzuqphqg23d.cloudfront.net/test.jpg`, resolve);
    });
    
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-allow-origin'], '*');
    assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin');
    
  } finally {
    globalThis.fetch = originalFetch;
    server.close();
  }
});
