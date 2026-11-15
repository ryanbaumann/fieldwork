/**
 * Google Maps URLs utilities, including the official "Create a Shortlist"
 * (`map_action=shortlist`) builder and validator, canonical Place ID hygiene,
 * and parser helpers for pasted Google Maps links, Place IDs, and queries.
 */

export const MAX_SHORTLIST_PLACES = 20;

const CANONICAL_PLACE_ID_RE = /^[A-Za-z0-9_-]{10,256}$/;

/** Reject synthetic, sample, fixture, or test Place IDs before building live Maps URLs. */
const SYNTHETIC_PLACE_ID_RE =
  /^(?:grounded-place-|sample-|mock-|fixture-|synthetic-|demo-|test-|fake-|placeholder-|place-\d+$)/i;

const MAPS_URL_IN_TEXT_RE =
  /https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps[^\s<>"{}|\\^`[\]]*|maps\.google\.[a-z.]+\/[^\s<>"{}|\\^`[\]]*|maps\.app\.goo\.gl\/[A-Za-z0-9_-]+[^\s<>"{}|\\^`[\]]*|goo\.gl\/maps\/[A-Za-z0-9_-]+[^\s<>"{}|\\^`[\]]*)/gi;

/**
 * Strip resource prefixes (`places/`, `placeId:`) and whitespace from a raw Place ID.
 * Returns an empty string for non-string or blank input.
 */
export function normalizePlaceId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^(?:places\/|placeId:)/i, '').trim();
}

/**
 * Validate that a candidate string normalizes to a real canonical Google Place ID
 * (10-256 URL-safe characters) and is not a synthetic/sample fixture token.
 */
export function isValidPlaceId(raw: unknown): boolean {
  const id = normalizePlaceId(raw);
  if (!id || SYNTHETIC_PLACE_ID_RE.test(id)) return false;
  return CANONICAL_PLACE_ID_RE.test(id);
}

export interface ShortlistUrlOptions {
  utmSource?: string;
  utmCampaign?: string;
}

/**
 * Build a Google Maps URLs "Create a Shortlist" link (`map_action=shortlist`)
 * from 1 to 20 valid Place IDs. Deduplicates in order and returns `null` when
 * no valid Place IDs are present.
 */
export function buildMapsShortlistUrl(
  placeIds: readonly unknown[],
  options: ShortlistUrlOptions = {},
): string | null {
  if (!Array.isArray(placeIds) || placeIds.length === 0) return null;
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const item of placeIds) {
    const normalized = normalizePlaceId(item);
    if (!isValidPlaceId(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    valid.push(normalized);
    if (valid.length >= MAX_SHORTLIST_PLACES) break;
  }
  if (valid.length === 0) return null;

  const utmSource = (options.utmSource?.trim() || 'atlas');
  const utmCampaign = (options.utmCampaign?.trim() || 'shortlist');
  return (
    `https://www.google.com/maps/@?api=1&map_action=shortlist` +
    `&place_ids=${valid.join(',')}` +
    `&utm_source=${encodeURIComponent(utmSource)}` +
    `&utm_campaign=${encodeURIComponent(utmCampaign)}`
  );
}

/**
 * Validate a Google Maps Shortlist URL (`https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=...`)
 * ensuring HTTPS, a Google Maps host, `api=1`, `map_action=shortlist`, and 1-20 valid canonical Place IDs.
 */
export function isValidMapsShortlistUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const hostOk =
    parsed.hostname === 'www.google.com' ||
    parsed.hostname === 'google.com' ||
    parsed.hostname === 'maps.google.com';
  if (!hostOk || !parsed.pathname.startsWith('/maps')) return false;
  if (parsed.searchParams.get('api') !== '1') return false;
  if (parsed.searchParams.get('map_action') !== 'shortlist') return false;

  const rawPlaceIds = parsed.searchParams.get('place_ids');
  if (!rawPlaceIds) return false;
  const ids = rawPlaceIds.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length < 1 || ids.length > MAX_SHORTLIST_PLACES) return false;
  return ids.every((id) => isValidPlaceId(id));
}

function cleanTrailingUrlPunctuation(url: string): string {
  return url.replace(/[),.;!?'"\]]+$/g, '');
}

function isSupportedMapsHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === 'maps.app.goo.gl') return true;
  if (host === 'goo.gl' && url.pathname.startsWith('/maps/')) return true;
  if ((host === 'www.google.com' || host === 'google.com' || host.startsWith('www.google.')) && url.pathname.startsWith('/maps')) {
    return true;
  }
  if (host === 'maps.google.com' || host.startsWith('maps.google.')) return true;
  return false;
}

/**
 * Extract supported Google Maps URLs (`google.com/maps/...`, `maps.google.com/...`,
 * `maps.app.goo.gl/...`, `goo.gl/maps/...`) from free-form text.
 */
export function extractMapsUrls(text: string): string[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  const matches = text.match(MAPS_URL_IN_TEXT_RE) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const match of matches) {
    const cleaned = cleanTrailingUrlPunctuation(match);
    try {
      const parsed = new URL(cleaned);
      if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && isSupportedMapsHost(parsed)) {
        parsed.protocol = 'https:';
        const href = parsed.toString();
        if (!seen.has(href)) {
          seen.add(href);
          urls.push(href);
        }
      }
    } catch {
      // Ignore malformed URL fragments.
    }
  }
  return urls;
}

export interface ParsedMapsPlaceInput {
  placeIds: string[];
  urls: string[];
  queries: string[];
}

function extractPlaceIdsFromMapsUrl(rawUrl: string): string[] {
  try {
    const url = new URL(rawUrl);
    const extracted: string[] = [];
    const listParam = url.searchParams.get('place_ids');
    if (listParam) {
      for (const part of listParam.split(',')) {
        const norm = normalizePlaceId(part);
        if (isValidPlaceId(norm)) extracted.push(norm);
      }
    }
    for (const key of ['query_place_id', 'place_id', 'destination_place_id', 'origin_place_id']) {
      const val = url.searchParams.get(key);
      if (val) {
        const norm = normalizePlaceId(val);
        if (isValidPlaceId(norm)) extracted.push(norm);
      }
    }
    return extracted;
  } catch {
    return [];
  }
}

/**
 * Parse user-supplied or model-supplied shortlist input (text, Google Maps links,
 * Place IDs, or place queries) into deduplicated `{ placeIds, urls, queries }`.
 */
export function parseMapsPlaceInput(input: unknown): ParsedMapsPlaceInput {
  const placeIds = new Set<string>();
  const urls = new Set<string>();
  const queries = new Set<string>();

  const items: string[] = [];
  if (typeof input === 'string') {
    items.push(input);
  } else if (Array.isArray(input)) {
    for (const entry of input) {
      if (typeof entry === 'string') items.push(entry);
      else if (entry && typeof entry === 'object') {
        const rec = entry as Record<string, unknown>;
        if (typeof rec.placeId === 'string') items.push(rec.placeId);
        else if (typeof rec.id === 'string') items.push(rec.id);
        else if (typeof rec.url === 'string') items.push(rec.url);
        else if (typeof rec.query === 'string') items.push(rec.query);
        else if (typeof rec.name === 'string') items.push(rec.name);
      }
    }
  }

  for (const rawItem of items) {
    if (!rawItem.trim()) continue;
    const foundUrls = extractMapsUrls(rawItem);
    let remainder = rawItem;
    for (const u of foundUrls) {
      const directIds = extractPlaceIdsFromMapsUrl(u);
      if (directIds.length > 0) {
        for (const id of directIds) placeIds.add(id);
      } else {
        urls.add(u);
      }
    }
    if (foundUrls.length > 0) {
      remainder = remainder.replace(MAPS_URL_IN_TEXT_RE, ' ');
    }

    const segments = remainder
      .split(/[\n;]+/)
      .map((seg) => seg.trim())
      .filter(Boolean);

    for (const seg of segments) {
      if (isValidPlaceId(seg)) {
        placeIds.add(normalizePlaceId(seg));
        continue;
      }
      if (SYNTHETIC_PLACE_ID_RE.test(normalizePlaceId(seg))) {
        continue;
      }
      const commaParts = seg.split(',').map((part) => part.trim()).filter(Boolean);
      if (
        commaParts.length > 1 &&
        commaParts.every((part) => isValidPlaceId(part) || SYNTHETIC_PLACE_ID_RE.test(normalizePlaceId(part)))
      ) {
        for (const part of commaParts) {
          if (isValidPlaceId(part)) placeIds.add(normalizePlaceId(part));
        }
        continue;
      }
      // Strip bullet markers or numbering when users paste a bulleted place list,
      // and skip pure connector remnants left after stripping embedded URLs.
      const cleanedQuery = seg.replace(/^(?:[-*•]|\d+[.)])\s*/, '').trim();
      if (!cleanedQuery || /^(?:and|or|,|\s)+$/i.test(cleanedQuery)) continue;
      // When URLs were extracted from a sentence like "Create a shortlist from <url> and <url>",
      // avoid treating the conversational wrapper itself as a place name query.
      if (
        foundUrls.length > 0 &&
        /^(?:(?:please\s+)?(?:create|make|build|turn|open|save|export)\b.*|(?:from|with|these|links?|urls?|maps?|shortlist|list|\s)+)$/i.test(
          cleanedQuery,
        )
      ) {
        continue;
      }
      queries.add(cleanedQuery);
    }
  }

  return {
    placeIds: [...placeIds].slice(0, MAX_SHORTLIST_PLACES),
    urls: [...urls].slice(0, MAX_SHORTLIST_PLACES),
    queries: [...queries].slice(0, MAX_SHORTLIST_PLACES),
  };
}
