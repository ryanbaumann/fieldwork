import { describe, test, expect, vi } from 'vitest';
import {
  exchangeCode,
  refreshToken,
  deauthorize,
  handlePhotoProxy
} from '../server/broker.js';
import {
  isOriginAllowed,
  corsHeaders,
  checkRateLimit,
  resolveClientIp,
} from '../server/server.js';

describe('server/broker.js (Strava API Handlers)', () => {
  test('exchangeCode: happy path code exchange', async () => {
    const mockResponse = { access_token: 'abc', refresh_token: 'def' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await exchangeCode({ code: 'test-code' }, {
      clientId: '123',
      clientSecret: 'secret',
      fetch: mockFetch,
      tokenUrl: 'https://test.strava.com/oauth/token',
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('https://test.strava.com/oauth/token');
    expect(calledOptions.body.toString()).toContain('code=test-code');
    expect(calledOptions.body.toString()).toContain('client_id=123');
    expect(calledOptions.body.toString()).toContain('client_secret=secret');
  });

  test('exchangeCode: missing parameters returning 400', async () => {
    await expect(exchangeCode({}, {
      clientId: '123',
      clientSecret: 'secret',
      fetch: vi.fn(),
      tokenUrl: 'https://test.strava.com/oauth/token',
    })).rejects.toThrowError('Missing authorization code.');
  });

  test('refreshToken: happy path', async () => {
    const mockResponse = { access_token: 'new-abc', refresh_token: 'new-def' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await refreshToken({ refresh_token: 'old-refresh' }, {
      clientId: '123',
      clientSecret: 'secret',
      fetch: mockFetch,
      tokenUrl: 'https://test.strava.com/oauth/token',
    });

    expect(result).toEqual(mockResponse);
    expect(calledOptions => mockFetch.mock.calls[0][1].body.toString().includes('refresh_token=old-refresh'));
  });

  test('refreshToken: missing parameter returning 400', async () => {
    await expect(refreshToken({}, {
      clientId: '123',
      clientSecret: 'secret',
      fetch: vi.fn(),
      tokenUrl: 'https://test.strava.com/oauth/token',
    })).rejects.toThrowError('Missing refresh token.');
  });
});

describe('server/broker.js (Photo Proxy Rules)', () => {
  const allowedHost = 'dgtzuqphqg23d.cloudfront.net';

  test('handlePhotoProxy: happy path', async () => {
    const buffer = new ArrayBuffer(100);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '100'
      }),
      arrayBuffer: async () => buffer
    });

    const result = await handlePhotoProxy(`https://${allowedHost}/photo.jpg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost])
    });

    expect(result.contentType).toBe('image/jpeg');
    expect(result.body).toBe(buffer);
  });

  test('handlePhotoProxy: block SVGs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'image/svg+xml',
        'content-length': '100'
      })
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.svg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost])
    })).rejects.toThrowError('Photo URL did not return a supported image type.');
  });

  test('handlePhotoProxy: size limit content-length', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '5000'
      })
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.png`, {
      fetch: mockFetch,
      maxPhotoBytes: 1000,
      hosts: new Set([allowedHost])
    })).rejects.toThrowError('Photo is too large to proxy.');
  });

  test('handlePhotoProxy: size limit actual buffer size', async () => {
    const buffer = new ArrayBuffer(5000);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '100' // lied in headers
      }),
      arrayBuffer: async () => buffer
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.png`, {
      fetch: mockFetch,
      maxPhotoBytes: 1000,
      hosts: new Set([allowedHost])
    })).rejects.toThrowError('Photo is too large to proxy.');
  });

  test('handlePhotoProxy: non-image content type', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/html'
      })
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/page.html`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost])
    })).rejects.toThrowError('Photo URL did not return a supported image type.');
  });

  test('handlePhotoProxy: 504 on abort/timeout', async () => {
    const timeoutError = new Error('The operation was aborted.');
    timeoutError.name = 'TimeoutError';
    const mockFetch = vi.fn().mockRejectedValue(timeoutError);

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.jpg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost])
    })).rejects.toSatisfy((err) => {
      return err.statusCode === 504 && err.message === 'Failed to fetch photo from upstream.';
    });
  });

  test('handlePhotoProxy: blocks cross-host redirect SSRF via redirect: manual', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 302,
      ok: false,
      headers: new Headers({
        location: 'http://169.254.169.254/computeMetadata/v1/',
      }),
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.jpg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost]),
    })).rejects.toSatisfy((err) => err.statusCode === 502 && /redirect/i.test(err.message));
    expect(mockFetch.mock.calls[0][1].redirect).toBe('manual');
  });

  test('handlePhotoProxy: rejects missing content-type header instead of defaulting to image/jpeg', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({}),
      arrayBuffer: async () => new ArrayBuffer(16),
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.jpg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1024 * 1024,
      hosts: new Set([allowedHost]),
    })).rejects.toSatisfy((err) => err.statusCode === 415);
  });

  test('handlePhotoProxy: cancels streaming response body when chunks exceed maxPhotoBytes', async () => {
    const cancel = vi.fn();
    let reads = 0;
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      body: {
        getReader: () => ({
          cancel,
          read: async () => {
            reads += 1;
            return { done: false, value: new Uint8Array(600) };
          },
        }),
      },
    });

    await expect(handlePhotoProxy(`https://${allowedHost}/photo.jpg`, {
      fetch: mockFetch,
      maxPhotoBytes: 1000,
      hosts: new Set([allowedHost]),
    })).rejects.toSatisfy((err) => err.statusCode === 413);
    expect(reads).toBe(2);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe('server/server.js (Security / CORS & Rate Limiting)', () => {
  test('resolveClientIp ignores spoofed X-Forwarded-For unless behind trusted proxy', () => {
    const untrusted = {
      headers: { 'x-forwarded-for': '203.0.113.10, 198.51.100.2' },
      socket: { remoteAddress: '198.51.100.2' },
    };
    expect(resolveClientIp(untrusted, {})).toBe('198.51.100.2');

    const cloudRun = {
      headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.99, 34.102.0.1' },
      socket: { remoteAddress: '169.254.1.1' },
    };
    expect(resolveClientIp(cloudRun, {})).toBe('203.0.113.99');
  });
  test('isOriginAllowed and CORS headers', () => {
    // Since allowedOrigins is imported, let's see how it behaves
    // By default, ALLOWED_ORIGIN isn't set in test environment, so allowedOrigins is empty
    expect(isOriginAllowed('http://localhost:3000')).toBe(false);

    // Let's test corsHeaders returning correct format
    const headers = corsHeaders('http://localhost:3000');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });

  test('checkRateLimit limit enforcement', () => {
    const ip = '192.168.1.100';
    // first 30 should succeed
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
    // 31st request should be blocked (return false)
    expect(checkRateLimit(ip)).toBe(false);
  });
});
