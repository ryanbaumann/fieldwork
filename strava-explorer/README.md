# Strava Explorer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A focused static web app for connecting Strava, selecting recent activities, and exploring routes in Google Maps Platform Photorealistic 3D. The app syncs route rendering, endpoint markers, activity photos, elevation, stats, and camera controls so a route can be reviewed like a short 3D flythrough.

## Features

- Strava OAuth2 connection for recent activities.
- Activity filtering and first-activity auto-selection.
- Terrain-clamped Google Maps JavaScript 3D route polylines.
- 3D start/finish markers plus interactive photo markers with map-anchored popovers.
- Camera shortcuts for fit route, fly to start, fly to finish, orbit, and follow-camera tours.
- Reduced-motion-aware map and UI animation behavior.
- Activity stats and an imperial elevation profile.

## Tech stack

- Vanilla JavaScript modules, HTML, and Tailwind CDN utilities.
- Vite for local development and production bundling.
- Google Maps Platform Maps JavaScript API `weekly` channel with `maps3d`, `marker`, `elevation`, `geometry`, and `core` libraries.
- Strava V3 API.

## Prerequisites

- Node.js 20 or newer.
- npm, or Yarn if you prefer matching the existing lockfile workflow.
- A Strava API application.
- A Google Maps Platform project with billing enabled.

## Environment variables

Create `strava-explorer/.env.development` for local development and configure equivalent variables in your deployment provider for production builds:

```dotenv
VITE_STRAVA_CLIENT_ID=YOUR_STRAVA_CLIENT_ID
VITE_STRAVA_CLIENT_SECRET=YOUR_STRAVA_CLIENT_SECRET
VITE_STRAVA_REDIRECT_URI=http://localhost:5173/
VITE_GMP_API_KEY=YOUR_GOOGLE_MAPS_BROWSER_KEY
```

Never commit `.env.*` files. All `VITE_` variables are browser-exposed after build, so restrict the Google Maps browser key by API and HTTP referrer and treat the Strava browser OAuth flow accordingly.

## Service setup

### Strava

1. Open <https://www.strava.com/settings/api>.
2. Set the local authorization callback domain to `localhost`.
3. Add the local redirect URI used by `VITE_STRAVA_REDIRECT_URI`, typically `http://localhost:5173/`.
4. Add the production callback domain and redirect URI before deploying.

### Google Maps Platform

Enable the APIs needed by the current app runtime:

- Maps JavaScript API with the `weekly` channel for 3D Maps.
- Map Tiles API / Photorealistic 3D Tiles.
- Elevation API.

Recommended browser-key restrictions:

- API restrictions limited to the required APIs above.
- HTTP referrer restrictions for local origins such as `http://localhost:5173/*` plus the production origin.
- Billing budgets, quota alerts, and monitoring for Elevation API usage. Elevation lookups are batched, but photo markers and follow-camera samples can still consume quota.

## Install

```bash
cd strava-explorer
npm install
# or: yarn install
```

## Run locally

```bash
npm run dev -- --host 0.0.0.0
# or: yarn dev --host 0.0.0.0
```

Open the Vite URL printed in the terminal, connect Strava, select an activity, and use the camera controls in the activity panel.

## Build

```bash
npm run build
# or: yarn build
```

Vite writes static production assets to `dist/`.

## Preview the production build

```bash
npm run preview -- --host 0.0.0.0
# or: yarn preview --host 0.0.0.0
```

## Test and validation

```bash
npm test
```

`npm test` currently runs the production build. For map, OAuth, camera, or responsive UI changes, also complete the manual browser checklist below with valid development credentials.

## Deployment architecture for 2026 Strava API changes

Strava announced a revised Developer Program on June 1, 2026. The parts that matter for this app are: Standard tier is self-service but limited to up to 10 athletes unless you qualify for higher capacity; Standard tier developers need a Strava subscription after the June 2026 transition; some club and segment endpoints are deprecated or restricted on September 1, 2026; and on June 1, 2027 Strava requires bearer tokens in request headers and moves the API base URL from `https://www.strava.com/api/v3` to the new `api-v3.strava.com` host. The current app already sends bearer tokens in headers and does not depend on club or segment-explore endpoints.

### Recommended deployment model

For sharing with many people, use a two-tier deployment:

1. **Static frontend on GCS + Cloud CDN** for the Vite build in `dist/`. This is the cheapest serving path, can be public, supports a custom HTTPS domain, and lets the Google Maps browser key be locked to exact HTTP referrers.
2. **Small Cloud Run OAuth/token broker** before broad public launch. The current static-only app can deploy today, but Vite exposes every `VITE_` value to the browser, so `VITE_STRAVA_CLIENT_SECRET` is not appropriate for a public app. A Cloud Run broker should own `STRAVA_CLIENT_SECRET`, perform `POST /oauth/token` and refresh-token exchanges server-side, set secure HTTP-only cookies or return short-lived session tokens, implement logout by calling Strava's current revoke endpoint, and delete cached user data on request. Keep the broker direct-to-Strava; do not make it an API intermediary, pass-through proxy for third parties, MCP server, or data aggregation layer.
3. **No server-side Strava data persistence by default.** Keep selected activity data in browser memory/local storage only when needed for the user's current session. If server caching is added, cap it below Strava's current 7-day cache policy and support immediate deletion.

A public GCS bucket is acceptable for the frontend because activity data is fetched only after each athlete authenticates. A private bucket alone is less useful for sharing; if you need private hosting, put Cloud CDN + HTTPS Load Balancer, Firebase Hosting, App Engine, or Cloud Run in front of the same static assets.

### Security and compliance checklist

- Register the exact production origin in Strava's API settings and use it as `VITE_STRAVA_REDIRECT_URI`.
- Keep Strava access to the authenticated user's own data only; do not display one athlete's Strava data to another person.
- Do not use Strava data for AI/ML training, RAG, embeddings, benchmarking, analytics aggregation, or an app-hosted MCP server. Strava's official MCP is for a subscriber's personal use and is not a replacement auth path for this public web app.
- Keep requests direct and scoped: this app needs recent activities, activity details, streams, and activity photos; it does not need club, segment-explore, write, upload, or webhook endpoints.
- Configure a Google Maps browser key restricted to Maps JavaScript API, Map Tiles / Photorealistic 3D, and Elevation API, with HTTP referrers for localhost and the production domain only.
- Add GCP budget alerts and quota alerts for Maps JavaScript, Map Tiles, and Elevation. Elevation is batched in the app, but broad sharing can still create billable traffic.
- Publish a privacy policy and a deletion contact before scaling beyond personal use.

### Environment variables

Static GCS build variables:

```dotenv
VITE_STRAVA_CLIENT_ID=YOUR_STRAVA_CLIENT_ID
VITE_STRAVA_REDIRECT_URI=https://YOUR_DOMAIN_OR_BUCKET_HOST/index.html
VITE_GMP_API_KEY=YOUR_RESTRICTED_GOOGLE_MAPS_BROWSER_KEY
# Optional compatibility switch. Use the Strava changelog's active host when the migration window opens.
VITE_STRAVA_API_BASE_URL=https://www.strava.com/api/v3
```

Static-only local development still supports `VITE_STRAVA_CLIENT_SECRET`, but do not use or publish a browser-exposed Strava client secret for a public deployment. Move it to Cloud Run as `STRAVA_CLIENT_SECRET` before inviting users outside a trusted test group.

### Deploy to a public GCS bucket

Authenticate the Google Cloud CLI first, then run from `strava-explorer/`:

```bash
export VITE_STRAVA_CLIENT_ID=12345
export VITE_STRAVA_REDIRECT_URI=https://storage.googleapis.com/YOUR_BUCKET/index.html
export VITE_GMP_API_KEY=YOUR_RESTRICTED_GOOGLE_MAPS_BROWSER_KEY
npm run deploy:gcs -- --project YOUR_GCP_PROJECT --bucket YOUR_GLOBALLY_UNIQUE_BUCKET --location US --public
```

The command builds the app, creates the bucket if needed, syncs `dist/`, configures static website metadata, sets long-lived cache headers on hashed assets, keeps `index.html` uncached, and grants public object read access when `--public` is used.

### When to choose Cloud Run or App Engine instead

Choose **Cloud Run** when you are ready to remove `VITE_STRAVA_CLIENT_SECRET` from the browser, support many athletes, add deletion workflows, or add a small backend-for-frontend. Cloud Run can also serve the static Vite assets, but the cheapest long-term design is usually Cloud CDN/GCS for assets plus a min-instances-zero Cloud Run broker for OAuth.

Choose **App Engine** only if you prefer its operational model. It is simple, but Cloud Run is generally more flexible for a small OAuth broker and avoids keeping frontend assets coupled to the backend runtime.

### Strava migration watchlist

- Before September 1, 2026, verify the app still avoids the deprecated Club Activities, Club Administrators, Club Members, and restricted Explore Segments endpoints.
- Before January 4, 2027 / June 1, 2027, test `VITE_STRAVA_API_BASE_URL` against Strava's new API host as it becomes available, then update production config without changing source code.
- Before scaling beyond 10 athletes, request or qualify for the appropriate Strava access tier in the API Settings Dashboard.

## Manual QA checklist

1. App loads with a valid Google Maps browser key and shows the 3D globe.
2. Strava connect redirects to the configured callback and returns to the app.
3. Activity filters fetch activities and the first activity auto-loads.
4. Route polyline, start/finish markers, elevation profile, and stats appear.
5. `Fit route`, `Fly start`, `Fly finish`, `Orbit 3D`, and `Follow Camera` all move the same selected route.
6. Photo markers open one popover at a time and do not expose access tokens in committed source.
7. Mobile layout avoids horizontal scrolling and keeps the map usable behind the bottom sheet.
8. With `prefers-reduced-motion: reduce`, camera shortcuts avoid long cinematic movement.

## Contributing

Keep changes small, app-scoped, and validated with the narrowest relevant command plus a production build when practical.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
