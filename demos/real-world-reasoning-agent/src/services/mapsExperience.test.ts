import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./places', () => ({
  searchText: vi.fn(async () => [
    {
      id: 'ChIJFallbackPlaceId001',
      name: 'Fallback Coffee',
      location: { lat: 37.7955, lng: -122.3937 },
      formattedAddress: '1 Ferry Building, San Francisco, CA',
    },
  ]),
  placeDetails: vi.fn(async (id: string) => ({
    id,
    name: 'Detailed Place',
    location: { lat: 37.7955, lng: -122.3937 },
  })),
}));

vi.mock('./routes', () => ({
  computeRoute: vi.fn(async () => ({
    path: [{ lat: 37.79, lng: -122.39 }, { lat: 37.8, lng: -122.4 }],
    distanceMeters: 1200,
    durationSeconds: 480,
  })),
}));

vi.mock('./env', () => ({
  weather: vi.fn(async () => ({ tempC: 16, condition: 'Clear' })),
}));

vi.mock('./geocode', () => ({
  geocode: vi.fn(async () => null),
}));

import {
  MCP_ENDPOINT,
  lookupWeatherMcp,
  registerAgenticContentToken,
  resetRegisteredContentTokensForTesting,
  resolveMapsUrlsMcp,
  searchPlacesMcp,
} from './mapsExperience';
import { searchText } from './places';

describe('mapsExperience MCP client & contentToken registration', () => {
  const addContentTokens = vi.fn();

  beforeEach(() => {
    resetRegisteredContentTokensForTesting();
    addContentTokens.mockClear();
    vi.mocked(searchText).mockClear();
    (globalThis as unknown as Record<string, unknown>).google = {
      maps: {
        Settings: {
          getInstance: () => ({ addContentTokens }),
        },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as Record<string, unknown>).google;
    vi.unstubAllGlobals();
  });

  it('registers contentToken idempotently with google.maps.Settings.getInstance()', () => {
    expect(registerAgenticContentToken('token-abc')).toBe(true);
    expect(registerAgenticContentToken('token-abc')).toBe(true);
    expect(addContentTokens).toHaveBeenCalledTimes(1);
    expect(addContentTokens).toHaveBeenCalledWith(['token-abc']);
    expect(registerAgenticContentToken('')).toBe(false);
  });

  it('calls /mcp with JSON-RPC 2.0, normalizes places/ IDs, and registers MCP contentToken', async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 'atlas-mcp-1',
          result: {
            structuredContent: {
              contentToken: 'mcp-agentic-token-1',
              places: [
                {
                  id: 'places/ChIJp2PqN4GAhYARJ_q2VvMvh14',
                  displayName: { text: 'Ferry Building' },
                  location: { latitude: 37.7955, longitude: -122.3937 },
                },
              ],
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const out = await searchPlacesMcp('Ferry Building');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(MCP_ENDPOINT);
    expect(out.source).toBe('mcp');
    expect(out.places[0].id).toBe('ChIJp2PqN4GAhYARJ_q2VvMvh14');
    expect(out.places[0].name).toBe('Ferry Building');
    expect(addContentTokens).toHaveBeenCalledWith(['mcp-agentic-token-1']);
    expect(searchText).not.toHaveBeenCalled();
  });

  it('falls back gracefully to existing SDK/REST helpers when /mcp returns 503 or 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('GMP MCP key is not configured', { status: 503 })),
    );

    const searchResult = await searchPlacesMcp('coffee');
    expect(searchResult.source).toBe('fallback');
    expect(searchResult.places[0].id).toBe('ChIJFallbackPlaceId001');

    const urlResult = await resolveMapsUrlsMcp([
      'https://www.google.com/maps/place/Blue+Bottle+Coffee/@37.7955,-122.3937,17z',
    ]);
    expect(urlResult).toHaveLength(1);
    expect(urlResult[0].id).toBe('ChIJFallbackPlaceId001');

    const wx = await lookupWeatherMcp({ lat: 37.7955, lng: -122.3937 });
    expect(wx.source).toBe('fallback');
    expect(wx.weather?.tempC).toBe(16);
  });
});
