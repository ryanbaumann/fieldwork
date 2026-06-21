# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-06-21

### Added
- **Premium Dark Mode UI**: Overhauled [index.html](file:///Users/ryanbaumann/projects/trails.ninja/strava-explorer/index.html) with a premium glassmorphism theme, translucent control panels, custom telemetry grid, and custom-styled form controls (sliders, selects).
- **Start/Finish 3D Pins**: Added custom green (`#4CAF50`) and red (`#F44336`) standard `PinElement` markers for the start and finish of Strava routes in [gmp.js](file:///Users/ryanbaumann/projects/trails.ninja/strava-explorer/src/gmp.js).
- **Dynamic Tour Timing**: The follow-camera fly-through duration now scales based on route length instead of a fixed time, improving the visual pacing on both short trails and long rides.

### Changed / Improved
- **Maps JS API Version**: Reverted back to the `weekly` build for production stability in [gmp.js](file:///Users/ryanbaumann/projects/trails.ninja/strava-explorer/src/gmp.js).
- **Enhanced Camera Smoothing**: Blended multiple look-ahead route coordinates and implemented a frame-rate-aware yaw rate limit in [followCamera.js](file:///Users/ryanbaumann/projects/trails.ninja/strava-explorer/src/followCamera.js) to prevent sudden camera jumps or "rubber-banding" around switchbacks.
- **Improved Elevation Tracking**: Connected elevation profile clicks directly to tracking markers and follow-camera progress, enabling fluid map scrub previews.
- **Shareable URL Parameters & Deep-Linking**: Implemented serialization of date filters, activity selection, and all follow-camera settings to query parameters using `history.replaceState()`. Includes intelligent deep-linking that safely auto-loads shared activities.
- **Floating HUD Share Button**: Added a beautiful glass-morphism "Share Tour" button with built-in clipboard copying and visual feedback.
- **Compact UI Optimization**: Removed static debug HUD badge and tightened vertical padding between the sidebar title and the "Pick a route" section.

### Fixed
- **Call Stack Overflow Crash**: Resolved a severe `RangeError: Maximum call stack size exceeded` crash in the Maps 3D custom element observer by appending the underlying DOM element `pin.element` (`marker.append(pin.element)`) instead of the wrapper object (`marker.append(pin)`), which causes infinite recursion.
- **Reference Errors**: Fixed ReferenceErrors where `temp_token` and `getTourSettings` were undefined during URL state parsing and authentication flow.
- **Custom Pin Image Deprecation**: Swapped deprecated `glyph` to `glyphSrc` for loading photo URLs onto custom `PinElement` markers, preventing WebGL/Maps 3D serialization failures.
- **3D Photo Marker Sizing**: Replaced custom unscalable `HTMLTemplateElement` image billboards with properly proportioned, natively scalable `PinElement` structures.

---

## [1.1.0] - 2026-06-20

### Added
- Cloud Run token broker for OAuth flow, separating `STRAVA_CLIENT_SECRET` from client-side bundle.
- GCS + Cloud CDN static assets build and deployment scripts.

### Changed
- Refactored Strava activity processing to store access and refresh tokens locally in browser `localStorage`.

---

## [1.0.0] - 2026-06-19

### Added
- Initial project structure.
- `strava-explorer/`: Vite + Google Maps Platform 3D Maps app for 3D route viewing.
- `aqi-map/`: Mapbox GL + PurpleAir hyperlocal AQI map.
