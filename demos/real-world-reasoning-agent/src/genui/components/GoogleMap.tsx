/**
 * GoogleMap — official Maps Agentic UI Toolkit (MAUI, `@googlemaps/a2ui@0.1.10`)
 * component for interactive map cards. Supports center, zoom, mode, origin,
 * destination, anchorMarker, markers, routes, travelMode, placePrimaryType, and
 * Agentic Data Visualization `contentToken`, rendering a high-fidelity preview
 * that flies the live map camera on tap.
 */
import { useEffect, useState, type FC } from 'react';
import type { ComponentNode, Dynamic } from '../protocol';
import { resolveDisplayText, resolveDynamic } from '../protocol';
import type { SurfaceState } from '../store';
import { staticMapUrl } from '@/services/staticmap';
import { registerAgenticContentToken } from '@/services/mapsExperience';
import { dispatchSurfaceAction } from '../actions';
import { buildAction } from './actionHelpers';
import { MediaError } from './MediaState';

interface LatLngLite {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  location?: unknown;
  position?: unknown;
}

function extractLatLng(val: unknown): { lat: number; lng: number } | null {
  if (typeof val === 'string') {
    const m = val.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      const lat = Number.parseFloat(m[1]);
      const lng = Number.parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  }
  if (!val || typeof val !== 'object') return null;
  const o = val as LatLngLite;
  if (o.location) {
    const nested = extractLatLng(o.location);
    if (nested) return nested;
  }
  if (o.position) {
    const nested = extractLatLng(o.position);
    if (nested) return nested;
  }
  const lat = typeof o.lat === 'number' ? o.lat : typeof o.latitude === 'number' ? o.latitude : null;
  const lng = typeof o.lng === 'number' ? o.lng : typeof o.longitude === 'number' ? o.longitude : null;
  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function extractRoutePath(routesRaw: unknown): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(routesRaw)) return [];
  const points: Array<{ lat: number; lng: number }> = [];
  for (const route of routesRaw) {
    if (Array.isArray(route)) {
      for (const pt of route) {
        const parsed = extractLatLng(pt);
        if (parsed) points.push(parsed);
      }
      continue;
    }
    if (!route || typeof route !== 'object') continue;
    const rec = route as Record<string, unknown>;
    const candidateArray = Array.isArray(rec.path)
      ? rec.path
      : Array.isArray(rec.points)
        ? rec.points
        : Array.isArray(rec.coordinates)
          ? rec.coordinates
          : null;
    if (candidateArray) {
      for (const pt of candidateArray) {
        const parsed = extractLatLng(pt);
        if (parsed) points.push(parsed);
      }
      continue;
    }
    const rOrigin = extractLatLng(rec.origin);
    const rDest = extractLatLng(rec.destination);
    if (rOrigin) points.push(rOrigin);
    if (rDest) points.push(rDest);
  }
  return points;
}

export const GoogleMap: FC<{ node: ComponentNode; surface: SurfaceState; scope?: string }> = ({
  node,
  surface,
  scope,
}) => {
  const centerRaw = resolveDynamic(node.center as Dynamic<unknown> | undefined, surface.dataModel, scope);
  const latRaw = resolveDynamic(node.lat as Dynamic<number> | undefined, surface.dataModel, scope);
  const lngRaw = resolveDynamic(node.lng as Dynamic<number> | undefined, surface.dataModel, scope);
  const zoomRaw = resolveDynamic(node.zoom as Dynamic<number> | undefined, surface.dataModel, scope);
  const modeRaw = resolveDynamic(node.mode as Dynamic<string> | undefined, surface.dataModel, scope);
  const originRaw = resolveDynamic(node.origin as Dynamic<unknown> | undefined, surface.dataModel, scope);
  const destinationRaw = resolveDynamic(node.destination as Dynamic<unknown> | undefined, surface.dataModel, scope);
  const routesRaw = resolveDynamic(node.routes as Dynamic<unknown[]> | undefined, surface.dataModel, scope);
  const travelModeRaw = resolveDynamic(node.travelMode as Dynamic<string> | undefined, surface.dataModel, scope);
  const placePrimaryTypeRaw = resolveDynamic(
    node.placePrimaryType as Dynamic<string> | undefined,
    surface.dataModel,
    scope,
  );
  const contentTokenRaw = resolveDynamic(
    node.contentToken as Dynamic<string> | undefined,
    surface.dataModel,
    scope,
  );
  const label = resolveDisplayText(node.label as Dynamic<unknown> | undefined, surface.dataModel, scope);
  const anchorRaw = resolveDynamic(node.anchorMarker as Dynamic<unknown> | undefined, surface.dataModel, scope);
  const markersRaw = resolveDynamic(node.markers as Dynamic<unknown[]> | undefined, surface.dataModel, scope);

  if (typeof contentTokenRaw === 'string' && contentTokenRaw.trim()) {
    registerAgenticContentToken(contentTokenRaw);
  }
  useEffect(() => {
    if (typeof contentTokenRaw === 'string' && contentTokenRaw.trim()) {
      registerAgenticContentToken(contentTokenRaw);
    }
  }, [contentTokenRaw]);

  const anchor = extractLatLng(anchorRaw);
  const originPoint = extractLatLng(originRaw);
  const destinationPoint = extractLatLng(destinationRaw);
  const routePoints = extractRoutePath(routesRaw);
  const path =
    routePoints.length > 0
      ? routePoints
      : originPoint && destinationPoint
        ? [originPoint, destinationPoint]
        : [];

  const markerPositions: Array<{ lat: number; lng: number }> = [];
  if (anchor) markerPositions.push(anchor);
  if (originPoint) markerPositions.push(originPoint);
  if (destinationPoint) markerPositions.push(destinationPoint);
  if (Array.isArray(markersRaw)) {
    for (const m of markersRaw) {
      const pos = extractLatLng(m);
      if (pos) markerPositions.push(pos);
    }
  }

  const explicitCenter =
    extractLatLng(centerRaw) ??
    (typeof latRaw === 'number' && typeof lngRaw === 'number' ? { lat: latRaw, lng: lngRaw } : null);
  const center =
    explicitCenter ??
    anchor ??
    originPoint ??
    markerPositions[0] ??
    path[0] ??
    destinationPoint ??
    null;

  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!center) return null;

  const markers = markerPositions.length > 0 ? markerPositions : [center];
  const maptype = modeRaw === 'satellite' || modeRaw === 'hybrid' ? modeRaw : 'roadmap';
  const zoomNum = typeof zoomRaw === 'number' ? zoomRaw : 13;
  const url = staticMapUrl(center, { zoom: zoomNum, markers, path, maptype, w: 480, h: 260 });

  if (failed) {
    return (
      <MediaError
        className="genui-mappreview--error"
        label="Couldn't load the map viewport."
        onRetry={() => {
          setFailed(false);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  const onClick = () => {
    dispatchSurfaceAction(
      buildAction('fly_to', surface, node.id, { lat: center.lat, lng: center.lng, zoom: zoomNum + 1 }),
    );
  };

  return (
    <button
      type="button"
      className="genui-mappreview"
      onClick={onClick}
      data-mode={typeof modeRaw === 'string' && modeRaw ? modeRaw : 'roadmap'}
      data-travel-mode={typeof travelModeRaw === 'string' && travelModeRaw ? travelModeRaw : undefined}
      data-place-primary-type={
        typeof placePrimaryTypeRaw === 'string' && placePrimaryTypeRaw ? placePrimaryTypeRaw : undefined
      }
      aria-label={label ? `Fly to ${label}` : 'Fly to map location'}
    >
      <img key={reloadKey} src={url} alt={label || 'Google Map viewport'} loading="lazy" onError={() => setFailed(true)} />
      {label ? <span className="genui-mappreview__label">{label}</span> : null}
    </button>
  );
};
