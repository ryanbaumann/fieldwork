# Repository security, performance, content, and usability audit

Date: 2026-09-09

## Scope and method

This audit covered the production gateway, portfolio and writer builds, all nine
manifest applications, the eight npm lockfiles, public and private route
boundaries, browser data handling, documentation, and every publishable
portfolio entry. Validation used a credential-free source snapshot with ignored
environment files excluded. External browser requests were aborted, and no
provider generation, email delivery, cloud change, deployment, or publication
was attempted.

The security pass traced authorization, OAuth, cookies, origins, request limits,
proxy allowlists, redirects, error handling, CSP, browser storage, and build
artifacts. The performance pass used a checked-in, Node-only static-server
benchmark with three measured runs for each fixture, encoding, and concurrency
level. The content pass inventoried 34 portfolio entries and used a separate
read-only review. Browser review exercised 144 route, viewport, color-scheme,
and reduced-motion combinations plus twelve primary interactions.

## Finding register

| ID | Impact | Owner | Finding | Disposition and verifier |
| --- | --- | --- | --- | --- |
| SEC-1 | High | Gateway | Writer sign-in treated the string `"false"` as a verified Google email and did not reject a missing/non-numeric expiry. | **Fixed.** Claims now require exact verified values, the configured audience and email, Google's issuer, and a safe unexpired integer timestamp. Allowed and denied token fixtures cover the boundary. |
| SEC-2 | Moderate | Gateway + portfolio | The default CSP allowed every inline script, weakening it as an injection backstop. | **Fixed.** The portfolio build emits exact per-page SHA-256 script hashes. The gateway validates and caches bounded manifests, applies hashes only to the resolved HTML file, and blocks inline scripts when metadata is missing or invalid. Browser checks confirmed intended theme code ran while an injected script and event handler were denied. |
| SEC-3 | Moderate | Root manifest | Infographic Agent used the Maps CSP solely for Google Fonts, granting Maps script origins, inline script, and evaluation privileges it did not need. | **Fixed.** A `google-fonts` profile grants only the font stylesheet and font origins. Manifest validation requires real Maps apps to select a Maps profile. |
| HTTP-1 | Moderate | Gateway | `Accept-Encoding` parsing mishandled legal whitespace, malformed weights, duplicates, wildcards, identity exclusions, and cases with no acceptable representation. | **Fixed.** Negotiation now follows RFC 9110 quality semantics, preserves `Vary`, returns 406 when required, and has decoded HTTP regression coverage for static and generated bodies. |
| HTTP-2 | Moderate | Gateway | Conditional and `HEAD` behavior could apply validators to non-200 responses, omit weak or wildcard ETag matches, and open streams for bodyless responses. Stream errors were not closed as one pipeline. | **Fixed.** Validators are method/status scoped, weak and wildcard matches work, `HEAD` emits headers without file/compression streams, and streaming uses `pipeline`. |
| DEP-1 | Moderate | Root dependencies | Atlas resolved vulnerable `fflate` 0.7.4 through loaders.gl. | **Fixed.** A narrow transitive override resolves 0.7.5. Type checks, 579 unit tests, source checks, and the production build pass. |
| DEP-2 | High scanner rating; low current reachability | Root dependencies | Atlas retains eight high-severity audit entries leading to `image-size` advisories GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq. The registry reports no patched `image-size` release. | **Explicitly deferred.** The path is `@deck.gl/geo-layers` / loaders.gl texture tooling. The current app builds trip records in application code and does not accept user image archives for this parser. Keep monitoring upstream; do not force a breaking deck.gl downgrade merely to clear the scanner. |
| PERF-1 | Low | Gateway | Static serving performs synchronous metadata operations on each request. | **Measured and deferred.** The host was noisy and GET throughput ranges overlapped broadly, so the benchmark does not support an async-filesystem rewrite. The retained harness establishes a repeatable baseline. |
| PERF-2 | Low | Gateway | `HEAD` traversed file and compression streams even though no body is sent. | **Fixed and measured.** At concurrency 50, median CPU per request fell from 451 to 231 microseconds for identity, 1,719 to 537 for gzip, and 1,432 to 579 for Brotli. Throughput ranges still overlapped, so this is a CPU-path result rather than a production-capacity claim. |
| PERF-3 | Low | Atlas | Atlas's largest production chunk is substantial. | **Measured and deferred.** The current build reports 607.76 kB raw / 175.07 kB gzip for the deck chunk. No split was made without interaction and transfer evidence showing a user-visible gain. |
| CONTENT-1 | Moderate reader impact | Portfolio + demos | Several page and demo descriptions disagreed with implemented behavior: Voice Studio implied live model operation, Atlas overstated verified conclusions, and contact/privacy copy omitted message screening. | **Fixed.** Voice Studio now labels fixtures and simple replacements accurately, Atlas distinguishes tool traces from conclusions, and contact/privacy copy describes screening. Essay edits proposed during the audit were removed at owner review. |
| UX-1 | Moderate | Demo UI | Infographic Agent and Voice Studio overflowed at 320 px; common controls were below the 44 px target. | **Fixed.** Mobile headers/tabs now fit the viewport, controls meet the target, and reduced-motion rules cover their animations. |
| UX-2 | Moderate | Demo UI | Infographic Agent's API-key dialog left focus behind the modal and ignored Escape; Hairstyle AI did not reliably restore trigger focus. | **Fixed.** Both dialogs move focus, contain Tab navigation, dismiss from the keyboard, and restore the prior control. |

## Dependency results

Fresh `npm audit --omit=dev --audit-level=moderate` runs covered every lockfile:
portfolio, AQI Map, Hairstyle AI Studio, Infographic Agent, Isochrones, Atlas,
Strava Explorer, and Voice Studio. Seven production trees report zero known
vulnerabilities. Atlas reports eight high entries, all in the single unresolved
`image-size` chain described in DEP-2. A separate full audit of Strava Explorer
reports zero after its lockfile moved `brace-expansion` from 5.0.7 to 5.0.9.

The dependency count fell from eleven production findings (eight high, three
moderate) to eight high. This report preserves the remaining scanner severity
while separately recording present application reachability.

## Performance evidence

`gateway/scripts/benchmark-static.mjs` records Node and machine details,
fixtures, warm-up, three runs, concurrency 1/10/50, identity/Gzip/Brotli,
latency, throughput, CPU, memory, event-loop delay, and errors. The baseline ran
42,549 requests and the current implementation 27,589, with zero request errors.
The two-core shared host had load averages between roughly 3 and 6 during these
runs. Most GET throughput intervals overlap; fifteen of 57 comparable GET rows
were lower in the current run. That variance prevents a general speed claim and
is why synchronous metadata remains unchanged. The non-overlapping CPU
improvement for the bodyless `HEAD` path supports PERF-2.

## Browser and editorial evidence

The browser matrix covered 320, 390, 768, and 1440 px layouts in light and dark
schemes with reduced-motion variants. It exercised public routes, the denied and
synthetically authenticated writer states, contact intent selection and theme
persistence, Voice fixture controls and export, CSP allow/deny behavior, map
control shells, and API-key dialogs. Live Maps/WebGL and external provider
responses remain outside this credential-free pass.

## Content disposition

Every content entry was read in full. `Keep` means this pass found no warranted
edit within available evidence; it is not a new verification of every unchanged
external claim. Draft and scheduled states, canonicals, aliases, and slugs were
preserved.

| Entry | Disposition |
| --- | --- |
| `pages/about.md` | Keep. |
| `pages/contact-success.md` | Keep. |
| `pages/contact.md` | Keep prose; correct the renderer so its context appears. |
| `pages/privacy.md` | Correct product and collection names. |
| `pages/resume.md` | Keep. |
| `pages/subscribed.md` | Correct the delivery-frequency promise. |
| `talks/agent-skills-video.md` | Correct repetitive generic copy. |
| `talks/code-assist-video.md` | Correct unsupported extrapolation. |
| `talks/geomob-vibing-with-maps.md` | Keep. |
| `talks/visgl-vibe-your-viz.md` | Keep. |
| `work/agent-skills.md` | Keep. |
| `work/agentic-evals.md` | Keep. |
| `work/agentic-growth.md` | Keep. |
| `work/code-assist.md` | Keep. |
| `work/geo-architecture-center.md` | Keep. |
| `work/intelligent-product-essentials.md` | Keep. |
| `work/mapbox-boundaries-atlas.md` | Keep. |
| `work/mapbox-oss-datascience.md` | Keep. |
| `work/mapbox-uber-deckgl.md` | Keep. |
| `work/trails-ninja.md` | Keep. |
| `work/voice-of-developer.md` | Keep. |
| `writing/ai-saves-the-hour.md` | Needs source evidence; keep the draft unchanged. |
| `writing/builder-platforms-grow-by-owning-the-agent-loop.md` | Keep unchanged; proposed edits removed at owner review. |
| `writing/can-i-build-an-ai-agent-that-doesnt-write-slop.md` | Keep unchanged; proposed edits removed at owner review. |
| `writing/code-assist-launch.md` | Keep the external draft unchanged. |
| `writing/devex-is-a-growth-discipline.md` | Keep unchanged; proposed edits removed at owner review. |
| `writing/evals-turn-ai-developer-experience-into-an-operating-system.md` | Needs source evidence; keep the draft unchanged. |
| `writing/fine-tuning-was-the-easy-part.md` | Keep unchanged; proposed edits and replacement visuals removed at owner review. |
| `writing/loop-engineering-coding-agent.md` | Keep unchanged; proposed edits removed at owner review. |
| `writing/the-model-that-picks-your-platform-doesnt-write-the-code.md` | Keep. |
| `writing/the-next-platform-interface-is-an-agent-session.md` | Keep the draft unchanged. |
| `writing/this-weeks-learnings.md` | Keep the external draft unchanged. |
| `writing/using-geojson-bigquery.md` | Keep unchanged; proposed edits removed at owner review. |
| `writing/vibing-with-maps.md` | Keep the external entry unchanged. |

## Residual risk and next checks

1. Monitor loaders.gl/deck.gl for a patched `image-size` chain, then remove the
   override or update upstream with the Atlas fleet interaction and build as the
   acceptance boundary.
2. Repeat the static benchmark on an idle or dedicated host before using its GET
   results to justify filesystem or caching architecture changes.
3. Exercise live Maps, WebGL, Gemini generation, and email delivery in an
   authorized environment with synthetic accounts and restricted keys.

The implementation procedure and original acceptance criteria remain in the
[PR #259 execution plan](PR_259_EXECUTION_PLAN.md).
