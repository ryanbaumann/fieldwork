// strava-explorer/src/urlState.js

/**
 * Validate and normalize an activity_id query parameter as a canonical string.
 * Preserves 64-bit unsigned decimal IDs and bundled demo-* IDs; rejects invalid input.
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeActivityIdParam(value) {
    if (value === null || value === undefined) return null;
    const candidate = typeof value === 'object'
        ? (typeof value.id_str === 'string' && value.id_str.trim() !== '' ? value.id_str : value.id)
        : value;
    if (candidate === null || candidate === undefined) return null;
    const trimmed = String(candidate).trim();
    return /^(?:\d{1,20}|demo-[A-Za-z0-9_-]+)$/.test(trimmed) ? trimmed : null;
}

/**
 * Pure function to read URL state from a query string.
 * @param {string} searchQueryString - e.g. "?start_date=2026-01-01&activity_id=123"
 * @returns {object} Parsed URL state
 */
export function readUrlState(searchQueryString) {
    const params = new URLSearchParams(searchQueryString);
    const parseNum = (val, fn) => {
        if (!val) return null;
        const n = fn(val);
        return isNaN(n) ? null : n;
    };
    return {
        startDate: params.get('start_date'),
        endDate: params.get('end_date'),
        count: parseNum(params.get('count'), parseInt),
        activityId: normalizeActivityIdParam(params.get('activity_id')),
        cameraHeight: parseNum(params.get('camera_height'), parseInt),
        cameraRange: parseNum(params.get('camera_range'), parseInt),
        cameraTilt: parseNum(params.get('camera_tilt'), parseInt),
        cameraSmoothness: parseNum(params.get('camera_smoothness'), parseFloat),
        cameraSpeed: parseNum(params.get('camera_speed'), parseFloat)
    };
}

/**
 * Pure function to build a query parameter string from a state object.
 * @param {object} state - The state object representing url parameters.
 * @param {string} [currentSearchString=""] - Optional search query string to preserve other parameters.
 * @returns {string} The formatted query string (without the leading '?').
 */
export function buildUrlParams(state, currentSearchString = '') {
    const params = new URLSearchParams(currentSearchString);
    params.delete('code');
    params.delete('scope');

    const setOrDelete = (key, value) => {
        if (value !== undefined && value !== null && value !== '') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
    };

    setOrDelete('start_date', state.startDate);
    setOrDelete('end_date', state.endDate);
    setOrDelete('count', state.count);
    setOrDelete('activity_id', normalizeActivityIdParam(state.activityId));
    setOrDelete('camera_height', state.cameraHeight);
    setOrDelete('camera_range', state.cameraRange);
    setOrDelete('camera_tilt', state.cameraTilt);
    
    if (state.cameraSmoothness !== undefined && state.cameraSmoothness !== null && state.cameraSmoothness !== '') {
        const val = typeof state.cameraSmoothness === 'number' ? state.cameraSmoothness.toFixed(2) : state.cameraSmoothness;
        params.set('camera_smoothness', val);
    } else {
        params.delete('camera_smoothness');
    }

    if (state.cameraSpeed !== undefined && state.cameraSpeed !== null && state.cameraSpeed !== '') {
        const val = typeof state.cameraSpeed === 'number' ? state.cameraSpeed.toFixed(2) : state.cameraSpeed;
        params.set('camera_speed', val);
    } else {
        params.delete('camera_speed');
    }

    return params.toString();
}
