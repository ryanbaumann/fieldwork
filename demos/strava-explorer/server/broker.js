// server/broker.js

export const allowedPhotoHosts = new Set([
  'dgtzuqphqg23d.cloudfront.net',
]);

export function isAllowedPhotoUrl(rawUrl, hosts = allowedPhotoHosts) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && hosts.has(url.hostname);
  } catch {
    return false;
  }
}

async function postForm(url, params, token, { fetch }) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: params,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('Strava postForm fetch error:', err);
    const error = new Error('Upstream request timed out or failed.');
    error.statusCode = err.name === 'TimeoutError' || err.name === 'AbortError' ? 504 : 502;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`Strava request failed: ${response.status} ${response.statusText}`, data);
    const error = new Error('Strava request failed.');
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export async function exchangeCode(body, { clientId, clientSecret, fetch, tokenUrl }) {
  if (!body?.code) {
    const error = new Error('Missing authorization code.');
    error.statusCode = 400;
    throw error;
  }
  return postForm(tokenUrl, new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: body.code,
    grant_type: 'authorization_code',
  }), null, { fetch });
}

export async function refreshToken(body, { clientId, clientSecret, fetch, tokenUrl }) {
  if (!body?.refresh_token) {
    const error = new Error('Missing refresh token.');
    error.statusCode = 400;
    throw error;
  }
  return postForm(tokenUrl, new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: body.refresh_token,
    grant_type: 'refresh_token',
  }), null, { fetch });
}

export async function deauthorize(body, authHeader, { fetch, deauthorizeUrl }) {
  const token = body?.access_token || authHeader?.replace(/^Bearer\s+/i, '') || '';
  if (!token) {
    const error = new Error('Missing access token.');
    error.statusCode = 400;
    throw error;
  }
  return postForm(deauthorizeUrl, new URLSearchParams({}), token, { fetch });
}

export async function handlePhotoProxy(photoUrl, { fetch, maxPhotoBytes, hosts = allowedPhotoHosts }) {
  if (!photoUrl || !isAllowedPhotoUrl(photoUrl, hosts)) {
    const error = new Error('Invalid or unsupported photo URL.');
    error.statusCode = 400;
    throw error;
  }

  let upstream;
  let currentUrl = photoUrl;
  try {
    // One deadline covers the entire redirect chain so each hop cannot reset
    // the upstream budget, and `redirect: 'manual'` ensures an allowlisted CDN
    // cannot redirect to a disallowed or internal host.
    const requestSignal = AbortSignal.timeout(10000);
    for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
      upstream = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'fieldwork-photo-proxy/1.0',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        redirect: 'manual',
        signal: requestSignal,
      });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      if (upstream.body?.cancel) {
        try {
          await upstream.body.cancel();
        } catch {
          // Response body may already be closed; redirect validation still runs.
        }
      }
      const location = upstream.headers.get('location');
      const nextUrl = location ? new URL(location, currentUrl).href : '';
      if (!isAllowedPhotoUrl(nextUrl, hosts) || redirectCount === 3) {
        const error = new Error('Photo redirect was invalid or unsupported.');
        error.statusCode = 502;
        throw error;
      }
      currentUrl = nextUrl;
    }
  } catch (err) {
    if (err.statusCode) throw err;
    console.error('Photo proxy upstream fetch error:', err);
    const error = new Error('Failed to fetch photo from upstream.');
    error.statusCode = err.name === 'TimeoutError' || err.name === 'AbortError' ? 504 : 502;
    throw error;
  }

  if (!upstream.ok) {
    console.error(`Upstream returned non-ok status: ${upstream.status} ${upstream.statusText}`);
    const error = new Error('Photo request failed.');
    error.statusCode = upstream.status === 404 ? 404 : 502;
    throw error;
  }

  const contentType = (upstream.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
  if (!allowedMimeTypes.has(contentType)) {
    console.error(`Forbidden content type: ${contentType}`);
    const error = new Error('Photo URL did not return a supported image type.');
    error.statusCode = 415;
    throw error;
  }

  const contentLength = Number(upstream.headers.get('content-length') || 0);
  if (contentLength > maxPhotoBytes) {
    console.error(`Content length exceeds max allowed bytes: ${contentLength} > ${maxPhotoBytes}`);
    const error = new Error('Photo is too large to proxy.');
    error.statusCode = 413;
    throw error;
  }

  const photoBuffer = await readBodyWithLimit(upstream, maxPhotoBytes);

  return {
    contentType,
    body: photoBuffer,
  };
}

async function readBodyWithLimit(response, maxBytes) {
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength <= maxBytes) return buffer;
    const error = new Error('Photo is too large to proxy.');
    error.statusCode = 413;
    throw error;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      const error = new Error('Photo is too large to proxy.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}
