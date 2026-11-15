// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { A2uiMessage } from './protocol';
import { useGenui } from './store';
import { SurfaceView } from './SurfaceView';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('SurfaceView shortlist affordance', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useGenui.getState().reset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders Open as Maps List + Copy list link when >= 2 valid Place IDs exist and no shortlist action is present', () => {
    const messages: A2uiMessage[] = [
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 'shortlist-surface-1',
          catalogId: 'a2ui://maps-agentic-ui-catalog.json',
          components: [
            { id: 'root', component: 'Column', children: ['p1', 'p2'] },
            { id: 'p1', component: 'PlaceDetailsCompact', placeId: 'places/ChIJN1t_tDeuEmsRUsoyG83frY4' },
            { id: 'p2', component: 'PlaceDetailsCompact', placeId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA' },
          ],
        },
      },
    ];
    useGenui.getState().applyMessages('concierge', messages);
    act(() => {
      root.render(<SurfaceView surfaceId="shortlist-surface-1" />);
    });
    expect(container.innerHTML).toContain('Open as Maps List (2) ↗');
    expect(container.innerHTML).toContain('Copy list link');

    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const openBtn = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Open as Maps List (2)'),
    );
    expect(openBtn).toBeDefined();
    act(() => {
      openBtn!.click();
    });
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/@?api=1&map_action=shortlist&place_ids=ChIJN1t_tDeuEmsRUsoyG83frY4,ChIJd8BlQ2BZwokRAFUEcm_qrcA&utm_source=atlas&utm_campaign=shortlist',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('suppresses duplicate footer when NextActions already renders open_maps_shortlist', () => {
    const messages: A2uiMessage[] = [
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 'shortlist-surface-2',
          catalogId: 'atlas://maps-agentic-ui-catalog',
          components: [
            { id: 'root', component: 'Column', children: ['p1', 'p2', 'next'] },
            { id: 'p1', component: 'PlaceCard', placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
            { id: 'p2', component: 'PlaceCard', placeId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA' },
            {
              id: 'next',
              component: 'NextActions',
              actions: [
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
              ],
            },
          ],
        },
      },
    ];
    useGenui.getState().applyMessages('concierge', messages);
    act(() => {
      root.render(<SurfaceView surfaceId="shortlist-surface-2" />);
    });
    expect(container.innerHTML).toContain('Open as Maps List (2) ↗');
    expect(container.innerHTML).not.toContain('Copy list link');
  });
});
