/**
 * PlaceDetailsCompact — official Maps Agentic UI Toolkit (MAUI, `@googlemaps/a2ui@0.1.10`)
 * component for Places UI Kit (`gmp-place-details-compact`), defaulting `orientation`
 * to `'horizontal'` while stripping `places/` resource prefixes and attaching
 * `internalUsageAttributionIds: ['gmp_git_agentskills_v1']`.
 */
import type { FC } from 'react';
import type { ComponentNode } from '../protocol';
import type { SurfaceState } from '../store';
import { PlaceCard } from './PlaceCard';

export const PlaceDetailsCompact: FC<{ node: ComponentNode; surface: SurfaceState; scope?: string }> = (props) => {
  return <PlaceCard {...props} defaultOrientation="horizontal" />;
};
