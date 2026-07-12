# Learnings

## 2026-07-11 — Vite environment variables overriding dynamic behavior

Context: We were trying to configure the Strava OAuth app to use a dynamic redirect URI `new URL(..., window.location.origin).href` so that it would work seamlessly on both `localhost:8080` and the production domain `ryanbaumann-portfolio.com`.
Learning: Vite bakes environment variables starting with `VITE_` into the static bundle at build time. Legacy files like `.env.production` or `.env.development` inside the frontend subdirectories (e.g. `strava-explorer/`) that contain hardcoded values (like `VITE_STRAVA_REDIRECT_URI=http://localhost:5173/`) will silently override dynamic JavaScript logic and break the app in unexpected environments.
Evidence: The Strava OAuth flow failed because the `redirect_uri` in the browser URL was hardcoded to `http://localhost:5173/` or `https://YOUR_PRODUCTION_DOMAIN/` instead of detecting the actual origin.
Use next time: When centralizing secrets to a root `.env` or gateway, proactively search for and remove legacy frontend `.env` files in subdirectories that might inject stale values at build time.

## 2026-07-12 — Local `.env` files cause false positives in keyless CI smoke tests

Context: A post-build `secret-leak scan` designed for CI was failing locally. It correctly identified `AIza...` inside the built `isochrones/dist` JavaScript bundle.
Learning: Vite inlines `VITE_` variables into static bundles. While a CI pipeline runs without an `.env` file (resulting in a keyless build that passes the secret scan), running `npm run build` locally picks up any unversioned `.env` files containing real API keys and embeds them into the bundle.
Evidence: The `smoke.mjs` script threw an error `Error: Google API key (AIza...) in apps/isochrones/assets/index-BdY-bDij.js` when run locally, because `isochrones/.env` was present in the working tree.
Use next time: If a CI-focused secret scanner fails when running locally, check if local unversioned `.env` files are being picked up by the build process and baked into the output. Remove or rename them temporarily to test the keyless build behavior.
