import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleInfographicAgentApi,
  validateInfographicApiKey,
} from '../lib/infographicAgent.js';

test('validateInfographicApiKey validates API keys correctly', () => {
  assert.equal(validateInfographicApiKey('AIzaSyValidGeminiKey123'), 'AIzaSyValidGeminiKey123');
  assert.equal(validateInfographicApiKey('short'), null);
  assert.equal(validateInfographicApiKey(null), null);
  assert.equal(validateInfographicApiKey(undefined), null);
  assert.equal(validateInfographicApiKey(''), null);
});

test('handleInfographicAgentApi returns 404 for unknown path', async () => {
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/unknown',
    method: 'POST',
    body: {},
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
  });
  assert.equal(result.statusCode, 404);
  assert.match(result.json.error, /Unknown infographic-agent API route/);
});

test('handleInfographicAgentApi /prepare rejects missing topic', async () => {
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: {},
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
  });
  assert.equal(result.statusCode, 400);
  assert.match(result.json.error, /Topic or content text is required/);
});

test('handleInfographicAgentApi /render rejects missing prompt', async () => {
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/render',
    method: 'POST',
    body: {},
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
  });
  assert.equal(result.statusCode, 400);
  assert.match(result.json.error, /A prompt or edit instruction is required/);
});

test('handleInfographicAgentApi /prepare formats Interactions API request correctly with generation_config', async () => {
  let upstreamUrl;
  let upstreamInit;
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: {
      topic: 'Global solar capacity 2024',
      mode: 'data-story',
      aspect: '16:9',
    },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
    fetchImpl: async (url, init) => {
      upstreamUrl = url;
      upstreamInit = init;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          steps: [{
            type: 'model_output',
            content: [{
              type: 'text',
              text: JSON.stringify({
                analysis: { title: 'Solar Boom', dataPointsCount: 5 },
                prompt: 'Infographic about solar power...',
              }),
            }],
          }],
        }),
      };
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(upstreamUrl, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.equal(upstreamInit.headers['Api-Revision'], '2026-05-20');
  assert.equal(upstreamInit.headers['x-goog-api-key'], 'AIzaSyValidGeminiKey123');
  const payload = JSON.parse(upstreamInit.body);
  assert.equal(payload.model, 'gemini-3.8-flash');
  assert.equal(payload.store, false);
  assert.deepEqual(payload.generation_config, { thinking_level: 'low' });
  assert.equal(result.json.analysis.title, 'Solar Boom');
  assert.equal(result.json.prompt, 'Infographic about solar power...');
});

test('handleInfographicAgentApi maps upstream 429 to 503 FREE_TIER_UNAVAILABLE for hosted credential', async () => {
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: {
      topic: 'Space travel',
      mode: 'data-story',
      aspect: '16:9',
    },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Resource exhausted', code: 429 } }),
    }),
  });

  assert.equal(result.statusCode, 503);
  assert.equal(result.json.code, 'FREE_TIER_UNAVAILABLE');
  assert.match(result.json.error, /shared Gemini allowance is temporarily unavailable/i);
});

test('handleInfographicAgentApi maps upstream 429 to 429 GEMINI_QUOTA_EXHAUSTED for personal credential', async () => {
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: {
      topic: 'Space travel',
      mode: 'data-story',
      aspect: '16:9',
    },
    apiKey: 'AIzaSyPersonalGeminiKey123',
    credentialSource: 'personal',
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Quota exceeded', code: 429 } }),
    }),
  });

  assert.equal(result.statusCode, 429);
  assert.equal(result.json.code, 'GEMINI_QUOTA_EXHAUSTED');
  assert.match(result.json.error, /reached its provider quota/i);
});

test('handleInfographicAgentApi /render respects imageModel and previousImageBase64', async () => {
  let upstreamBody;
  const result = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/render',
    method: 'POST',
    body: {
      prompt: 'Refine this infographic',
      imageModel: 'gemini-3.1-flash-lite-image',
      previousImageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'hosted',
    fetchImpl: async (url, init) => {
      upstreamBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          steps: [{
            type: 'model_output',
            content: [{
              type: 'image',
              data: 'AQID',
              mime_type: 'image/png',
            }],
          }],
        }),
      };
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(upstreamBody.model, 'gemini-3.1-flash-lite-image');
  assert.equal(upstreamBody.input.length, 2);
  assert.equal(upstreamBody.input[0].type, 'image');
  assert.equal(upstreamBody.input[0].mime_type, 'image/png');
  assert.equal(upstreamBody.input[1].type, 'text');
  assert.equal(result.json.model, 'gemini-3.1-flash-lite-image');
});

test('handleInfographicAgentApi upstream 403, 429, and 500 do not leak details or raw body to client', async () => {
  const secretLeakedString = 'SUPER_SECRET_INTERNAL_SERVER_DETAILS_XYZ';

  // 403 upstream
  const res403 = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: { topic: 'test' },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'personal',
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: secretLeakedString }),
    }),
  });
  assert.equal(res403.statusCode, 401);
  assert.equal(res403.json.details, undefined);
  assert.equal(JSON.stringify(res403.json).includes(secretLeakedString), false);

  // 429 upstream
  const res429 = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: { topic: 'test' },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'personal',
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: secretLeakedString }),
    }),
  });
  assert.equal(res429.statusCode, 429);
  assert.equal(res429.json.details, undefined);
  assert.equal(JSON.stringify(res429.json).includes(secretLeakedString), false);

  // 500 upstream
  const res500 = await handleInfographicAgentApi({
    pathname: '/api/infographic-agent/prepare',
    method: 'POST',
    body: { topic: 'test' },
    apiKey: 'AIzaSyValidGeminiKey123',
    credentialSource: 'personal',
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: secretLeakedString }),
    }),
  });
  assert.equal(res500.statusCode, 500);
  assert.equal(res500.json.details, undefined);
  assert.equal(JSON.stringify(res500.json).includes(secretLeakedString), false);
});


