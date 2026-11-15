import test from 'node:test';
import assert from 'node:assert/strict';
import {
  containsLocation,
  distanceMeters,
  midpoint,
  nearbySearchRadius,
  normalizePlaceId,
  buildMapsShortlistUrl,
} from '../src/geo.js';

const polygon = {
  type: 'Polygon',
  coordinates: [[
    [-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2],
  ], [
    [-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5],
  ]],
};

test('containsLocation respects polygon boundaries and holes', () => {
  assert.equal(containsLocation(polygon, { lat: 1, lng: 1 }), true);
  assert.equal(containsLocation(polygon, { lat: 0, lng: 0 }), false);
  assert.equal(containsLocation(polygon, { lat: 3, lng: 3 }), false);
});

test('containsLocation supports GeoJSON features and multipolygons', () => {
  const multiPolygon = {
    type: 'Feature',
    geometry: { type: 'MultiPolygon', coordinates: [[polygon.coordinates[0]], [[[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]]]] },
  };
  assert.equal(containsLocation(multiPolygon, { lat: 11, lng: 11 }), true);
});

test('midpoint takes the short path across the antimeridian', () => {
  const result = midpoint({ lat: 10, lng: 170 }, { lat: 20, lng: -170 });
  assert.equal(result.lat, 15);
  assert.equal(Math.abs(result.lng), 180);
});

test('distance and search radius stay within Nearby Search limits', () => {
  assert.ok(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) > 100_000);
  assert.equal(nearbySearchRadius({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }), 50_000);
  assert.equal(nearbySearchRadius({ lat: 0, lng: 0 }, { lat: 0, lng: 0 }), 3_000);
});

test('normalizePlaceId validates canonical IDs, strips prefixes, and rejects synthetic IDs', () => {
  assert.equal(normalizePlaceId('places/ChIJN1t_tDeuEmsRUsoyG83frY4'), 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  assert.equal(normalizePlaceId('placeId:ChIJN1t_tDeuEmsRUsoyG83frY4'), 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  assert.equal(normalizePlaceId('ChIJN1t_tDeuEmsRUsoyG83frY4'), 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  assert.equal(normalizePlaceId('  ChIJN1t_tDeuEmsRUsoyG83frY4  '), 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  assert.equal(normalizePlaceId('grounded-place-01'), null);
  assert.equal(normalizePlaceId('mock-place-12345'), null);
  assert.equal(normalizePlaceId('sample-place-999'), null);
  assert.equal(normalizePlaceId('short_id'), null);
  assert.equal(normalizePlaceId(12345), null);
  assert.equal(normalizePlaceId(null), null);
  assert.equal(normalizePlaceId('invalid id with spaces!'), null);
  assert.equal(normalizePlaceId('ChIJ<script>alert(1)</script>'), null);
});

test('buildMapsShortlistUrl creates valid Google Maps shortlist URLs and caps at 20 place IDs', () => {
  assert.equal(buildMapsShortlistUrl([]), null);
  assert.equal(buildMapsShortlistUrl(['invalid']), null);

  const singleUrl = buildMapsShortlistUrl(['ChIJN1t_tDeuEmsRUsoyG83frY4']);
  assert.equal(
    singleUrl,
    'https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=ChIJN1t_tDeuEmsRUsoyG83frY4&utm_source=fieldwork_isochrones&utm_campaign=shortlist',
  );

  const dedupUrl = buildMapsShortlistUrl([
    'ChIJN1t_tDeuEmsRUsoyG83frY4',
    'places/ChIJN1t_tDeuEmsRUsoyG83frY4',
    'ChIJ22222222222222222222222',
  ]);
  assert.equal(
    dedupUrl,
    'https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=ChIJN1t_tDeuEmsRUsoyG83frY4,ChIJ22222222222222222222222&utm_source=fieldwork_isochrones&utm_campaign=shortlist',
  );

  const manyIds = Array.from({ length: 25 }, (_, i) => `ChIJplaceIDnumber${String(i).padStart(4, '0')}`);
  const cappedUrl = buildMapsShortlistUrl(manyIds);
  assert.ok(cappedUrl.includes('map_action=shortlist'));
  const idsParam = new URL(cappedUrl).searchParams.get('place_ids').split(',');
  assert.equal(idsParam.length, 20);
  assert.equal(idsParam[0], 'ChIJplaceIDnumber0000');
  assert.equal(idsParam[19], 'ChIJplaceIDnumber0019');
});
