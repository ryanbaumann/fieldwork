const EARTH_RADIUS_METERS = 6_371_008.8;

function geometryOf(geoJson) {
  return geoJson?.type === 'Feature' ? geoJson.geometry : geoJson;
}

function pointInRing([lng, lat], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [currentLng, currentLat] = ring[index];
    const [previousLng, previousLat] = ring[previous];
    const crossesLatitude = (currentLat > lat) !== (previousLat > lat);
    const intersectionLng = ((previousLng - currentLng) * (lat - currentLat))
      / (previousLat - currentLat) + currentLng;
    if (crossesLatitude && lng < intersectionLng) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, rings = []) {
  if (!rings.length || !pointInRing(point, rings[0])) return false;
  return !rings.slice(1).some((hole) => pointInRing(point, hole));
}

export function containsLocation(geoJson, location) {
  const geometry = geometryOf(geoJson);
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return false;
  const point = [location.lng, location.lat];
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((rings) => pointInPolygon(point, rings));
}

export function distanceMeters(first, second) {
  const radians = Math.PI / 180;
  const lat1 = first.lat * radians;
  const lat2 = second.lat * radians;
  const deltaLat = (second.lat - first.lat) * radians;
  const deltaLng = (second.lng - first.lng) * radians;
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function midpoint(first, second) {
  const deltaLng = ((((second.lng - first.lng) % 360) + 540) % 360) - 180;
  const lng = first.lng + deltaLng / 2;
  return {
    lat: (first.lat + second.lat) / 2,
    lng: ((((lng + 180) % 360) + 360) % 360) - 180,
  };
}

export function nearbySearchRadius(first, second) {
  return Math.min(50_000, Math.max(1_500, distanceMeters(first, second) / 2 + 3_000));
}
