# Learnings

## 2026-07-12: AEO works best when the page and schema say the same thing

Context: A repo-wide copy pass needed to improve search and answer-engine clarity without adding vague keyword stuffing.
Learning: For a personal portfolio, the strongest answer-engine optimization is a tight visible summary plus matching structured data. The homepage should say who Ryan is, what he works on, and what proof exists; JSON-LD should reinforce that same claim with `ProfilePage`, `Person`, and concrete `knowsAbout` topics.
Evidence: Today's pass added visible proof points in `site.json` and rendered them on the homepage, then aligned `ProfilePage` and `Person` JSON-LD around the same answer-engine summary instead of adding hidden claims.
Use next time: Do not hide AEO in metadata only. Put the answer on the page first, keep it verifiable, then mirror it in schema.

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

## 2026-07-12: CI "slowness" was actually a hang

Context: CI felt way too slow, and 10 stuck runs had piled up. The build-and-smoke job ran raw `node --test` in `gateway/`, which imports `server.js` without `NODE_ENV=test`.
Learning: `server.listen()` ran during the test import, so the process never exited; every run hung until GitHub's 6-hour job timeout. Every other job finished in under a minute.
Evidence: 10 stuck workflow runs, each alive for hours, while non-gateway jobs consistently finished in under a minute.
Use next time: When CI is reported as "slow," read per-job step timings first. A hang looks like slowness from the outside. Use `npm test` (sets `NODE_ENV=test`), guard `listen()` on `NODE_TEST_CONTEXT`, and give every job a timeout plus cancel-in-progress concurrency.

## 2026-07-12: Skills only work if they're read before changing the surface

Context: A previous UI pass added a Google Fonts import, 3D tilt card hovers, gradient hero text, and scroll-reveal animations.
Learning: All four violated the documented design system in `.agents/skills/portfolio-design/SKILL.md` (system fonts, hover = accent border + 2px lift, novelty budget on writing, not chrome). Nobody read the skill before touching `style.css`.
Evidence: Today's refresh pulled the CSS back to match the skill; the webfont import, tilt hovers, gradient text, and scroll reveals are gone.
Use next time: Read the governing skill before changing a surface it covers. If a deviation is wanted, update the skill deliberately in the same PR instead of drifting from it.

## 2026-07-12: The remote proxy blocks fetching external images

Context: The remote agent environment's network proxy blocks fetching external assets; YouTube thumbnails and screenshots of external sites returned 403 CONNECT denials.
Learning: There's no way to fetch an honest external screenshot in this environment when one doesn't already exist in the repo, so the fallback has to be something built from real facts, not a fabricated mockup.
Evidence: Direct fetches for external thumbnails and site screenshots failed with 403 CONNECT denials from the proxy.
Use next time: Use a real screenshot or preview shot where one exists. Where none exists, generate an SVG artifact card (`scripts/artifact-cards.mjs`) that states only facts already in the entry copy (real commands, real published stats). Never mock a product UI or fabricate a screenshot.

## 2026-07-12: Missing height: auto in CSS causes aspect ratio distortion when HTML dimensions do not match the physical image

Context: The front page hero image was rendering distorted (squished) because the HTML template had hardcoded `width="960" height="600"` (16:10 aspect ratio), while the physical image was actually `1200x687` (~16:9 aspect ratio). Additionally, CSS styled the width to `min(100%, 34rem)` but did not specify `height: auto;`.
Learning: Without `height: auto;` in CSS, modern browsers fall back to the aspect ratio inferred from the HTML `width` and `height` attributes (default browser stylesheets assign `aspect-ratio: attr(width) / attr(height)`). If these attributes do not match the actual physical image's aspect ratio, the image stretches/squishes. Furthermore, omitting `width` and `height` attributes on other images (like `.article-hero` on detail pages) causes Cumulative Layout Shift (CLS) when pages load.
Evidence: Changing the HTML attributes of `.hero-image` to `width="1200" height="687"` and adding `height: auto;` in CSS resolved the distortion. Adding a zero-dependency image dimension parser helper `getImageDimensions` in `build.mjs` to automatically extract dimensions from SVG and JPEG files at build time and inject them as HTML `width`/`height` attributes resolved CLS across all detail/standalone pages.
Use next time: Always specify `height: auto` on responsive images in CSS, ensure HTML dimension attributes match the actual physical image size, and dynamically parse/inject image dimensions at build time for dynamic content images.

## 2026-07-12: Stale repository filters in deploy workflows cause silent workflow skips

Context: Cloud Run deployments on merges to `main` were silently skipping because `.github/workflows/deploy.yml` had a conditional constraint `if: github.repository == 'ryanbaumann/trails.ninja'`.
Learning: When a repository is moved or renamed, GitHub Actions workflows that filter jobs by `github.repository` must have their hardcoded values updated to the new repository slug. Otherwise, the jobs will evaluate to `false` and skip silently on push/PR triggers.
Evidence: Changing the condition to `if: github.repository == 'ryanbaumann/Portfolio' || github.repository == 'ryanbaumann/portfolio'` allowed the deployment workflow to execute.
Use next time: Always check and update workflow files for stale `github.repository` checks when renaming, moving, or cloning a repository.

## 2026-07-12: Stale Workload Identity Federation attribute conditions block CI deployments

Context: After fixing the workflow skip condition, the `google-github-actions/auth` step failed with an `unauthorized_client` error stating "The given credential is rejected by the attribute condition."
Learning: Google Cloud Workload Identity Federation (WIF) providers validate inbound OIDC tokens against an attribute condition. If the GitHub repository is renamed, the `assertion.repository` claim changes, causing the token to be rejected if the WIF provider condition still strictly expects the old repository name.
Evidence: The WIF provider `github-actions-provider` had the condition `assertion.repository == 'ryanbaumann/trails.ninja'`. Updating it via `gcloud iam workload-identity-pools providers update-oidc` to match `ryanbaumann/Portfolio` resolved the auth failure.
Use next time: When renaming a repository that uses GCP Workload Identity Federation, remember to update the provider's attribute condition in the Google Cloud Console or via `gcloud`, in addition to updating the workflow files.

## 2026-07-12: Stale Workload Identity Federation IAM bindings block CI impersonation

Context: After fixing the WIF attribute condition, the GitHub Actions token was accepted, but the subsequent `gcloud builds submit` step failed with `Permission 'iam.serviceAccounts.getAccessToken' denied on resource`.
Learning: In Google Cloud Workload Identity Federation, authenticating as a WIF principal is only half the battle. That principal must also have the `roles/iam.workloadIdentityUser` role bound on the Service Account it needs to impersonate. If the repository is renamed, the mapped principal (e.g., `principalSet://.../attribute.repository/NEW_REPO`) changes, and the old IAM binding on the service account will no longer grant access.
Evidence: The service account `github-actions-deployer` only allowed impersonation from `attribute.repository/ryanbaumann/trails.ninja`. Adding a new IAM policy binding for `attribute.repository/ryanbaumann/Portfolio` via `gcloud iam service-accounts add-iam-policy-binding` restored the GitHub Action's ability to impersonate the service account.
Use next time: When renaming a repository that uses GCP WIF with Service Account Impersonation, you must update BOTH the WIF provider's attribute condition AND the Service Account's IAM policy bindings to allow the new mapped principal.
