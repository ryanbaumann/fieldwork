import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, KeyRound, LocateFixed, Map as MapIcon, X } from 'lucide-react';
import { GMP_BROWSER_KEY } from '@/lib/config';
import { getGeminiCredentialSnapshot, subscribeGeminiCredential } from '@/ai/client';
import type { LatLng } from '@/lib/types';
import { useAtlas } from '@/state/store';
import { startExplorerJourney } from '@/explorer/controller';
import { preflightCapabilities, type CapabilityStatus } from './capabilityPreflight';
import { useGenui } from '@/genui/store';

const DEFAULT_GOAL = 'Find a nearby café with the shortest verified walk; tell me whether I need a jacket.';

type LocationState = 'sample' | 'locating' | 'using' | 'error';

export function Landing() {
  const dismissed = useAtlas((state) => state.landingDismissed);
  const cityId = useAtlas((state) => state.cityId);
  const apiHealth = useAtlas((state) => state.apiHealth);
  const setKeyDialogOpen = useAtlas((state) => state.setKeyDialogOpen);
  const [goal, setGoal] = useState('');
  const [locationState, setLocationState] = useState<LocationState>('sample');
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const credential = useSyncExternalStore(
    subscribeGeminiCredential,
    getGeminiCredentialSnapshot,
    getGeminiCredentialSnapshot,
  );
  const [capabilities, setCapabilities] = useState<CapabilityStatus | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setCapabilities(null);
    void preflightCapabilities(
      Boolean(GMP_BROWSER_KEY),
      apiHealth,
      credential.source === 'byok',
      controller.signal,
    ).then((status) => {
      if (active) setCapabilities(status);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiHealth, credential.epoch, credential.source, online]);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  if (dismissed) return null;

  const liveStatus = capabilities?.mode === 'live' ? 'ready' : capabilities ? 'unavailable' : 'checking';
  const mapsReady = Boolean(
    capabilities?.browserMaps && capabilities.serverMaps && capabilities.online && capabilities.apiHealth === 'ok',
  );
  const needsGemini = mapsReady && capabilities?.gemini === false;

  const stopUsingLocation = () => {
    setSelectedLocation(null);
    setLocationState('sample');
  };

  const useMyLocation = () => {
    if (locationState === 'using') {
      stopUsingLocation();
      return;
    }
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }

    setLocationState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = { lat: position.coords.latitude, lng: position.coords.longitude };
        setSelectedLocation(center);
        setLocationState('using');
      },
      () => setLocationState('error'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const start = () => {
    if (liveStatus !== 'ready') return;
    startExplorerJourney({
      goal: goal.trim() || DEFAULT_GOAL,
      cityId,
      mode: 'live',
      location: selectedLocation ?? undefined,
    });
  };

  const submitOrConnect = () => {
    if (needsGemini) {
      setKeyDialogOpen(true);
      return;
    }
    start();
  };

  return (
    <div className="atlas-cold-open">
      <div className="atlas-cold-open__scrim" />
      <main className="atlas-cold-open__content">
        <h1 id="atlas-landing-heading" className="atlas-cold-open__title">
          What do you want to do?
        </h1>

        <section className="glass mission-brief" aria-labelledby="atlas-landing-heading">
          <div className="mission-field">
            <textarea
              ref={promptRef}
              aria-labelledby="atlas-landing-heading"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitOrConnect();
                }
              }}
              rows={3}
              autoFocus
            />
          </div>

          {locationState === 'error' ? (
            <p className="mission-location__error" role="status">
              Location unavailable.
            </p>
          ) : null}

          <div className="mission-toolbar">
            <div className="mission-toolbar__left">
              <button
                type="button"
                className={`mission-pill${locationState === 'using' ? ' is-active' : ''}`}
                onClick={useMyLocation}
                disabled={locationState === 'locating'}
                aria-pressed={locationState === 'using'}
                aria-label={
                  locationState === 'using'
                    ? 'Stop using my location'
                    : locationState === 'locating'
                      ? 'Locating'
                      : 'Use my location'
                }
                title={locationState === 'using' ? 'Stop using my location' : 'Use my location'}
              >
                {locationState === 'using' ? <X size={15} aria-hidden="true" /> : <LocateFixed size={15} aria-hidden="true" />}
                <span>
                  {locationState === 'using'
                    ? 'My location'
                    : locationState === 'locating'
                      ? 'Locating…'
                      : 'Near me'}
                </span>
              </button>

              <button
                type="button"
                className="mission-pill"
                onClick={() => {
                  useAtlas.getState().dismissLanding();
                  useGenui.getState().clearScenario('scout');
                }}
                aria-label="Open map"
                title="Open map"
              >
                <MapIcon size={15} aria-hidden="true" />
                <span>Map</span>
              </button>

              <button
                type="button"
                className={`mission-pill mission-pill--icon${credential.source === 'byok' ? ' is-active' : ''}`}
                onClick={() => setKeyDialogOpen(true)}
                aria-label="Gemini API key"
                title={credential.source === 'byok' ? 'Manage personal Gemini API key' : 'Use personal Gemini API key'}
              >
                <KeyRound size={15} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              className="mission-launch"
              onClick={submitOrConnect}
              disabled={liveStatus !== 'ready' && !needsGemini}
              aria-label={
                liveStatus === 'ready'
                  ? 'Go'
                  : liveStatus === 'checking'
                    ? 'Checking services'
                    : needsGemini
                      ? 'Connect Gemini key'
                      : 'Unavailable'
              }
            >
              {liveStatus === 'ready' ? (
                <ArrowRight size={18} aria-hidden="true" />
              ) : liveStatus === 'checking' ? (
                '…'
              ) : needsGemini ? (
                <>
                  Connect key <KeyRound size={15} aria-hidden="true" />
                </>
              ) : (
                'Unavailable'
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
