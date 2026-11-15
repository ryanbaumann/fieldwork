import { describe, expect, it } from 'vitest';
import { buildExplorerSurface } from './presenter';
import { runExplorer } from './runtime';
import { createExplorerFixture } from './fixtures';
import type { ExplorerView } from './contracts';

describe('explorer presenter', () => {
  it('creates one compact evidence surface and never links Sample fixtures', async () => {
    const views: ExplorerView[] = [];
    await runExplorer({ query: 'quiet work cafe; do I need a jacket?', origin: { lat: 1, lng: 2 } }, { grounding: createExplorerFixture() }, ({ view }) => { views.push(view); });
    const first = buildExplorerSurface(views[0], true);
    const final = buildExplorerSurface(views.at(-1)!, false);
    expect(first.filter((message) => 'createSurface' in message)).toHaveLength(1);
    expect(final.some((message) => 'createSurface' in message)).toBe(false);
    const update = final.find((message) => 'updateComponents' in message)!;
    const components = 'updateComponents' in update ? update.updateComponents.components : [];
    const root = components.find((component) => component.id === 'root')!;
    const children = root.children as string[];
    expect(children).toContain('sample-disclosure');
    expect(children).toContain('candidate-0-card');
    // Each candidate card must include a PlaceCard node
    expect(components.filter((component) => component.component === 'PlaceCard')).toHaveLength(3);
    expect(components.filter((component) => component.component === 'GroundingAttribution')).toHaveLength(0);
    expect(JSON.stringify(components)).not.toMatch(/github|https?:\/\//i);
    expect(components.some((component) => component.id === 'weather-inference')).toBe(true);
    expect(components.filter((component) => component.component === 'ProgressStatus')).toHaveLength(0);
    // The surface, not the shell, owns the counterfactual: one NextActions node
    // carrying the travel-mode comparison.
    const nextActions = components.filter((component) => component.component === 'NextActions');
    expect(nextActions).toHaveLength(1);
    expect(nextActions[0].actions).toMatchObject([
      { action: { event: { name: 'explorer_change_travel_mode', context: { travelMode: 'DRIVE' } } } },
    ]);
    expect(components.filter((component) => component.component === 'Button')).toHaveLength(0);
  });

  it('keeps live place and weather attribution inside the supporting evidence cards', async () => {
    const views: ExplorerView[] = [];
    await runExplorer({ query: 'quiet work cafe; check the weather', origin: { lat: 1, lng: 2 }, dataMode: 'live' }, { grounding: createExplorerFixture() }, ({ view }) => { views.push(view); });
    const final = buildExplorerSurface(views.at(-1)!, true);
    const update = final.find((message) => 'updateComponents' in message)!;
    const components = 'updateComponents' in update ? update.updateComponents.components : [];
    const byId = new Map(components.map((component) => [component.id, component]));
    for (const index of [0, 1, 2]) {
      expect(byId.get(`candidate-${index}-column`)?.children).toEqual([
        `candidate-${index}-place`, `candidate-${index}-claim`, `candidate-${index}-source`,
      ]);
    }
    expect(byId.get('weather-column')?.children).toEqual([
      'weather-claim', 'weather-source', 'weather-inference',
    ]);
  });

  it('includes open_maps_shortlist in NextActions when >= 2 live candidates carry canonical Place IDs', () => {
    const view: ExplorerView = {
      schemaVersion: '1',
      surfaceId: 'explorer-live-shortlist',
      revision: 1,
      stage: 'ready',
      query: 'walkable coffee shops',
      dataMode: 'live',
      narrative: 'Found two walkable coffee shops.',
      travelMode: 'WALK',
      currentWeatherRequested: false,
      maxTravelMinutes: 15,
      winnerId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      candidates: [
        {
          id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          label: 'Blue Bottle Ferry Building',
          location: { lat: 37.7955, lng: -122.3937 },
          rank: 1,
          eligible: true,
          routeStatus: 'verified',
          route: {
            distanceMeters: 400,
            durationSeconds: 300,
            attribution: { title: 'Google Maps Routes', url: 'https://maps.google.com' },
          },
          attribution: { title: 'Google Maps', url: 'https://maps.google.com' },
          placeUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4',
        },
        {
          id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
          label: 'Sightglass SoMa',
          location: { lat: 37.7771, lng: -122.4084 },
          rank: 2,
          eligible: true,
          routeStatus: 'verified',
          route: {
            distanceMeters: 900,
            durationSeconds: 660,
            attribution: { title: 'Google Maps Routes', url: 'https://maps.google.com' },
          },
          attribution: { title: 'Google Maps', url: 'https://maps.google.com' },
          placeUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJd8BlQ2BZwokRAFUEcm_qrcA',
        },
      ],
      limitations: [],
      capabilityProfile: ['search_places', 'draw_route'],
    };
    const msgs = buildExplorerSurface(view, true);
    const update = msgs.find((message) => 'updateComponents' in message)!;
    const components = 'updateComponents' in update ? update.updateComponents.components : [];
    const nextActions = components.find((component) => component.component === 'NextActions')!;
    expect(nextActions.actions).toEqual(
      expect.arrayContaining([
        {
          label: 'Open as Maps List (2) ↗',
          action: {
            event: {
              name: 'open_maps_shortlist',
              context: {
                placeIds: ['ChIJN1t_tDeuEmsRUsoyG83frY4', 'ChIJd8BlQ2BZwokRAFUEcm_qrcA'],
              },
            },
          },
        },
      ]),
    );
  });
});
