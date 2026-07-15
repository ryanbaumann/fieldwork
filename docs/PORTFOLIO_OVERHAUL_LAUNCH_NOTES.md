# Portfolio overhaul launch notes

The checked-out repository implements the workstreams in
`docs/PORTFOLIO_OVERHAUL_PLAN.md`: Ryan-first branding, generic agent
workflows, validated flat-file publishing, discovery metadata and feeds,
responsive portfolio layouts, manifest-driven demo privacy, provider and
rate-limit policy, Strava photo proxying, and hardened CI/deploy checks.

## Verification completed on 2026-07-13

- `cd portfolio && npm test`: 9 regression tests passed; 19 generated pages passed metadata validation.
- `cd gateway && npm test`: 60 tests passed.
- `cd strava-explorer && npm run lint && npm test && npm run build`: lint passed, 32 tests passed, production build passed.
- `cd aqi-map && npm run build`: passed.
- `npm run build && npm run smoke`: all four apps built and staged; 17 gateway smoke checks passed.
- `BASE_URL=http://127.0.0.1:8098 node scripts/smoke-production.mjs`: 9 production-shape checks passed against the staged local gateway.
- Manual browser QA captured temporary screenshots for `/`, `/contact/`, and `/resume/` at 375, 768, and 1440 CSS pixels. The files lived under `/tmp/portfolio-qa-*` for in-session review and are intentionally not tracked as site assets. The pages had no observed horizontal overflow or broken media; light/dark, focus, and reduced-motion behavior remain CSS-driven.

## Runtime configuration

Keep browser-public configuration in restricted `VITE_*` build variables.
Keep `STRAVA_CLIENT_SECRET`, `GMP_SERVER_API_KEY`, `RESEND_API_KEY`, private
demo password variables, and `CONTACT_TO_EMAIL` in Cloud Run/Secret Manager.
`STRAVA_CLIENT_ID` and optional `CONTACT_FROM_EMAIL` are non-secret runtime
configuration. `gateway/lib/config.js` is the server-only provider registry.

## Launch follow-ups outside this repository

- Run `BASE_URL=https://www.ryanbaumann-portfolio.com node scripts/smoke-production.mjs` after the new Cloud Run revision receives traffic.
- Verify DNS, TLS, Search Console, sitemap/feed discovery, and the canonical host.
- Add the canonical domain to Strava OAuth redirect configuration.
- Restrict Maps browser keys to the production host and local origins; keep the server key API-restricted and out of browser bundles.
- Configure the Resend sender/domain and Cloud Run contact secrets before treating the contact form as live.
- Add private-demo password secrets only when a private manifest entry is introduced; rotating the value revokes existing signed cookies.
