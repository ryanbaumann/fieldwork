import type { ExplorerIntent } from './contracts';

const DRIVE_TERMS = /\b(?:drive|driving|car)\b/iu;
const WALK_TERMS = /\b(?:walk|walking|on foot)\b/iu;
const CURRENT_WEATHER_TERMS = /\b(?:weather|jacket|umbrella|raincoat|raining|temperature)\b/iu;
const MINUTES_LIMIT = /\b(?:within|under|in|up\s+to|max(?:imum)?)\s+(?:a\s+|an\s+)?(\d{1,3})(?:\s*-\s*|\s+)min(?:ute)?s?\b/iu;

/** Deterministic, conservative interpretation of the first-run prompt. */
export function classifyExplorerIntent(query: string): ExplorerIntent {
  const asksToDrive = DRIVE_TERMS.test(query);
  const asksToWalk = WALK_TERMS.test(query);
  return {
    travelMode: asksToDrive && !asksToWalk ? 'DRIVE' : 'WALK',
    currentWeatherRequested: CURRENT_WEATHER_TERMS.test(query),
  };
}

/** Parses an explicit travel-time ceiling (clamped 5..60 minutes), defaulting to 15. */
export function parseTravelMinutes(query: string, fallback = 15): number {
  const match = query.match(MINUTES_LIMIT);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(60, Math.max(5, parsed));
}
