# Repository security, performance, and usability audit

Date: 2026-09-06

## Scope and method

This pass reviewed the zero-dependency gateway, the portfolio build, all demo
package manifests, browser-side trust boundaries, and existing automated test
coverage. It ran the gateway and root test suites, content validation, and
production-dependency audits for every package with a lockfile. This is a
source and automated-controls audit, not a penetration test or a production
load test.

## Findings

### Moderate: compression negotiation could send a forbidden encoding - fixed

The gateway selected Brotli whenever the `br` token appeared, including
`br;q=0`, and ignored client quality rankings. That could make responses
unreadable to a conforming client or intermediary and waste CPU choosing a
less-preferred codec. The gateway now parses quality values and wildcards,
honors explicit exclusions, prefers the client's higher-quality supported
encoding, and uses Brotli only to break ties. Unit and live-server regression
coverage were added.

### Moderate: vulnerable transitive parsers remain in Atlas - follow-up

`npm audit --omit=dev --audit-level=moderate` reports 11 vulnerabilities (8
high, 3 moderate) below `@deck.gl/geo-layers`: denial-of-service advisories in
`image-size` and `fflate`. Atlas imports `TripsLayer` from that package, but the
audited interaction builds trip data in application code rather than accepting
user-supplied ZIP64, ICNS, JXL, or HEIF files. That reduces current
exploitability; it does not remove the vulnerable code from the dependency
graph or bundle.

The registry's proposed automatic fix downgrades `@deck.gl/geo-layers` from
9.3.11 to 9.0.6 and is therefore a breaking change. Do not apply
`npm audit fix --force` blindly. Track an upstream `loaders.gl` resolution or
test a coordinated deck.gl override/update, including the fleet animation and
production build, before merging a dependency change.

### Low: synchronous static-file metadata checks remain - accepted for now

Every static request uses synchronous existence and stat calls. This blocks the
Node event loop briefly and can reduce throughput under high concurrency. The
container is deliberately a small, single-instance portfolio gateway serving
local immutable build artifacts, so conversion to asynchronous filesystem APIs
is lower priority than keeping the request path simple. Revisit if load data
shows event-loop delay or if the deployment scales beyond its current traffic
profile.

### Low: Content Security Policy still permits inline script and style - known

The default and Maps policies allow inline script and style; Maps additionally
requires dynamic evaluation. This weakens CSP as an XSS backstop, especially
for Strava Explorer because it persists OAuth tokens in browser storage. The
policy is scoped per app and restricts objects, framing, and network origins,
which limits exposure. Removing inline allowances requires nonce or hash
plumbing between the portfolio builder and gateway, so it should be handled as
a dedicated architecture change rather than a broad audit edit.

## Controls that held

- Gateway tests cover path traversal, CSP selection, private-app authorization,
  origin validation, rate limits, request-size ceilings, proxy allowlists,
  redirect bounds, key handling, and upstream error sanitization.
- Public, unlisted, and private application visibility is validated and enforced
  before static files are served.
- Secret-bearing calls use same-origin gateway routes and server-side
  environment variables; malformed caller keys do not silently fall back to
  hosted credentials.
- All other audited production dependency trees reported zero known
  vulnerabilities, and content validation reported no errors or warnings.

## Recommended next actions

1. Resolve the Atlas transitive advisories through a tested upstream upgrade or
   override; confirm the vulnerable parsers are absent with `npm ls` and
   `npm audit`.
2. Benchmark gateway event-loop delay before replacing synchronous static-file
   metadata access; optimize from measurements rather than assumption.
3. Plan nonce/hash-based portfolio scripts separately, then tighten the default
   CSP before addressing Maps' SDK-required policy exceptions.
4. Add browser accessibility and responsive-layout checks to a future audit;
   this pass verified code and automated behavior but did not claim manual
   assistive-technology coverage.
