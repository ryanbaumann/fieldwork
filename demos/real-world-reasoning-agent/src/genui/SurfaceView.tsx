/**
 * SurfaceView — mounts a live A2UI surface by id. Subscribes to the genui
 * store's `rev` counter (via zustand selector) so it re-renders whenever
 * `applyMessages` updates this surface's components or data model. Renders
 * the "root" node recursively through the CATALOG registry; when >= 2 valid
 * canonical Place IDs appear across surface components and no shortlist action
 * is already rendered, appends a 1-click Google Maps List bar.
 */
import { useState } from 'react';
import { getAtPath } from './protocol';
import { useGenui, type SurfaceState } from './store';
import { CatalogNode } from './render/CatalogNode';
import { dispatchSurfaceAction } from './actions';
import {
  MAX_SHORTLIST_PLACES,
  buildMapsShortlistUrl,
  isValidPlaceId,
  normalizePlaceId,
} from '@/lib/mapsUrl';
import { atlas } from '@/state/store';

function collectSurfaceShortlistState(surface: SurfaceState): {
  placeIds: string[];
  hasExplicitShortlistAction: boolean;
} {
  const seen = new Set<string>();
  const placeIds: string[] = [];
  let hasExplicitShortlistAction = false;

  const pushId = (candidate: unknown) => {
    if (placeIds.length >= MAX_SHORTLIST_PLACES) return;
    const id = normalizePlaceId(candidate);
    if (!isValidPlaceId(id) || seen.has(id)) return;
    seen.add(id);
    placeIds.push(id);
  };

  for (const node of Object.values(surface.components)) {
    const actionEventName = (node.action as { event?: { name?: unknown } } | undefined)?.event?.name;
    if (actionEventName === 'open_maps_shortlist') {
      hasExplicitShortlistAction = true;
    }
    if (node.component === 'NextActions' && Array.isArray(node.actions)) {
      for (const spec of node.actions as Array<{ action?: { event?: { name?: unknown } } }>) {
        if (spec?.action?.event?.name === 'open_maps_shortlist') {
          hasExplicitShortlistAction = true;
        }
      }
    }

    if (node.component === 'PlaceCard' || node.component === 'PlaceDetailsCompact') {
      if (typeof node.placeId === 'string') {
        pushId(node.placeId);
      } else if (
        node.placeId &&
        typeof node.placeId === 'object' &&
        typeof (node.placeId as { path?: unknown }).path === 'string'
      ) {
        const path = (node.placeId as { path: string }).path;
        if (path.startsWith('/')) {
          pushId(getAtPath(surface.dataModel, path));
        }
      }
    }

    if (node.component === 'List' && node.children && typeof node.children === 'object' && !Array.isArray(node.children)) {
      const tpl = node.children as { componentId?: unknown; path?: unknown };
      if (typeof tpl.path === 'string') {
        const items = getAtPath(surface.dataModel, tpl.path);
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && typeof item === 'object') {
              const rec = item as Record<string, unknown>;
              pushId(rec.placeId ?? rec.id);
            }
          }
        }
      }
    }

    if (node.component === 'GoogleMap') {
      if (node.anchorMarker && typeof node.anchorMarker === 'object') {
        pushId((node.anchorMarker as Record<string, unknown>).placeId);
      }
      if (Array.isArray(node.markers)) {
        for (const m of node.markers) {
          if (m && typeof m === 'object') {
            pushId((m as Record<string, unknown>).placeId);
          }
        }
      }
    }
  }

  if (surface.dataModel && typeof surface.dataModel === 'object' && !Array.isArray(surface.dataModel)) {
    for (const val of Object.values(surface.dataModel as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object') {
            pushId((item as Record<string, unknown>).placeId);
          }
        }
      }
    }
  }

  return { placeIds, hasExplicitShortlistAction };
}

export function SurfaceView({ surfaceId }: { surfaceId: string }) {
  const surface = useGenui((s) => s.surfaces[surfaceId]);
  const [copied, setCopied] = useState(false);

  if (!surface) return null;

  const { placeIds, hasExplicitShortlistAction } = collectSurfaceShortlistState(surface);
  const shortlistUrl =
    !hasExplicitShortlistAction && placeIds.length >= 2 ? buildMapsShortlistUrl(placeIds) : null;

  const copyListLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      atlas().pushToast('warn', 'Copy failed. Use Open as Maps List instead.');
    }
  };

  return (
    <>
      <CatalogNode id={surface.rootId} surface={surface} />
      {shortlistUrl ? (
        <div className="genui-surface__shortlist" aria-label="Google Maps shortlist actions">
          <button
            type="button"
            className="genui-next-action genui-next-action--primary"
            onClick={() =>
              dispatchSurfaceAction({
                name: 'open_maps_shortlist',
                surfaceId,
                sourceComponentId: 'surface-shortlist-open',
                timestamp: new Date().toISOString(),
                context: { url: shortlistUrl, placeIds },
              })
            }
          >
            Open as Maps List ({placeIds.length}) ↗
          </button>
          <button
            type="button"
            className="genui-next-action"
            onClick={() => void copyListLink(shortlistUrl)}
          >
            {copied ? 'Copied' : 'Copy list link'}
          </button>
        </div>
      ) : null}
    </>
  );
}
