import test from 'node:test';
import assert from 'node:assert/strict';
import { containsLocation, distanceMeters, midpoint, nearbySearchRadius } from '../src/geo.js';

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
