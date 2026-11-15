// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAtlas } from '@/state/store';
import { useMission } from '@/mission/store';
import { CITIES } from '@/lib/cities';
import { Landing } from './Landing';

const { startExplorerJourney } = vi.hoisted(() => ({
  startExplorerJourney: vi.fn(),
}));
vi.mock('@/explorer/controller', () => {
  return { startExplorerJourney };
});
vi.mock('@/lib/config', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/config')>(),
  GMP_BROWSER_KEY: 'test-browser-key',
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let getCurrentPosition: ReturnType<typeof vi.fn>;

async function flushEffects() {
  await act(async () => { await Promise.resolve(); });
}

beforeEach(async () => {
  startExplorerJourney.mockClear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    maps: true,
    gemini: true,
    hostedGemini: true,
    mapsGrounding: true,
    groundingLite: true,
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })));
  getCurrentPosition = vi.fn();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  useAtlas.setState({ landingDismissed: false, cityId: 'sf', activeScenario: 'concierge', apiHealth: 'ok', cities: CITIES });
  useMission.getState().reset('sf');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<Landing />));
  await flushEffects();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('Landing cold open', () => {
  it('renders only "What do you want to do?" without superfluous marketing or boilerplate copy', () => {
    const heading = container.querySelector('h1');
    expect(heading?.textContent).toBe('What do you want to do?');
    expect(container.querySelectorAll('textarea')).toHaveLength(1);
    expect(container.querySelectorAll('.mission-launch')).toHaveLength(1);
    expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('');

    expect(container.textContent).not.toContain('Find the right place.');
    expect(container.textContent).not.toContain('One evidence-first decision');
    expect(container.textContent).not.toContain('What should Atlas find?');
    expect(container.textContent).not.toContain('60 to 90 second mission');
    expect(container.textContent).not.toContain('Maps, grounding, and Gemini are ready');
    expect(container.textContent).not.toContain('Explore recipes');
    expect(container.textContent).not.toContain('Preference Passport');
    expect(container.querySelector('[aria-label="Data mode"]')).toBeNull();
  });

  it('does not request geolocation until Near me is activated, then allows revocation', async () => {
    expect(getCurrentPosition).not.toHaveBeenCalled();
    const locationButton = container.querySelector<HTMLButtonElement>('[aria-label="Use my location"]')!;

    await act(async () => locationButton.click());
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);

    const success = getCurrentPosition.mock.calls[0][0] as PositionCallback;
    await act(async () => success({ coords: { latitude: 37.79, longitude: -122.4 } } as GeolocationPosition));
    expect(container.textContent).toContain('My location');
    expect(useAtlas.getState().cityId).toBe('sf');

    const remove = container.querySelector<HTMLButtonElement>('[aria-label="Stop using my location"]')!;
    await act(async () => remove.click());
    expect(container.textContent).toContain('Near me');
    expect(useAtlas.getState().cityId).toBe('sf');
  });

  it('starts the Live explorer with typed goal or default fallback', async () => {
    const textarea = container.querySelector<HTMLTextAreaElement>('textarea')!;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(textarea, 'Find coffee near Ferry Building');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const launch = container.querySelector<HTMLButtonElement>('.mission-launch')!;
    await act(async () => launch.click());
    expect(startExplorerJourney).toHaveBeenCalledWith(expect.objectContaining({
      goal: 'Find coffee near Ferry Building',
      cityId: 'sf',
      mode: 'live',
    }));
  });

  it('fails closed when Live capability becomes degraded', async () => {
    await act(async () => useAtlas.setState({ apiHealth: 'degraded' }));
    await flushEffects();

    const launch = container.querySelector<HTMLButtonElement>('.mission-launch')!;
    expect(launch.disabled).toBe(true);
    expect(container.textContent).toContain('Unavailable');
    await act(async () => launch.click());
    expect(startExplorerJourney).not.toHaveBeenCalled();
  });

  it('keeps exact coordinates out of global city state and scopes them to the launched mission', async () => {
    const locationButton = container.querySelector<HTMLButtonElement>('[aria-label="Use my location"]')!;
    await act(async () => locationButton.click());
    const success = getCurrentPosition.mock.calls[0][0] as PositionCallback;
    await act(async () => success({ coords: { latitude: 12.34, longitude: 56.78 } } as GeolocationPosition));
    expect(useAtlas.getState().cities.some((candidate) => candidate.id === 'user-city')).toBe(false);

    await act(async () => container.querySelector<HTMLButtonElement>('.mission-launch')!.click());
    expect(useAtlas.getState().cityId).toBe('sf');
    expect(useAtlas.getState().cities.some((candidate) => candidate.id === 'user-city')).toBe(false);
    expect(startExplorerJourney).toHaveBeenCalledWith(expect.objectContaining({
      cityId: 'sf',
      location: { lat: 12.34, lng: 56.78 },
    }));
  });
});
