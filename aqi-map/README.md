# AQI Map Hyperlocal

A small browser-based AQI map that visualizes PurpleAir sensor readings with Mapbox GL JS, Turf, and D3 tricontours.

## Current architecture

- `index.js` is the CommonJS Browserify entry point.
- `index.html` provides the map container, sidebar, external Mapbox styles, and bundled script tag.
- `npm run build` copies `index.html` into `build/` and writes `build/bundle.js`.
- `npm start` runs the Budo dev server.

## Agent-native workflow

Before changing this app, read:

1. `AGENTS.md`
2. `package.json`
3. `index.html`
4. `index.js`

Keep app-specific dependencies and commands inside this directory. Prefer small, focused changes that preserve the existing Browserify pipeline unless the task is explicitly a build-system or Google Maps Platform migration.

## Credentials and data sources

This app depends on browser-accessible mapping and environmental data credentials. Do not add new hard-coded API keys or sensor tokens. Future credential cleanup should move configurable values to documented environment variables or a backend/proxy pattern when a provider token should not be exposed in browser bundles.

If migrating to Google Maps Platform, document:

- Enabled APIs, such as Maps JavaScript API, Places API, Air Quality API, Pollen API, Solar API, or Weather API.
- Browser key restrictions by HTTP referrer, including local development origins.
- API-specific quotas/billing and cache/debounce behavior.
- Attribution and source-label requirements for environmental data.

## Useful commands

```sh
npm run build
npm start
```
