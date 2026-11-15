import { describe, expect, it } from 'vitest';
import {
  MAX_SHORTLIST_PLACES,
  buildMapsShortlistUrl,
  extractMapsUrls,
  isValidMapsShortlistUrl,
  isValidPlaceId,
  normalizePlaceId,
  parseMapsPlaceInput,
} from './mapsUrl';

const ID_FERRY = 'ChIJp2PqN4GAhYARJ_q2VvMvh14';
const ID_COIT = 'ChIJw7fN3vSAhYARs25v2L8xJ7Q';
const ID_DOLORES = 'ChIJN9t_tDeuEmsRUsoyG83frY4';

describe('mapsUrl shortlist & Place ID utilities', () => {
  it('normalizes canonical Place IDs by stripping places/ and placeId: prefixes', () => {
    expect(normalizePlaceId(`places/${ID_FERRY}`)).toBe(ID_FERRY);
    expect(normalizePlaceId(`placeId:${ID_COIT}`)).toBe(ID_COIT);
    expect(normalizePlaceId(`  ${ID_DOLORES}  `)).toBe(ID_DOLORES);
    expect(normalizePlaceId(null)).toBe('');
  });

  it('accepts canonical Place IDs and rejects synthetic, short, or malformed IDs', () => {
    expect(isValidPlaceId(ID_FERRY)).toBe(true);
    expect(isValidPlaceId(`places/${ID_COIT}`)).toBe(true);
    expect(isValidPlaceId('grounded-place-123456')).toBe(false);
    expect(isValidPlaceId('sample-candidate-alpha')).toBe(false);
    expect(isValidPlaceId('synthetic-candidate-a')).toBe(false);
    expect(isValidPlaceId('mock-place-999999')).toBe(false);
    expect(isValidPlaceId('fixture-place-abcdef')).toBe(false);
    expect(isValidPlaceId('place-1')).toBe(false);
    expect(isValidPlaceId('short')).toBe(false);
    expect(isValidPlaceId('https://maps.google.com/abc')).toBe(false);
    expect(isValidPlaceId('has spaces inside id')).toBe(false);
  });

  it('builds a valid Google Maps Shortlist URL deduplicating and capping at 20 IDs', () => {
    const url = buildMapsShortlistUrl([
      `places/${ID_FERRY}`,
      ID_COIT,
      ID_FERRY,
      'sample-ignored-id',
    ]);
    expect(url).toBe(
      `https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=${ID_FERRY},${ID_COIT}&utm_source=atlas&utm_campaign=shortlist`,
    );
    expect(isValidMapsShortlistUrl(url)).toBe(true);

    const twentyFive = Array.from({ length: 25 }, (_, index) =>
      `ChIJValidPlaceIdNumber${String(index).padStart(3, '0')}`,
    );
    const capped = buildMapsShortlistUrl(twentyFive);
    expect(capped).not.toBeNull();
    expect(isValidMapsShortlistUrl(capped)).toBe(true);
    const parsedIds = new URL(capped!).searchParams.get('place_ids')!.split(',');
    expect(parsedIds).toHaveLength(MAX_SHORTLIST_PLACES);

    expect(buildMapsShortlistUrl(['sample-1', 'mock-2', 'short'])).toBeNull();
    expect(buildMapsShortlistUrl([])).toBeNull();
  });

  it('validates shortlist URLs strictly', () => {
    const good = `https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=${ID_FERRY},${ID_COIT}&utm_source=atlas&utm_campaign=shortlist`;
    expect(isValidMapsShortlistUrl(good)).toBe(true);
    expect(isValidMapsShortlistUrl(good.replace('https://', 'http://'))).toBe(false);
    expect(isValidMapsShortlistUrl('https://evil.example/maps/@?api=1&map_action=shortlist&place_ids=' + ID_FERRY)).toBe(false);
    expect(isValidMapsShortlistUrl(`https://www.google.com/maps/@?api=1&map_action=map&place_ids=${ID_FERRY}`)).toBe(false);
    expect(isValidMapsShortlistUrl('https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=sample-place-1234')).toBe(false);
  });

  it('extracts Google Maps links from prose and strips trailing punctuation', () => {
    const text =
      'Save https://maps.app.goo.gl/AbCdEf123, and (https://www.google.com/maps/place/Ferry+Building/@37.7955,-122.3937,17z)!';
    expect(extractMapsUrls(text)).toEqual([
      'https://maps.app.goo.gl/AbCdEf123',
      'https://www.google.com/maps/place/Ferry+Building/@37.7955,-122.3937,17z',
    ]);
  });

  it('parses mixed Maps URLs, direct Place IDs, and place queries cleanly', () => {
    const shortlistLink = `https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=${ID_FERRY},${ID_COIT}`;
    const shortLink = 'https://maps.app.goo.gl/XyZ987';
    const parsed = parseMapsPlaceInput([
      shortlistLink,
      shortLink,
      `placeId:${ID_DOLORES}`,
      'Blue Bottle Coffee, Ferry Building',
    ]);
    expect(parsed).toEqual({
      placeIds: [ID_FERRY, ID_COIT, ID_DOLORES],
      urls: [shortLink],
      queries: ['Blue Bottle Coffee, Ferry Building'],
    });
  });
});
