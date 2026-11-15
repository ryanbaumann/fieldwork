import { genai } from '@/ai/client';
import { MODELS, getThinkingConfig } from '@/lib/config';
import { haversine } from '@/lib/geo';
import type {
  ExplorerAttribution,
  GroundedPlace,
  GroundingResult,
  MapsGroundingProvider,
} from '@/explorer/contracts';
import { mapsReady } from './maps';
import { placesProvider } from './places';
import { routesProvider } from './routes';
import { weather } from './env';
import { isValidPlaceId, normalizePlaceId } from '@/lib/mapsUrl';

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function failure(cause: unknown): GroundingResult<never> {
  if (cause instanceof DOMException && cause.name === 'AbortError') return { status: 'cancelled' };
  if (cause && typeof cause === 'object' && 'name' in cause && cause.name === 'AbortError') return { status: 'cancelled' };
  return { status: 'failure', message: 'Grounded map evidence is unavailable.', retryable: true };
}

interface GroundingChunkMaps {
  title?: string;
  uri?: string;
  placeId?: string;
  text?: string;
}

interface GroundingChunk {
  maps?: GroundingChunkMaps;
  web?: { uri?: string; title?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
  googleMapsWidgetContextToken?: string;
}

function cleanMapsTitle(rawTitle: string): string {
  return rawTitle.replace(/\s+-\s+Google\s+Maps$/i, '').trim();
}

function isReviewChunk(rawTitle: string, uri: string): boolean {
  return /\/maps\/reviews\//i.test(uri) || /^review\s+of\s+/i.test(rawTitle.trim());
}

/** Extracts candidate coordinate hints from grounded text if present. */
function parseCoordinatesFromText(text: string, title: string): { lat: number; lng: number } | undefined {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleIndex = text.search(new RegExp(escapedTitle, 'i'));
  const searchSlice = titleIndex >= 0 ? text.slice(titleIndex, titleIndex + 250) : text;

  // Match **Location:** 37.79, -122.39 or (37.79, -122.39) or lat: 37.79, lng: -122.39
  const pattern = /(?:(?:\*\*location:\*\*|lat(?:itude)?)[:\s]+)?(-?\d{1,2}\.\d{3,7})[,\s]+(?:lng|long(?:itude)?[:\s]+)?(-?\d{1,3}\.\d{3,7})/i;
  const match = searchSlice.match(pattern);
  if (match) {
    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return undefined;
}

function cancellationFromSignal(signal?: AbortSignal) {
  return {
    get aborted() {
      return Boolean(signal?.aborted);
    },
    subscribe: (fn: () => void) => {
      signal?.addEventListener('abort', fn);
      return () => signal?.removeEventListener('abort', fn);
    },
  };
}

export const mapsGroundingProvider: MapsGroundingProvider = {
  async searchPlaces(input, signal) {
    if (signal?.aborted) return { status: 'cancelled' };
    try {
      // Fast primary path in live browsers: query Places API (New) directly (~250ms)
      // for canonical Place IDs and exact coordinates, falling back to Gemini Maps Grounding.
      if (mapsReady()) {
        const cancellation = cancellationFromSignal(signal);
        let placesOutcome = await placesProvider.searchText(
          { query: input.query, near: input.near, radius: 1500, maxResults: 8 },
          { cancellation },
        );
        if (signal?.aborted || placesOutcome.status === 'cancelled') return { status: 'cancelled' };
        if (placesOutcome.status === 'empty') {
          placesOutcome = await placesProvider.searchText(
            { query: input.query, near: input.near, radius: 8000, maxResults: 8 },
            { cancellation },
          );
          if (signal?.aborted || placesOutcome.status === 'cancelled') return { status: 'cancelled' };
        }
        if (placesOutcome.status === 'success' || placesOutcome.status === 'partial') {
          const seen = new Set<string>();
          const directPlaces: GroundedPlace[] = placesOutcome.value
            .filter((place): place is typeof place & { location: { lat: number; lng: number } } => Boolean(
              place.id
              && place.location
              && Number.isFinite(place.location.lat)
              && Number.isFinite(place.location.lng),
            ))
            .filter((place) => {
              if (seen.has(place.id)) return false;
              seen.add(place.id);
              return true;
            })
            .sort((a, b) => haversine(input.near, a.location) - haversine(input.near, b.location))
            .slice(0, 5)
            .map((place) => {
              const placeUrl = place.googleMapsUri && place.googleMapsUri.startsWith('https://')
                ? place.googleMapsUri
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.id)}`;
              return {
                id: place.id,
                label: place.name,
                location: place.location,
                placeUrl,
                attribution: { title: place.name, url: placeUrl },
              };
            });
          if (directPlaces.length > 0) {
            return { status: 'success', value: directPlaces };
          }
        }
      }

      const thinkingConfig = getThinkingConfig(MODELS.utility, 'simpleUi');
      const prompt = [
        `Find 3 to 5 real places matching "${input.query}" near latitude ${input.near.lat}, longitude ${input.near.lng}.`,
        'For each place, provide its name and approximate latitude and longitude coordinates.',
        'Return a concise summary highlighting your recommendations.',
      ].join('\n');

      const response = await genai().models.generateContent({
        model: MODELS.utility,
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: input.near.lat, longitude: input.near.lng },
            },
          },
          ...(thinkingConfig ? { thinkingConfig } : {}),
          ...(signal ? { abortSignal: signal } : {}),
        },
      });

      if (signal?.aborted) return { status: 'cancelled' };

      const candidate = response.candidates?.[0];
      const metadata = candidate?.groundingMetadata as GroundingMetadata | undefined;
      const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : [];
      const summary = typeof response.text === 'string' && response.text.trim() ? response.text.trim() : undefined;

      const seenPlaces = new Set<string>();
      const places: GroundedPlace[] = chunks.flatMap((chunk, index) => {
        const maps = chunk.maps;
        if (!maps) return [];
        const rawTitle = typeof maps.title === 'string' && maps.title.trim() ? maps.title.trim() : undefined;
        const uri = typeof maps.uri === 'string' && maps.uri.startsWith('https://') ? maps.uri : undefined;
        const placeId = typeof maps.placeId === 'string' && maps.placeId.trim() ? maps.placeId.trim() : undefined;
        const chunkText = typeof maps.text === 'string' && maps.text.trim() ? maps.text.trim() : undefined;

        if (!rawTitle || !uri || isReviewChunk(rawTitle, uri)) return [];
        const title = cleanMapsTitle(rawTitle);
        if (!title) return [];

        const dedupeKey = placeId ?? uri;
        if (seenPlaces.has(dedupeKey)) return [];
        seenPlaces.add(dedupeKey);

        const parsedCoords = (chunkText ? parseCoordinatesFromText(chunkText, title) : undefined)
          ?? (summary ? parseCoordinatesFromText(summary, title) : undefined);
        // Jitter slightly if coordinates are derived from near center so candidate markers are distinct
        const angle = (index * 2 * Math.PI) / Math.max(chunks.length, 1);
        const fallbackLat = input.near.lat + (0.002 * Math.cos(angle));
        const fallbackLng = input.near.lng + (0.002 * Math.sin(angle));
        const location = parsedCoords ?? { lat: fallbackLat, lng: fallbackLng };

        const id = placeId ?? `grounded-place-${index + 1}`;
        const attribution: ExplorerAttribution = { title, url: uri };

        return [{
          id,
          label: title,
          location,
          placeUrl: uri,
          attribution,
        }];
      });

      if (places.length > 0) {
        return { status: 'success', value: places, ...(summary ? { summary } : {}) };
      }
      return { status: 'empty' };
    } catch (cause) {
      return failure(cause);
    }
  },

  async computeRoute(input, signal) {
    if (signal?.aborted) return { status: 'cancelled' };
    try {
      const normalizedPlaceId = normalizePlaceId(input.destinationPlaceId);
      const hasRealPlaceId = Boolean(normalizedPlaceId) && (
        isValidPlaceId(normalizedPlaceId) ||
        normalizedPlaceId.startsWith('ChIJ') ||
        /^(?:ChIJ|Eh[A-Za-z0-9]|Ei[A-Za-z0-9])[A-Za-z0-9_-]{4,}$/.test(normalizedPlaceId)
      );
      const destination = hasRealPlaceId
        ? normalizedPlaceId
        : (input.destinationLocation ?? input.destinationPlaceId);
      const cancellation = cancellationFromSignal(signal);

      let result = await routesProvider.computeRoute(
        { origin: input.origin, destination, travelMode: input.travelMode },
        { cancellation },
      );

      if (
        hasRealPlaceId
        && result.status !== 'success'
        && result.status !== 'cancelled'
        && !signal?.aborted
        && input.destinationLocation
      ) {
        result = await routesProvider.computeRoute(
          { origin: input.origin, destination: input.destinationLocation, travelMode: input.travelMode },
          { cancellation },
        );
      }

      if (signal?.aborted || result.status === 'cancelled') return { status: 'cancelled' };
      if (result.status === 'success' && result.value) {
        const distanceMeters = finite(result.value.distanceMeters) ?? 0;
        const durationSeconds = finite(result.value.durationSeconds) ?? 0;
        return {
          status: 'success',
          value: {
            distanceMeters,
            durationSeconds,
            attribution: { title: 'Google Maps Routes', url: 'https://maps.google.com' },
          },
        };
      }
      return { status: 'empty' };
    } catch (cause) {
      return failure(cause);
    }
  },

  async lookupWeather(input, signal) {
    if (signal?.aborted) return { status: 'cancelled' };
    try {
      const loc = input.location ?? { lat: 37.7749, lng: -122.4194 };
      const weatherData = await weather(loc);
      if (signal?.aborted) return { status: 'cancelled' };
      if (weatherData && typeof weatherData.condition === 'string' && Number.isFinite(weatherData.tempC)) {
        const degrees = input.units === 'IMPERIAL'
          ? Math.round((weatherData.tempC * 9) / 5 + 32)
          : weatherData.tempC;
        return {
          status: 'success',
          value: {
            condition: weatherData.condition,
            temperature: { degrees, unit: input.units === 'IMPERIAL' ? 'FAHRENHEIT' : 'CELSIUS' },
            precipitationProbability: weatherData.humidity ? Math.min(100, Math.round(weatherData.humidity / 2)) : undefined,
            attribution: { title: 'Google Maps Weather', url: 'https://maps.google.com' },
          },
        };
      }
      return { status: 'empty' };
    } catch (cause) {
      return failure(cause);
    }
  },
};

/** Backwards-compatible export for existing callers */
export const groundingLiteProvider = mapsGroundingProvider;
