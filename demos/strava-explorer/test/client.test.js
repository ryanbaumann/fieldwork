import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as geo from '../src/geo.js';
import * as units from '../src/units.js';
import * as urlState from '../src/urlState.js';
import * as photos from '../src/photos.js';
import { proxiedPhotoUrl } from '../src/photoUrl.js';
import * as strava from '../src/strava.js';
import * as icons from '../src/activityIcons.js';

// Setup Mock LocalStorage for Strava tests
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem(key) {
            return store[key] || null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        },
        clear() {
            store = {};
        }
    };
})();

global.localStorage = mockLocalStorage;

describe('src/photoUrl.js', () => {
    const photo = 'https://dgtzuqphqg23d.cloudfront.net/path/photo.jpg?size=600';

    test('uses the same-origin proxy when the broker base is empty', () => {
        expect(proxiedPhotoUrl(photo)).toBe(`/api/photo-proxy?url=${encodeURIComponent(photo)}`);
    });

    test('uses a configured cross-origin broker base', () => {
        expect(proxiedPhotoUrl(photo, 'https://broker.example/')).toBe(
            `https://broker.example/api/photo-proxy?url=${encodeURIComponent(photo)}`,
        );
    });

    test('does not proxy unsupported, insecure, or non-default-port URLs', () => {
        const unsupported = 'https://images.example/photo.jpg';
        const insecure = 'http://dgtzuqphqg23d.cloudfront.net/photo.jpg';
        const customPort = 'https://dgtzuqphqg23d.cloudfront.net:444/photo.jpg';
        expect(proxiedPhotoUrl(unsupported)).toBe(unsupported);
        expect(proxiedPhotoUrl(insecure)).toBe(insecure);
        expect(proxiedPhotoUrl(customPort)).toBe(customPort);
    });
});

describe('src/geo.js', () => {
    test('clamp', () => {
        expect(geo.clamp(5, 1, 10)).toBe(5);
        expect(geo.clamp(-5, 1, 10)).toBe(1);
        expect(geo.clamp(15, 1, 10)).toBe(10);
    });

    test('lerp', () => {
        expect(geo.lerp(10, 20, 0)).toBe(10);
        expect(geo.lerp(10, 20, 0.5)).toBe(15);
        expect(geo.lerp(10, 20, 1)).toBe(20);
        expect(geo.lerp(10, 20, 1.5)).toBe(20); // clamps amt to 1
    });

    test('lerpAngle', () => {
        expect(geo.lerpAngle(0, 90, 0.5)).toBe(45);
        expect(geo.lerpAngle(350, 10, 0.5)).toBe(0); // shortest way is cross 0
        expect(geo.lerpAngle(10, 350, 0.5)).toBe(0);
    });

    test('haversineKm', () => {
        const p1 = { lat: 46.508, lng: 11.838 };
        const p2 = { lat: 46.508, lng: 11.838 };
        expect(geo.haversineKm(p1, p2)).toBe(0);

        const p3 = { lat: 46.538, lng: 11.858 };
        const d = geo.haversineKm(p1, p3);
        expect(d).toBeGreaterThan(3);
        expect(d).toBeLessThan(4);
    });

    test('bearingDeg', () => {
        const p1 = { lat: 0, lng: 0 };
        const p2 = { lat: 1, lng: 0 }; // straight north
        expect(geo.bearingDeg(p1, p2)).toBeCloseTo(0, 1);

        const p3 = { lat: 0, lng: 1 }; // straight east
        expect(geo.bearingDeg(p1, p3)).toBeCloseTo(90, 1);
    });

    test('samplePointAlongLine', () => {
        const coords = [
            { lat: 0, lng: 0, altitude: 10 },
            { lat: 0.1, lng: 0, altitude: 20 },
            { lat: 0.2, lng: 0, altitude: 30 }
        ];

        // 0 distance
        const s0 = geo.samplePointAlongLine(coords, 0);
        expect(s0.point.lat).toBeCloseTo(0);
        expect(s0.point.altitude).toBe(10);

        // halfway to the first segment
        const d1 = geo.haversineKm(coords[0], coords[1]);
        const s1 = geo.samplePointAlongLine(coords, d1 / 2);
        expect(s1.point.lat).toBeCloseTo(0.05);
        expect(s1.point.altitude).toBeCloseTo(15);
    });

    test('downsamplePath', () => {
        const path = Array.from({ length: 10 }, (_, i) => ({ lat: i, lng: i, altitude: i }));
        const downsampled = geo.downsamplePath(path, 3);
        expect(downsampled.length).toBeLessThanOrEqual(5); // should be downsampled
        // verify endpoints kept
        expect(downsampled[0]).toEqual(path[0]);
        expect(downsampled[downsampled.length - 1]).toEqual(path[path.length - 1]);
    });

    test('smoothPath', () => {
        const coords = [
            { lat: 1, lng: 1, altitude: 10 },
            { lat: 2, lng: 2, altitude: 20 },
            { lat: 3, lng: 3, altitude: 30 }
        ];
        const smoothed = geo.smoothPath(coords, 3);
        expect(smoothed.length).toBe(3);
        // Middle one should be average of all three: (1+2+3)/3 = 2, altitude (10+20+30)/3 = 20
        expect(smoothed[1].lat).toBeCloseTo(2);
        expect(smoothed[1].altitude).toBeCloseTo(20);
    });

    test('calculateElevationLoss', () => {
        const alts = [100, 150, 120, 130, 90, 100];
        // losses: 150->120 (-30), 130->90 (-40). Total loss = 70.
        expect(geo.calculateElevationLoss(alts)).toBe(70);
    });
});

describe('src/units.js', () => {
    test('formatDistance', () => {
        // useImperial = true (miles)
        // 1609.344 meters is 1 mile
        expect(units.formatDistance(1609.344, true)).toBe("1.00 mi");
        // useImperial = false (km)
        expect(units.formatDistance(1000, false)).toBe("1.00 km");
    });

    test('formatElevation', () => {
        // useImperial = true (feet)
        // 100 meters * 3.28084 = 328 feet
        expect(units.formatElevation(100, true)).toBe("328 ft");
        // useImperial = false (meters)
        expect(units.formatElevation(100, false)).toBe("100 m");
    });

    test('formatSpeed', () => {
        // useImperial = true (mph)
        // 1 m/s * 2.23694 = 2.2 mph
        expect(units.formatSpeed(1, true)).toBe("2.2 mph");
        // useImperial = false (km/h)
        expect(units.formatSpeed(10, false)).toBe("36.0 km/h");
    });

    test('formatDuration', () => {
        expect(units.formatDuration(3665)).toBe("1:01:05");
        expect(units.formatDuration(45)).toBe("0:00:45");
    });
});

describe('src/urlState.js', () => {
    test('readUrlState', () => {
        const query = '?start_date=2026-01-01&count=25&camera_height=150';
        const parsed = urlState.readUrlState(query);
        expect(parsed.startDate).toBe('2026-01-01');
        expect(parsed.count).toBe(25);
        expect(parsed.cameraHeight).toBe(150);
        expect(parsed.cameraRange).toBeNull();
    });

    test('buildUrlParams', () => {
        const state = {
            startDate: '2026-01-01',
            count: 25,
            cameraHeight: 150,
            activityId: 'demo-123'
        };
        const query = urlState.buildUrlParams(state);
        const params = new URLSearchParams(query);
        expect(params.get('start_date')).toBe('2026-01-01');
        expect(params.get('count')).toBe('25');
        expect(params.get('camera_height')).toBe('150');
        expect(params.get('activity_id')).toBe('demo-123');
    });

    test('readUrlState and buildUrlParams preserve 64-bit string activity IDs and reject invalid IDs', () => {
        const bigId = '9007199254740993';
        const parsed = urlState.readUrlState(`?activity_id=${bigId}`);
        expect(parsed.activityId).toBe(bigId);

        const rebuilt = new URLSearchParams(urlState.buildUrlParams({ activityId: bigId }));
        expect(rebuilt.get('activity_id')).toBe(bigId);

        expect(urlState.readUrlState('?activity_id=demo-alpine-ride').activityId).toBe('demo-alpine-ride');
        expect(urlState.readUrlState('?activity_id=../athlete').activityId).toBeNull();
        expect(urlState.readUrlState('?activity_id=abc123').activityId).toBeNull();
        expect(urlState.buildUrlParams({ activityId: '../athlete' })).toBe('');
    });
});

describe('src/photos.js', () => {
    test('groupPhotosByProximity', () => {
        const mockPhotos = [
            { unique_id: 'p1', location: [40.0, -100.0] },
            { unique_id: 'p2', location: [40.00001, -100.00001] }, // close to p1
            { unique_id: 'p3', location: [41.0, -101.0] }, // far
            { unique_id: 'p4', location: [] } // unlocated
        ];

        // mock distance function: returns 0 if same or super close, 5 otherwise
        const mockDistFn = (a, b) => {
            if (Math.abs(a.lat - b.lat) < 0.01) return 0.001; // 1 meter
            return 5;
        };

        const groups = photos.groupPhotosByProximity(mockPhotos, mockDistFn);
        // should have 2 groups: [p1, p2] and [p3]. p4 is filtered out.
        expect(groups.length).toBe(2);
        expect(groups[0].photos.length).toBe(2);
        expect(groups[1].photos.length).toBe(1);
    });
});

describe('Token Expiration (src/strava.js)', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('isTokenExpiringSoon transitions', () => {
        const nowSec = Math.floor(Date.now() / 1000);
        // set token expiring in 4 minutes (240 seconds) - which is < 5 minutes threshold
        const authData = {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_at: nowSec + 240,
            athlete: { id: 12345 }
        };

        localStorage.setItem('trailsNinja.stravaAuth.v1', JSON.stringify(authData));
        strava.getCachedAuthData();

        expect(strava.isTokenExpiringSoon()).toBe(true);

        // set token expiring in 10 minutes (600 seconds) - should not be expiring soon
        const authDataFuture = {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_at: nowSec + 600,
            athlete: { id: 12345 }
        };

        localStorage.setItem('trailsNinja.stravaAuth.v1', JSON.stringify(authDataFuture));
        strava.getCachedAuthData();

        expect(strava.isTokenExpiringSoon()).toBe(false);

        // Advance time by 6 minutes (360 seconds) - should now be expiring soon
        vi.advanceTimersByTime(360 * 1000);
        expect(strava.isTokenExpiringSoon()).toBe(true);
    });
});

describe('src/activityIcons.js', () => {
    test('maps Strava sport_type values onto canonical keys', () => {
        expect(icons.normalizeSportType({ sport_type: 'MountainBikeRide' })).toBe('mountainbikeride');
        expect(icons.normalizeSportType({ sport_type: 'TrailRun' })).toBe('trailrun');
        expect(icons.normalizeSportType({ sport_type: 'GravelRide' })).toBe('gravelride');
        expect(icons.normalizeSportType({ sport_type: 'EBikeRide' })).toBe('ebikeride');
        expect(icons.normalizeSportType({ sport_type: 'Snowshoe' })).toBe('hike');
        expect(icons.normalizeSportType({ sport_type: 'Kayaking' })).toBe('watersport');
        expect(icons.normalizeSportType('Run')).toBe('run');
    });

    test('prefers sport_type over the legacy type field', () => {
        expect(icons.normalizeSportType({ type: 'Ride', sport_type: 'MountainBikeRide' })).toBe('mountainbikeride');
        expect(icons.normalizeSportType({ type: 'Ride' })).toBe('ride');
        expect(icons.normalizeSportType({ type: 'Run', name: 'Morning Trail Run' })).toBe('trailrun');
        expect(icons.normalizeSportType({ type: 'Ride', name: 'Weekend MTB Loop' })).toBe('mountainbikeride');
    });

    test('falls back to demo activities and then to default', () => {
        expect(icons.normalizeSportType({ id: 'demo-alpine-ride' })).toBe('ride');
        expect(icons.normalizeSportType({ id: 'demo-coastal-run' })).toBe('run');
        expect(icons.normalizeSportType({ id_str: 'demo-alpine-ride' })).toBe('ride');
        expect(icons.normalizeSportType({ id_str: 'demo-coastal-run' })).toBe('run');
        expect(icons.normalizeSportType({ sport_type: 'Curling' })).toBe('default');
        expect(icons.normalizeSportType(null)).toBe('default');
    });

    test('every sport renders a distinct, well-formed marker SVG', () => {
        const rendered = icons.SPORT_KEYS.map((key) => icons.activityMarkerSvg(key));
        rendered.forEach((svg, i) => {
            expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
            expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
            expect(svg).toContain(`aria-label="${icons.sportDescriptor(icons.SPORT_KEYS[i]).label} position"`);
        });
        expect(new Set(rendered).size).toBe(rendered.length);
    });

    test('marker size option scales the viewport, not the viewBox', () => {
        const svg = icons.activityMarkerSvg('hike', { size: 92 });
        expect(svg).toContain('width="92"');
        expect(svg).toContain('height="116"');
        expect(svg).toContain('viewBox="0 0 46 58"');
    });

    test('sport emoji stays in sync with the marker sport', () => {
        expect(icons.sportEmoji({ sport_type: 'MountainBikeRide' })).toBe('🚵');
        expect(icons.sportEmoji({ sport_type: 'Ride' })).toBe('🚴');
        expect(icons.sportEmoji({ sport_type: 'TrailRun' })).toBe('🏃🌲');
        expect(icons.sportEmoji({ sport_type: 'Hike' })).toBe('🥾');
    });
});

describe('64-bit Strava Activity and Athlete IDs (src/strava.js)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        localStorage.clear();
        strava.clearStravaToken();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    test('normalizeEntityId, getActivityId, and getAthleteId prefer id_str over id', () => {
        expect(strava.normalizeEntityId({ id: 9007199254740992, id_str: '9007199254740993' })).toBe('9007199254740993');
        expect(strava.getActivityId({ id: 9007199254740992, id_str: '9007199254740993' })).toBe('9007199254740993');
        expect(strava.getAthleteId({ id: 12345 })).toBe('12345');
        expect(strava.normalizeEntityId({ id: 'demo-alpine-ride' })).toBe('demo-alpine-ride');
        expect(strava.normalizeEntityId(9007199254740993n)).toBe('9007199254740993');
        expect(strava.normalizeEntityId('  9007199254740993  ')).toBe('9007199254740993');
        expect(strava.normalizeEntityId(null)).toBeNull();
        expect(strava.normalizeEntityId(undefined)).toBeNull();
        expect(strava.normalizeEntityId('')).toBeNull();
        expect(strava.normalizeEntityId(Number.NaN)).toBeNull();
    });

    test('parseStravaJson recovers exact 64-bit IDs into id_str without overwriting valid id_str', () => {
        const raw = [
            '[',
            '  {',
            '    "id": 9007199254740993,',
            '    "athlete": { "id": 9223372036854775807, "id_str": null },',
            '    "map": { "id": "a9007199254740993", "summary_polyline": "abc" }',
            '  },',
            '  {',
            '    "id": 18446744073709551615,',
            '    "id_str": "18446744073709551615"',
            '  }',
            ']'
        ].join('\n');

        const parsed = strava.parseStravaJson(raw);
        expect(parsed[0].id_str).toBe('9007199254740993');
        expect(parsed[0].athlete.id_str).toBe('9223372036854775807');
        expect(parsed[0].map.id_str).toBeUndefined();
        expect(parsed[1].id_str).toBe('18446744073709551615');
    });

    test('getCachedAuthData and getUserId handle 64-bit athlete IDs, legacy numeric IDs, and token refresh', async () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        localStorage.setItem('trailsNinja.stravaAuth.v1', JSON.stringify({
            access_token: 'tok-1',
            refresh_token: 'ref-1',
            expires_at: futureExp,
            athlete: { id: 9007199254740992, id_str: '9007199254740993', firstname: 'Ryan' }
        }));

        const cached = strava.getCachedAuthData();
        expect(cached.athlete.id_str).toBe('9007199254740993');
        expect(strava.getUserId()).toBe('9007199254740993');

        // Legacy integer ID in localStorage normalizes to string
        strava.clearStravaToken();
        localStorage.setItem('trailsNinja.stravaAuth.v1', JSON.stringify({
            access_token: 'tok-legacy',
            refresh_token: 'ref-legacy',
            expires_at: futureExp,
            athlete: { id: 12345 }
        }));
        strava.getCachedAuthData();
        expect(strava.getUserId()).toBe('12345');

        // exchangeToken + refresh preserves 64-bit athlete.id_str even when refresh omits athlete
        vi.stubEnv('VITE_STRAVA_CLIENT_ID', '12345');
        vi.resetModules();
        const freshStrava = await import('../src/strava.js');
        freshStrava.setHelpers({ showLoading: vi.fn(), showError: vi.fn() });

        const expiredSoon = Math.floor(Date.now() / 1000) + 60;
        global.fetch = vi.fn()
            .mockResolvedValueOnce(new Response(
                `{"access_token":"tok-new","refresh_token":"ref-new","expires_at":${expiredSoon},"athlete":{"id":9007199254740993,"firstname":"Ryan"}}`,
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ))
            .mockResolvedValueOnce(new Response(
                `{"access_token":"tok-refreshed","refresh_token":"ref-2","expires_at":${futureExp}}`,
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ));

        const auth = await freshStrava.exchangeToken('auth-code');
        expect(auth.athlete.id_str).toBe('9007199254740993');
        expect(freshStrava.getUserId()).toBe('9007199254740993');

        const refreshedToken = await freshStrava.ensureValidToken();
        expect(refreshedToken).toBe('tok-refreshed');
        expect(freshStrava.getUserId()).toBe('9007199254740993');
        expect(freshStrava.getCachedAuthData().athlete.id_str).toBe('9007199254740993');
    });

    test('fetchActivities, fetchDetailedActivityData, fetchActivityStreams, and fetchPhotoData preserve and route 64-bit IDs', async () => {
        const bigId = '9007199254740993';
        const activityStub = { id: 9007199254740992, id_str: bigId };

        global.fetch = vi.fn()
            .mockResolvedValueOnce(new Response(
                `[{"id":9007199254740993,"name":"Big Ride","athlete":{"id":9007199254740995}}]`,
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ))
            .mockResolvedValueOnce(new Response(
                `{"id":9007199254740993,"name":"Big Ride","athlete":{"id":9007199254740995}}`,
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ))
            .mockResolvedValueOnce(new Response(
                '{"altitude":{"data":[10,20]}}',
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ))
            .mockResolvedValueOnce(new Response(
                '[{"unique_id":"p1"}]',
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ));

        const list = await strava.fetchActivities('tok');
        expect(list[0].id_str).toBe(bigId);
        expect(list[0].athlete.id_str).toBe('9007199254740995');

        const detail = await strava.fetchDetailedActivityData(activityStub, 'tok');
        expect(detail.id_str).toBe(bigId);
        expect(global.fetch.mock.calls[1][0]).toContain(`/activities/${bigId}`);
        expect(global.fetch.mock.calls[1][0]).not.toContain('9007199254740992');

        await strava.fetchActivityStreams(bigId, 'tok', ['altitude']);
        expect(global.fetch.mock.calls[2][0]).toContain(`/activities/${bigId}/streams`);

        await strava.fetchPhotoData(activityStub, 'tok');
        expect(global.fetch.mock.calls[3][0]).toContain(`/activities/${bigId}/photos`);

        await expect(strava.fetchDetailedActivityData('../athlete', 'tok')).rejects.toThrow('No Activity ID provided.');
        await expect(strava.fetchActivityStreams('..', 'tok', ['altitude'])).rejects.toThrow('Missing parameters for fetchActivityStreams');
        await expect(strava.fetchPhotoData('..', 'tok')).rejects.toThrow('Activity ID is required.');
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });
});
