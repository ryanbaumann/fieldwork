/**
 * Google Maps Experience MCP JSON-RPC 2.0 client (`/api/real-world-reasoning-agent/mcp`)
 * with Agentic Data Visualization `contentToken` registration and automatic
 * fallback to the browser Maps JS SDK / REST helpers when MCP is unavailable.
 */
import type { LatLng, PlaceLite, RouteResult, TravelMode, WeatherNow } from '@/lib/types';
import { isValidPlaceId, normalizePlaceId } from '@/lib/mapsUrl';
import { searchText, placeDetails, type TextSearchOpts } from './places';
import { computeRoute, type RouteOpts } from './routes';
import { weather } from './env';
import { geocode } from './geocode';

export const MCP_ENDPOINT = '/api/real-world-reasoning-agent/mcp';

export type MapsMcpToolName =
  | 'search_places'
  | 'search_along_route'
  | 'compute_routes'
  | 'lookup_weather'
  | 'resolve_names'
  | 'resolve_maps_urls';

interface JsonRpcResponse {
  jsonrpc?: string;
  id?: string | number | null;
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    structuredContent?: unknown;
    isError?: boolean;
    _meta?: Record<string, unknown>;
    [key: string]: unknown;
  };
  error?: {
    code?: number;
    message?: string;
  };
}

let rpcCounter = 0;
const registeredTokens = new Set<string>();

/**
 * Register an Agentic Data Visualization `contentToken` with the Google Maps JS SDK
 * (`google.maps.Settings.getInstance().addContentTokens([contentToken])`).
 * Safe to call repeatedly or before the Maps JS SDK has booted.
 */
export function registerAgenticContentToken(contentToken?: string): boolean {
  const token = typeof contentToken === 'string' ? contentToken.trim() : '';
  if (!token) return false;
  const settings = (
    globalThis as unknown as {
      google?: {
        maps?: {
          Settings?: {
            getInstance?: () => { addContentTokens?: (tokens: string[]) => void };
          };
        };
      };
    }
  ).google?.maps?.Settings?.getInstance?.();

  if (typeof settings?.addContentTokens !== 'function') {
    return false;
  }
  if (!registeredTokens.has(token)) {
    registeredTokens.add(token);
    settings.addContentTokens([token]);
  }
  return true;
}

/** Test-only helper to clear the in-memory token dedupe cache. */
export function resetRegisteredContentTokensForTesting(): void {
  registeredTokens.clear();
}

function collectAndRegisterContentTokens(node: unknown, depth = 0): string | undefined {
  if (!node || typeof node !== 'object' || depth > 5) return undefined;
  let found: string | undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const token = collectAndRegisterContentTokens(item, depth + 1);
      if (!found && token) found = token;
    }
    return found;
  }
  const record = node as Record<string, unknown>;
  for (const key of ['contentToken', 'content_token']) {
    if (typeof record[key] === 'string' && record[key].trim()) {
      const token = (record[key] as string).trim();
      registerAgenticContentToken(token);
      if (!found) found = token;
    }
  }
  if (Array.isArray(record.contentTokens)) {
    for (const t of record.contentTokens) {
      if (typeof t === 'string' && t.trim()) {
        const token = t.trim();
        registerAgenticContentToken(token);
        if (!found) found = token;
      }
    }
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const token = collectAndRegisterContentTokens(value, depth + 1);
      if (!found && token) found = token;
    }
  }
  return found;
}

function parseSseJsonRpc(rawText: string): JsonRpcResponse | null {
  const lines = rawText.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload) as JsonRpcResponse;
      if (parsed && typeof parsed === 'object' && ('result' in parsed || 'error' in parsed)) {
        return parsed;
      }
    } catch {
      // Keep scanning earlier SSE data frames.
    }
  }
  return null;
}

function unwrapMcpResult(rpc: JsonRpcResponse): Record<string, unknown> {
  if (rpc.error) {
    throw new Error(rpc.error.message || `MCP error ${rpc.error.code ?? ''}`);
  }
  const result = rpc.result;
  if (!result || result.isError) {
    throw new Error('MCP tool returned an error result');
  }
  collectAndRegisterContentTokens(result);

  if (result.structuredContent && typeof result.structuredContent === 'object' && !Array.isArray(result.structuredContent)) {
    return result.structuredContent as Record<string, unknown>;
  }

  if (Array.isArray(result.content)) {
    for (const part of result.content) {
      if (part?.type === 'text' && typeof part.text === 'string') {
        try {
          const parsed = JSON.parse(part.text);
          collectAndRegisterContentTokens(parsed);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
          if (Array.isArray(parsed)) {
            return { items: parsed };
          }
        } catch {
          // Non-JSON text block; continue scanning.
        }
      }
    }
  }

  return result;
}

export async function callMapsMcpTool(
  name: MapsMcpToolName,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  rpcCounter += 1;
  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `atlas-mcp-${rpcCounter}`,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`MCP HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const rpc: JsonRpcResponse | null = contentType.includes('text/event-stream')
    ? parseSseJsonRpc(text)
    : (JSON.parse(text) as JsonRpcResponse);

  if (!rpc) {
    throw new Error('Empty MCP JSON-RPC response');
  }
  return unwrapMcpResult(rpc);
}

function toLatLng(raw: unknown): LatLng | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const lat = typeof rec.lat === 'number' ? rec.lat : typeof rec.latitude === 'number' ? rec.latitude : null;
  const lng = typeof rec.lng === 'number' ? rec.lng : typeof rec.longitude === 'number' ? rec.longitude : null;
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function toPlaceLite(raw: unknown): PlaceLite | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const id = normalizePlaceId(rec.placeId ?? rec.place_id ?? rec.id ?? rec.name);
  if (!id) return null;
  const displayName =
    typeof rec.displayName === 'string'
      ? rec.displayName
      : typeof (rec.displayName as { text?: string } | undefined)?.text === 'string'
        ? (rec.displayName as { text: string }).text
        : typeof rec.title === 'string'
          ? rec.title
          : typeof rec.name === 'string' && !rec.name.startsWith('places/')
            ? rec.name
            : 'Selected place';
  const loc = toLatLng(rec.location ?? rec.latLng ?? rec.coordinates) ?? { lat: 0, lng: 0 };
  return {
    id,
    name: displayName,
    location: loc,
    formattedAddress:
      typeof rec.formattedAddress === 'string'
        ? rec.formattedAddress
        : typeof rec.address === 'string'
          ? rec.address
          : undefined,
    rating: typeof rec.rating === 'number' ? rec.rating : undefined,
    userRatingCount: typeof rec.userRatingCount === 'number' ? rec.userRatingCount : undefined,
    primaryType: typeof rec.primaryType === 'string' ? rec.primaryType : undefined,
    googleMapsUri:
      typeof rec.googleMapsUri === 'string'
        ? rec.googleMapsUri
        : typeof rec.googleMapsURI === 'string'
          ? rec.googleMapsURI
          : typeof rec.url === 'string'
            ? rec.url
            : undefined,
    websiteUri: typeof rec.websiteUri === 'string' ? rec.websiteUri : undefined,
  };
}

function extractPlacesArray(payload: Record<string, unknown>): PlaceLite[] {
  const candidates =
    (Array.isArray(payload.places) && payload.places) ||
    (Array.isArray(payload.results) && payload.results) ||
    (Array.isArray(payload.items) && payload.items) ||
    (Array.isArray(payload.resolvedPlaces) && payload.resolvedPlaces) ||
    [];
  const out: PlaceLite[] = [];
  for (const entry of candidates) {
    const nested =
      entry && typeof entry === 'object' && 'place' in (entry as Record<string, unknown>)
        ? (entry as Record<string, unknown>).place
        : entry;
    const mapped = toPlaceLite(nested);
    if (mapped) out.push(mapped);
  }
  return out;
}

export async function searchPlacesMcp(
  query: string,
  opts: TextSearchOpts = {},
): Promise<{ places: PlaceLite[]; contentToken?: string; source: 'mcp' | 'fallback' }> {
  try {
    const payload = await callMapsMcpTool('search_places', {
      textQuery: query,
      ...(opts.near
        ? {
            locationBias: {
              circle: {
                center: { latitude: opts.near.lat, longitude: opts.near.lng },
                radius: opts.radius ?? 8000,
              },
            },
          }
        : {}),
      ...(opts.maxResults ? { maxResultCount: Math.min(opts.maxResults, 20) } : {}),
      ...(opts.openNow ? { openNow: true } : {}),
    });
    const places = extractPlacesArray(payload);
    if (places.length > 0) {
      const contentToken = typeof payload.contentToken === 'string' ? payload.contentToken : undefined;
      return { places, contentToken, source: 'mcp' };
    }
  } catch {
    // Graceful fallback to JS SDK Places search below.
  }
  const places = await searchText(query, opts);
  return { places, source: 'fallback' };
}

export async function searchAlongRouteMcp(
  query: string,
  origin: LatLng | string,
  destination: LatLng | string,
  opts: { travelMode?: TravelMode; maxResults?: number } = {},
): Promise<{ places: PlaceLite[]; contentToken?: string; source: 'mcp' | 'fallback' }> {
  try {
    const payload = await callMapsMcpTool('search_along_route', {
      textQuery: query,
      origin,
      destination,
      travelMode: opts.travelMode ?? 'DRIVE',
      maxResultCount: Math.min(opts.maxResults ?? 8, 20),
    });
    const places = extractPlacesArray(payload);
    if (places.length > 0) {
      const contentToken = typeof payload.contentToken === 'string' ? payload.contentToken : undefined;
      return { places, contentToken, source: 'mcp' };
    }
  } catch {
    // Graceful fallback: compute route midpoint and run Places text search.
  }
  const route = await computeRoute(origin, destination, { travelMode: opts.travelMode }).catch(() => null);
  const mid = route?.path.length ? route.path[Math.floor(route.path.length / 2)] : undefined;
  const places = await searchText(query, { near: mid, maxResults: opts.maxResults ?? 8 });
  return { places, source: 'fallback' };
}

export async function computeRoutesMcp(
  origin: LatLng | string,
  destination: LatLng | string,
  opts: RouteOpts = {},
): Promise<{ route: RouteResult | null; contentToken?: string; source: 'mcp' | 'fallback' }> {
  try {
    const payload = await callMapsMcpTool('compute_routes', {
      origin,
      destination,
      travelMode: opts.travelMode ?? 'DRIVE',
    });
    const rawRoutes = Array.isArray(payload.routes) ? payload.routes : [payload];
    const first = rawRoutes[0] as Record<string, unknown> | undefined;
    if (first && typeof first === 'object') {
      const rawPath = Array.isArray(first.path) ? first.path : [];
      const path = rawPath.map(toLatLng).filter((pt): pt is LatLng => pt !== null);
      const distanceMeters = typeof first.distanceMeters === 'number' ? first.distanceMeters : undefined;
      const durationSeconds =
        typeof first.durationSeconds === 'number'
          ? first.durationSeconds
          : typeof first.duration === 'string' && first.duration.endsWith('s')
            ? Number.parseFloat(first.duration)
            : undefined;
      if (distanceMeters !== undefined && durationSeconds !== undefined && Number.isFinite(durationSeconds)) {
        // If MCP omitted polyline vertices, enrich with JS SDK path when available so map polylines still draw.
        const fullPath = path.length > 0
          ? path
          : (await computeRoute(origin, destination, opts).catch(() => null))?.path ?? [];
        const contentToken = typeof payload.contentToken === 'string' ? payload.contentToken : undefined;
        return {
          route: { path: fullPath, distanceMeters, durationSeconds },
          contentToken,
          source: 'mcp',
        };
      }
    }
  } catch {
    // Graceful fallback to JS SDK Routes below.
  }
  const route = await computeRoute(origin, destination, opts);
  return { route, source: 'fallback' };
}

export async function lookupWeatherMcp(
  loc: LatLng,
): Promise<{ weather: WeatherNow | undefined; source: 'mcp' | 'fallback' }> {
  try {
    const payload = await callMapsMcpTool('lookup_weather', {
      location: { latitude: loc.lat, longitude: loc.lng },
    });
    const temp =
      typeof payload.tempC === 'number'
        ? payload.tempC
        : typeof (payload.temperature as { degrees?: number } | undefined)?.degrees === 'number'
          ? (payload.temperature as { degrees: number }).degrees
          : undefined;
    if (temp !== undefined) {
      const condition =
        typeof payload.condition === 'string'
          ? payload.condition
          : typeof (payload.weatherCondition as { description?: { text?: string } } | undefined)?.description?.text === 'string'
            ? (payload.weatherCondition as { description: { text: string } }).description.text
            : 'Current conditions';
      return {
        weather: { tempC: temp, condition },
        source: 'mcp',
      };
    }
  } catch {
    // Graceful fallback to /gmp/weather REST helper below.
  }
  const wx = await weather(loc);
  return { weather: wx, source: 'fallback' };
}

export async function resolveNamesMcp(
  names: readonly string[],
  opts: { near?: LatLng } = {},
): Promise<PlaceLite[]> {
  const cleanNames = names.map((n) => n.trim()).filter(Boolean).slice(0, 20);
  if (cleanNames.length === 0) return [];

  try {
    const payload = await callMapsMcpTool('resolve_names', {
      names: cleanNames,
      ...(opts.near
        ? { locationBias: { latitude: opts.near.lat, longitude: opts.near.lng } }
        : {}),
    });
    const resolved = extractPlacesArray(payload).filter((p) => isValidPlaceId(p.id));
    if (resolved.length > 0) return resolved;
  } catch {
    // Graceful fallback to Places text search / Geocoding below.
  }

  const out: PlaceLite[] = [];
  for (const name of cleanNames) {
    const hits = await searchText(name, { near: opts.near, maxResults: 1 }).catch(() => []);
    if (hits[0] && isValidPlaceId(hits[0].id)) {
      out.push(hits[0]);
      continue;
    }
    const geo = await geocode(name).catch(() => null);
    if (geo?.placeId && isValidPlaceId(geo.placeId)) {
      out.push({
        id: normalizePlaceId(geo.placeId),
        name,
        location: geo.location,
        formattedAddress: geo.formattedAddress,
      });
    }
  }
  return out;
}

function decodeSlugFromMapsPlaceUrl(rawUrl: string): { query?: string; near?: LatLng } {
  try {
    const parsed = new URL(rawUrl);
    const q = parsed.searchParams.get('q') ?? parsed.searchParams.get('query');
    const coordsMatch = parsed.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    const near = coordsMatch
      ? { lat: Number.parseFloat(coordsMatch[1]), lng: Number.parseFloat(coordsMatch[2]) }
      : undefined;
    if (q && q.trim()) return { query: q.trim(), near };

    const placeSlug = parsed.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeSlug?.[1]) {
      const decoded = decodeURIComponent(placeSlug[1].replace(/\+/g, ' ')).trim();
      if (decoded) return { query: decoded, near };
    }
    return { near };
  } catch {
    return {};
  }
}

export async function resolveMapsUrlsMcp(
  urls: readonly string[],
  opts: { near?: LatLng } = {},
): Promise<PlaceLite[]> {
  const cleanUrls = urls.map((u) => u.trim()).filter(Boolean).slice(0, 20);
  if (cleanUrls.length === 0) return [];

  try {
    const payload = await callMapsMcpTool('resolve_maps_urls', { urls: cleanUrls });
    const resolved = extractPlacesArray(payload).filter((p) => isValidPlaceId(p.id));
    if (resolved.length > 0) {
      // Enrich missing coordinates if MCP returned Place IDs without lat/lng.
      const enriched: PlaceLite[] = [];
      for (const item of resolved) {
        if (item.location.lat === 0 && item.location.lng === 0) {
          const detail = await placeDetails(item.id).catch(() => null);
          enriched.push(detail ?? item);
        } else {
          enriched.push(item);
        }
      }
      return enriched;
    }
  } catch {
    // Graceful fallback for decodable full google.com/maps/place/... URLs below.
  }

  const out: PlaceLite[] = [];
  for (const url of cleanUrls) {
    const { query, near } = decodeSlugFromMapsPlaceUrl(url);
    if (!query) continue;
    const hits = await searchText(query, { near: near ?? opts.near, maxResults: 1 }).catch(() => []);
    if (hits[0] && isValidPlaceId(hits[0].id)) {
      out.push(hits[0]);
    }
  }
  return out;
}
