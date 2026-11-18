// strava-explorer/src/strava.js

import { debug, warn, error } from './log.js';

// --- Module-Level Variables ---
let stravatoken = null;
let refreshToken = null;
let tokenExpiresAt = 0;
let userid = null;
const AUTH_STORAGE_KEY = 'trailsNinja.stravaAuth.v1';

// --- Environment Variables ---
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
// Same-origin by default: an empty base means every broker call below
// (e.g. `${STRAVA_AUTH_BASE_URL}/api/strava/token`) resolves to a relative
// `/api/strava/...` URL on the app's own origin, which is what the gateway
// container expects. Set VITE_STRAVA_AUTH_BASE_URL to point at a
// different-origin broker (e.g. the standalone Cloud Run deploy).
const STRAVA_AUTH_BASE_URL = (import.meta.env.VITE_STRAVA_AUTH_BASE_URL || '').replace(/\/$/, '');
// Default the OAuth redirect URI to this app's own base URL so it works
// same-origin without configuration; override for non-default deployments.
const STRAVA_REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI
    || (typeof window !== 'undefined' ? new URL(import.meta.env.BASE_URL, window.location.origin).href : undefined);
const STRAVA_API_BASE_URL = (import.meta.env.VITE_STRAVA_API_BASE_URL || 'https://www.strava.com/api/v3').replace(/\/$/, '');

// --- Helper Functions (Dependencies - will be passed or imported if moved to utils) ---
let showLoading = (isLoading, text) => debug(`Loading: ${isLoading}, Text: ${text}`);
let showError = (message) => error(`Error: ${message}`);

// Function to set helper dependencies (called from index.js)
export function setHelpers(helpers) {
    showLoading = helpers.showLoading;
    showError = helpers.showError;
}

// --- Strava 64-bit Identifier & JSON Helpers ---

export function normalizeEntityId(entity) {
    if (entity === null || entity === undefined) return null;
    if (typeof entity === 'string') {
        const trimmed = entity.trim();
        return trimmed !== '' ? trimmed : null;
    }
    if (typeof entity === 'bigint') {
        return entity.toString();
    }
    if (typeof entity === 'number') {
        return Number.isFinite(entity) ? String(entity) : null;
    }
    if (typeof entity === 'object') {
        if (typeof entity.id_str === 'string' && entity.id_str.trim() !== '') {
            return entity.id_str.trim();
        }
        if (entity.id !== undefined && entity.id !== null && typeof entity.id !== 'object') {
            return normalizeEntityId(entity.id);
        }
    }
    return null;
}

export const getActivityId = normalizeEntityId;
export const getAthleteId = normalizeEntityId;

function resolveSafeActivityId(activityId) {
    const resolved = getActivityId(activityId);
    return resolved && /^[A-Za-z0-9_-]+$/.test(resolved) ? resolved : null;
}

export function parseStravaJson(rawText) {
    return JSON.parse(rawText, function reviver(key, value, context) {
        if (key === 'id' && typeof value === 'number' && Number.isFinite(value)) {
            const exact = typeof context?.source === 'string' && /^-?\d+$/.test(context.source)
                ? context.source
                : String(value);
            if (this && typeof this === 'object' && !Array.isArray(this)
                && (typeof this.id_str !== 'string' || this.id_str.trim() === '')) {
                this.id_str = exact;
            }
        }
        return value;
    });
}

function normalizeAthlete(athlete) {
    if (!athlete || typeof athlete !== 'object') return athlete;
    const idStr = getAthleteId(athlete);
    if (!idStr) return athlete;
    return athlete.id_str === idStr ? athlete : { ...athlete, id_str: idStr };
}

function normalizeActivity(activity) {
    if (!activity || typeof activity !== 'object') return activity;
    const idStr = getActivityId(activity);
    const normalizedAthlete = activity.athlete ? normalizeAthlete(activity.athlete) : activity.athlete;
    return {
        ...activity,
        ...(idStr ? { id_str: idStr } : {}),
        ...(activity.athlete ? { athlete: normalizedAthlete } : {}),
    };
}

async function readStravaJson(response, fallback = {}) {
    try {
        if (typeof response.text === 'function') {
            const rawText = await response.text();
            if (!rawText) return fallback;
            const parsed = parseStravaJson(rawText);
            return parsed ?? fallback;
        }
        if (typeof response.json === 'function') {
            const parsed = await response.json();
            return parsed ?? fallback;
        }
    } catch {
        return fallback;
    }
    return fallback;
}

// --- Strava Auth ---
export async function exchangeToken(code) {
    if (!STRAVA_CLIENT_ID) {
        throw new Error("Strava Client ID is missing from environment variables.");
    }
    const tokenUrl = `${STRAVA_AUTH_BASE_URL}/api/strava/token`;
    const params = JSON.stringify({ code });

    showLoading(true, "Authenticating with Strava...");
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: params
        });

        if (!response.ok) {
            const errorData = await readStravaJson(response, {});
            throw new Error(`Strava token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const rawData = await readStravaJson(response, {});
        const data = rawData?.athlete
            ? { ...rawData, athlete: normalizeAthlete(rawData.athlete) }
            : rawData;
        debug("Strava authentication succeeded; token cached in this browser.");
        if (data.access_token) {
            storeAuthData(data);
            return data; // Return the full auth data including athlete info
        } else {
            throw new Error("Access token not found in Strava auth response.");
        }
    } catch (err) {
        error('Error exchanging Strava token:', err);
        showError(`Strava authentication failed: ${err.message}`);
        throw err; // Re-throw error to be caught by caller
    } finally {
        showLoading(false);
    }
}

export async function fetchActivityStreams(activityId, token, streamTypes) {
    const resolvedActivityId = resolveSafeActivityId(activityId);
    if (!resolvedActivityId || !token || !streamTypes || !streamTypes.length) {
        error("Missing parameters for fetchActivityStreams");
        // helpers are globally available in this module after setHelpers is called
        showError("Cannot fetch activity streams: Missing required info.");
        throw new Error("Missing parameters for fetchActivityStreams");
    }
    showLoading(true, "Fetching activity streams...");
    try {
        const keys = streamTypes.join(',');
        const response = await fetch(`${STRAVA_API_BASE_URL}/activities/${encodeURIComponent(resolvedActivityId)}/streams?keys=${keys}&key_by_type=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await readStravaJson(response, {});
            error("Strava API error (streams):", errorData);
            throw new Error(`Strava API Error: ${response.status} ${response.statusText}`);
        }
        const streamsData = await readStravaJson(response, {});
        showLoading(false);
        return streamsData;
    } catch (err) {
        error("Error in fetchActivityStreams:", err);
        showLoading(false);
        throw err;
    }
}

export function getStravaToken() {
    return stravatoken;
}

export function getCachedAuthData() {
    const authData = readStoredAuthData();
    if (!authData?.access_token) return null;
    stravatoken = authData.access_token;
    refreshToken = authData.refresh_token || refreshToken;
    tokenExpiresAt = authData.expires_at || 0;
    userid = getAthleteId(authData.athlete) || userid;
    return authData;
}

export function isTokenExpiringSoon() {
    return Boolean(tokenExpiresAt && tokenExpiresAt * 1000 < Date.now() + 5 * 60 * 1000);
}

export async function ensureValidToken() {
    if (!stravatoken) getCachedAuthData();
    if (!stravatoken) return null;
    if (!isTokenExpiringSoon()) return stravatoken;
    const refreshed = await refreshAccessToken();
    return refreshed?.access_token || null;
}

export function getUserId() {
    return userid;
}

export async function deauthorizeStrava() {
    if (!stravatoken) getCachedAuthData();
    if (!stravatoken) {
        clearStravaToken();
        return;
    }
    // STRAVA_AUTH_BASE_URL defaults to '' (same-origin /api/strava/...), so
    // an empty base is not a sign the broker is unconfigured — always try
    // the network call and fall back to a local-only clear on failure.
    try {
        await fetch(`${STRAVA_AUTH_BASE_URL}/api/strava/deauthorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: stravatoken })
        });
    } catch (err) {
        warn('Strava deauthorize request failed; clearing local session anyway.', err);
    }
    clearStravaToken();
}

export function clearStravaToken() {
    stravatoken = null;
    refreshToken = null;
    tokenExpiresAt = 0;
    userid = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function storeAuthData(data) {
    if (!data?.access_token) return;
    const existing = readStoredAuthData() || {};
    const athlete = normalizeAthlete(data.athlete || existing.athlete);
    stravatoken = data.access_token;
    refreshToken = data.refresh_token || refreshToken;
    tokenExpiresAt = data.expires_at || 0;
    userid = getAthleteId(athlete) || userid;

    const authData = {
        ...existing,
        ...data,
        athlete,
        cached_at: Math.floor(Date.now() / 1000)
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

function readStoredAuthData() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
        const authData = parseStravaJson(raw);
        if (!authData?.access_token) return null;
        if (authData.athlete) {
            authData.athlete = normalizeAthlete(authData.athlete);
        }
        return authData;
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

async function refreshAccessToken() {
    if (!STRAVA_CLIENT_ID || !refreshToken) {
        clearStravaToken();
        return null;
    }
    showLoading(true, "Refreshing Strava session...");
    const tokenUrl = `${STRAVA_AUTH_BASE_URL}/api/strava/refresh`;
    const params = JSON.stringify({ refresh_token: refreshToken });
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: params
        });
        if (!response.ok) {
            clearStravaToken();
            throw new Error(`Strava token refresh failed: ${response.status} ${response.statusText}`);
        }
        const data = await readStravaJson(response, {});
        storeAuthData(data);
        return getCachedAuthData();
    } finally {
        showLoading(false);
    }
}

export function getStravaAuthUrl() {
    if (!STRAVA_CLIENT_ID || !STRAVA_REDIRECT_URI) {
        error("Strava Client ID or Redirect URI missing from environment variables.");
        showError("Configuration error: Cannot initiate Strava connection.");
        return null;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    const stravaAuthScope = 'activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&approval_prompt=auto&scope=${stravaAuthScope}&state=${state}`;
}

// --- Strava API Fetching ---

export async function fetchActivities(accessToken, beforeTimestamp = null, afterTimestamp = null, perPage = 30) {
    debug(`Fetching activities with token: ${accessToken ? '******' : 'null'}, Before: ${beforeTimestamp}, After: ${afterTimestamp}, Count: ${perPage}`);
    if (!accessToken) throw new Error("Strava access token is required.");

    const activitiesUrl = `${STRAVA_API_BASE_URL}/athlete/activities`;
    const params = new URLSearchParams();

    if (beforeTimestamp) params.set('before', beforeTimestamp);
    if (afterTimestamp) params.set('after', afterTimestamp);
    params.set('per_page', Math.min(perPage, 100).toString()); // Ensure max 100

    showLoading(true, "Fetching Strava activities...");
    try {
        const response = await fetch(`${activitiesUrl}?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorData = await readStravaJson(response, {});
            throw new Error(`Strava activities fetch failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const parsed = await readStravaJson(response, []);
        const activities = Array.isArray(parsed) ? parsed.map(normalizeActivity) : [];
        debug(`Parsed ${activities.length} activities.`);
        return activities;

    } catch (err) {
        error('Error fetching Strava activities:', err);
        showError(`Failed to fetch activities: ${err.message}`);
        throw err;
    } finally {
        showLoading(false);
    }
}

export async function fetchDetailedActivityData(activityId, accessToken) {
    if (!accessToken) {
        showError("Not authenticated with Strava.");
        throw new Error("Not authenticated with Strava.");
    }
    const resolvedActivityId = resolveSafeActivityId(activityId);
    if (!resolvedActivityId) {
        showError("No Activity ID provided.");
        throw new Error("No Activity ID provided.");
    }

    debug(`Fetching detailed data for activity ID: ${resolvedActivityId}`);
    const detailedActivityUrl = `${STRAVA_API_BASE_URL}/activities/${encodeURIComponent(resolvedActivityId)}`;

    showLoading(true, "Fetching activity details...");
    try {
        const response = await fetch(detailedActivityUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        debug(`[fetchDetailedActivityData] Called for activity ID: ${resolvedActivityId}`);

        if (!response.ok) {
            const errorData = await readStravaJson(response, {});
            throw new Error(`Strava detailed activity fetch failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const detailedActivityData = normalizeActivity(await readStravaJson(response, {}));
        debug("Detailed activity data received.");
        return detailedActivityData;

    } catch (err) {
        error('Error fetching Strava detailed activity:', err);
        showError(`Failed to fetch activity details: ${err.message}`);
        throw err;
    } finally {
        showLoading(false);
        debug(`[fetchDetailedActivityData] Successfully fetched data for ${resolvedActivityId}.`);
    }
}

export async function fetchPhotoData(activityId, accessToken) {
    const resolvedActivityId = resolveSafeActivityId(activityId);
    debug(`[fetchPhotoData] Called for activity ID: ${resolvedActivityId}`);
    if (!accessToken) throw new Error("Strava access token is required.");
    if (!resolvedActivityId) throw new Error("Activity ID is required.");

    const photoURL = `${STRAVA_API_BASE_URL}/activities/${encodeURIComponent(resolvedActivityId)}/photos?photo_sources=true&size=1000`;
    showLoading(true, "Fetching activity photos...");
    try {
        const response = await fetch(photoURL, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const parsed = await readStravaJson(response, []);
        const photos = Array.isArray(parsed) ? parsed : [];
        debug(`[fetchPhotoData] Received ${photos.length} photos from Strava.`);
        return photos;
    } catch (err) {
        error("Error fetching Strava photos:", err);
        throw err; // Re-throw
    } finally {
        showLoading(false);
    }
}
