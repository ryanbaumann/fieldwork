# PR #259 execution plan

Prepared 2026-09-07 for a separate agent session with parallel subagents.

Complete the security and performance audit, fix confirmed problems, and improve
copy and UX across Fieldwork. Blogs and webpages must sound like Ryan: direct,
specific, grounded in his work, and easy to follow from beginning to end. Copy
consistency includes the quality of the narrative, not just matching names.

This document plans implementation. Adding it to the PR does not establish that
the audit, fixes, editorial review, or browser verification have been completed.

## Starting point and authorization

- PR: [#259](https://github.com/ryanbaumann/fieldwork/pull/259).
- Branch: `codex/audit-repository-for-security-and-performance`.
- Inspected implementation head: `ad6de52995cc07c286c05253529d8a2c104ce0db`,
  before the documentation commit containing this plan.
- Existing findings: [September audit](REPOSITORY_AUDIT_2026-09.md).
- Current work: install Clarity, save this plan, and include the plan in the PR.
- Next session: implement the plan when Ryan starts that session with this task.
  Do not infer permission to publish content, send messages, deploy, modify cloud
  resources, or merge the PR. Follow the execution session's explicit permission
  for committing and pushing implementation changes.

The original PR fixes common compression-negotiation cases. Its audit reports
11 production dependency vulnerabilities under Atlas's deck.gl tree and leaves
CSP, filesystem performance, and browser UX work open. Treat these as findings
to reproduce; refresh versions, counts, reachability, and test results.

Before editing, read `AGENTS.md`, nearest app instructions, package scripts, and
the relevant source. The PR branch contains newer code and instructions than
the local branch used for the initial planning inventory.

```bash
git status --short
gh pr view 259 --json headRefName,headRefOid,baseRefName,baseRefOid,files,statusCheckRollup
gh pr checkout 259
git pull --ff-only origin codex/audit-repository-for-security-and-performance
git rev-parse HEAD
git diff origin/main...HEAD --stat
```

Only check out and pull into a clean tree. If another session has added work,
preserve it and use an isolated worktree. Do not stash, reset, or overwrite it.
Refresh the base ref if necessary before using it in comparisons.

Inventory all `apps.json` entries, locked packages, runtimes, public and private
routes, browser entry points, and external integrations. Distinguish production
gateway behavior from per-app development servers. External hosted applications
are covered through checked-in integration code; their deployments are outside
this repository's edit scope.

## Skills and writing authority

Use the repository's `portfolio-writing`, `portfolio-content`,
`portfolio-review`, `portfolio-design`, and `frontend-responsive-design` skills
for their respective surfaces. Use `coding-agent-orchestrator` for delegation
and the worker, reviewer, and verifier skills for those assignments.

Clarity was installed for Codex with:

```bash
npx --yes skills add addyosmani/clarity --global --agent codex --skill clarity --yes
```

The installed skill is version `0.2.1` at
`/home/ryanbaumann_google_com/.agents/skills/clarity/SKILL.md` in the preparation
environment. It is a user-level installation, not a vendored repository
dependency. In another environment, inspect installed skills first and use the
command above if it is absent. Record the actual installed version before use.

Read Clarity's `SKILL.md` and the references for the assigned mode:

- Editors: `references/edit.md`.
- Blog and narrative editors: also `references/longform.md`.
- Webpage, UI, and documentation editors: also `references/medium.md`.
- Independent reviewers: `references/review.md`, using the editing reference
  to identify specific problems.

Ryan's explicit directions and established voice take precedence over generic
style preferences. Use Clarity to improve substance, development, and sentences
without replacing Ryan's perspective with a house voice. Keep useful procedural
structure in documentation and brief, accessible wording in interface text.

Read the repository Maps skill and retrieve its required live product guidance
before changing Maps APIs, loaders, controls, key documentation, or related CSP.
Use the Gemini skills when an actual change touches Gemini API behavior.

## Coordination and evidence

Use a root orchestrator and up to three concurrent workers. Begin with read-only
discovery so findings determine the patches.

| Owner | Discovery assignment | Return |
| --- | --- | --- |
| Security worker | Runtime boundaries, dependencies, browser data handling, CSP, build and CI | Prioritized findings, reachable paths, proposed regression cases |
| Performance worker | Compression, filesystem access, caching, bundles, images, repeated requests | Reproducible measurements and ranked opportunities |
| Copy and UX worker | Full content inventory, terminology, narrative quality, routes and interaction states | Per-page disposition and copy/UX findings |
| Root | Branch state, baseline checks, scope, shared files, finding register | Task graph and exact ownership |

After discovery, assign disjoint implementation ownership:

| Owner | Default write scope |
| --- | --- |
| Gateway worker | `gateway/`, including protocol, security, performance, and tests |
| Portfolio worker | Portfolio content, templates, styles, assets when necessary, and portfolio tests |
| Demo worker | Explicitly assigned demo source, UI, HTML, README files, and tests |
| Root | `apps.json`, package manifests/lockfiles, root scripts and documentation, audit report and logs |

One owner handles `gateway/lib/staticFiles.js`; do not let separate security and
performance writers race there. Transfer ownership before another worker edits
the same file. Coordinate portfolio CSP generation and gateway policy as one
integration change. If the editorial inventory is large, split it into batches
of disjoint pages as slots become available; review every page, not just samples.

Every worker packet names its objective, base state, file allowlist, no-touch
paths, acceptance criteria, tools/effects, verification commands, budget, output,
and stop conditions. Workers do not commit, push, deploy, recursively delegate,
or update shared instructions. The root owns integration and final judgment.

Keep one finding register with: ID, surface, evidence, severity or reader impact,
owner, proposed correction, verifier, and disposition. Use confirmed, fixed,
disproven, blocked, or explicitly deferred. A source observation is not a measured
failure, a mock is not live-provider evidence, and a worker report is not proof.

Follow the repository's limits: three implementation attempts per hypothesis,
two verifier-repair cycles, and at most three independent review rounds. Reframe
repeated failures rather than making wider speculative changes. Do not run
benchmarks alongside heavy builds. Schedule tests that write shared build output
sequentially or give them isolated output directories.

## Security work

### Dependencies

Discover package boundaries from manifests and lockfiles. For every locked
package, run `npm audit --omit=dev --audit-level=moderate`; inspect development
tool advisories separately. Record the command, date, graph, and advisory IDs.

For Atlas, trace `@deck.gl/geo-layers`, loaders, `image-size`, and `fflate` using
`npm explain` and `npm ls`. Check current primary advisories and upstream release
notes. Distinguish installed code, bundled code, and parsers reachable from
application inputs. Do not claim that an installed parser necessarily ships in
the production bundle without inspecting the build.

Prefer a compatible upstream resolution. Evaluate a targeted override only with
compatibility evidence. Do not run `npm audit fix --force`, use a breaking
downgrade to clear a scanner, or include unrelated dependency upgrades. Prepare
the exact candidate diff and tradeoff if a material dependency change needs a
decision under the session's authorization.

Verify Atlas changes with its type checks, tests, production build, and the
affected fleet/TripsLayer interaction. Re-run audits after lockfile changes and
report remaining exposure without hiding or downranking advisories.

### Gateway, browser, development, and build boundaries

Review private-app access, writer controls, OAuth state and redirects, cookies,
origin validation, rate limits, body limits, upstream allowlists, redirect
handling, timeouts, and error sanitization. Verify denied requests cannot bypass
authorization through assets, aliases, alternate methods, or caching.

Trace browser storage, URL parameters, HTML/Markdown sinks, model-generated
content, uploads, analytics payloads, and proxy requests. Check whether sensitive
data can appear in browser bundles, logs, error messages, or public metadata.
Inspect development proxies, Docker, CI, and artifact ingestion for differences
that invalidate production assumptions.

Use synthetic credentials and fixture data. Sanitize inherited environments and
inspect automatic `.env` loading before builds or tests. Redact scanner output;
never display credential values. Do not modify cloud permissions or secrets.

For each confirmed security defect, add allowed and denied behavior checks,
including the HTTP boundary where relevant. Keep the patch tied to the failure.

### Content Security Policy

Inventory the actual headers and consumers for portfolio pages, writer pages,
generated gateway pages, plain demos, Maps demos, and Strava. Identify inline
scripts, styles, event handlers, dynamic evaluation, and third-party requests.

Investigate build-generated script hashes for static portfolio pages before
adding per-request nonce substitution. Dynamic HTML needs a separately verified
strategy. Treat script and style allowances independently. Coordinate builder
output, response headers, caching, and any required asset metadata.

Test intended scripts and blocked injections. Preserve theme controls, forms,
configured comments, analytics privacy restrictions, and necessary SDK behavior.
Keep Maps exceptions scoped to the apps that require them. A browser network
failure is insufficient reason to expand an allowlist: inspect the violated
directive and reproduce with a control request first.

If a policy change cannot be completed safely within scope, return the concrete
remaining change and missing evidence. Do not describe the existing policy as
acceptable solely because the application currently loads.

## Compression and performance work

### Finish protocol correctness

Review `pickEncoding()` and both static-file and generated-body callers. The PR
parser leaves the coding token untrimmed after splitting parameters and uses
JavaScript's numeric conversion for quality values. Reproduce their consequences
before correcting them.

Add cases for quality rankings, ties, wildcard fallback, explicit exclusions,
legal whitespace such as `br ;q=0, *;q=1`, uppercase tokens, empty/missing headers,
unsupported codings, repeated entries, and malformed or out-of-range weights.
Cover explicit `identity` preferences/exclusions and the case where no available
representation is acceptable. Establish behavior from RFC 9110 rather than
guessing what a browser usually sends.

Exercise small-body thresholds and noncompressible responses. Verify parser
outputs and decoded HTTP bodies. Check `HEAD`, conditional requests, `Vary`
preservation, content lengths, stream failures, disconnects, and private caching.
Fix related behavior only when the evidence establishes a defect.

### Measure before optimizing

Synchronous filesystem metadata checks and synchronous compression for generated
responses are candidates for measurement, not proof of a significant bottleneck.
Use existing tools or a small Node-built-in harness with reproducible fixtures.

Record the commit, Node version, machine conditions, fixtures, compression
settings, warm-up, and at least three measured runs. Compare concurrency levels
such as 1, 10, and 50. Include HTML, JavaScript, JSON, images, missing routes, and
conditional requests under identity, Gzip, and Brotli.

Capture median/p95 latency, throughput, errors, CPU, memory, and event-loop delay.
Use identical conditions before and after changes, without competing builds or
model jobs. Preserve raw results and summarize observed variance.

Inspect frontend transfer size, initial bundle composition, image loading and
dimensions, layout shifts, repeated requests, and interaction cost. Choose the
smallest improvement supported by the measurements. Async metadata, caching,
precompression, and lazy loading are options, not required architecture changes.

Acceptance requires preserved behavior and improvement beyond run-to-run noise.
Retain the dependency-free gateway and portfolio. Preserve cache isolation,
authorization ordering, missing-file behavior, and useful failure states. Do not
turn a local benchmark into a claim about production capacity.

## Copy in Ryan's voice

### Establish the source and reader

Inventory all blogs, work stories, standalone pages, homepage/collection copy,
demo descriptions, titles, summaries, social metadata, UI text, and active docs.
Give each a disposition: keep, correct, restructure, or needs source evidence.
Preserve draft and scheduled-publication state throughout the work.

Read the writing skill's named examples, existing evidence ledger, and any
Ryan-authored calibration material that can actually be located. Separate
authored samples from generated training/evaluation material. Record which
samples calibrate voice and why; do not use a model-produced draft as the sole
standard for Ryan's voice.

Before editing a substantial page, write a short private note identifying its
reader, intended takeaway, strongest source material, and largest narrative
problem. Inventory factual claims, attribution, metrics, uncertainty, links, and
distinctive original language. These notes belong in review evidence, not in
published prose.

### Develop the whole piece

Run Clarity in rewrite mode alongside the portfolio writing skill. Work in this
order: truth, substance, development, sentences, then rhythm and warmth.

Each article needs one clear idea that the title and opening actually deliver.
Follow the relevant evidence, decision, or attempt far enough for a reader to
understand what happened and why it matters. Each paragraph should answer,
complicate, illustrate, or advance the previous one. If paragraphs can trade
places without changing the argument, inspect the missing connection.

Use Ryan's first-person perspective where the source supports it. Preserve his
specific judgments, contractions, earned humor, uncertainty, and details from
the work. Credit teams accurately. Do not invent scenes, memories, opinions,
metrics, citations, or causal links to make the prose more vivid.

Cut generic introductions, repeated explanations, vague importance claims,
marketing language, stock self-credit, fake questions, formulaic contrasts,
repeated three-part slogans, and paragraphs built around a final punchline.
Avoid em dashes under the portfolio voice rules. Do not replace those patterns
with uniformly short sentences, forced informality, or deliberate messiness.

Keep useful headings and examples, but remove report-like scaffolding when the
reader needs a story. Introduce code with the problem it addresses, then explain
what it shows. Let sentence length follow the thought. Preserve the strongest
original passages when they already work.

End on the last useful consequence, limitation, or specific invitation the piece
has earned. Do not append a recap or generic invitation to every article. If
source material is missing, report the precise gap in review notes; never put
unresolved editorial placeholders into a public page or polish an unsupported
claim into plausibility.

Webpages should make the reader's next action clear while retaining Ryan's
voice. UI text should name the action, state, and recovery path plainly. Active
documentation must remain precise and easy to scan; it does not need an essay's
narrative shape.

### Keep names and promises consistent

Confirm established names against the checked-out branch before replacements.
Preserve intentional differences between brand, short navigation label, product
name, route, and API term.

| Concept | Initial convention to validate |
| --- | --- |
| Site | Fieldwork, with configured header and byline variants |
| Essays | Field Notes; compact navigation may use Notes |
| App collection | Labs |
| Strava app | Strava 3D Explorer |
| Air quality app | Air Quality Map |
| Isochrones app | Meet in the Middle; retain `/isochrones/` and API terminology |
| Atlas | One full title and Atlas as the short label |
| Voice app | Voice & Editorial Studio; preserve unlisted visibility |

Compare `apps.json`, site configuration, cards, headings, HTML titles, social
metadata, alt text, README files, and current setup instructions. Recheck the
initial planning observations: Lab/Labs drift, the Isochrones README describing
an older workflow, unrestricted-key advice, and model/capability descriptions
that may disagree with executable configuration.

Audit copy about privacy, key lifetime, hosted allowances, model assistance,
evaluation results, and authorship against actual behavior and retained evidence.
These are claims, not branding choices. Do not strengthen them for a cleaner
sentence. Preserve historical logs, quotations, technical identifiers,
third-party attribution, and regression fixtures unless separately in scope.

### Independent editorial acceptance

Give a read-only reviewer the original text, revision, voice samples, and
evidence. Ask for passage-specific findings on factual fidelity, narrative
progression, authentic voice, rhythm, and generic language. The reviewer must
read the complete piece; finding banned words is insufficient.

Run `npm run check:content` before and after correction passes. Clarity's
`strip_markdown.py` and `prose_stats.py` can locate patterns after their source is
inspected, but their counts are diagnostic. Do not optimize for detector scores,
sentence-length targets, or a supposed guarantee of human authorship.

Use the prescribed local voice-review command when its runtime and model are
available. Inspect it before invocation, respect branch-local inference limits,
and do not download or train models merely to finish an editorial check. This
task authorizes no new training run. Record an unavailable local tool and retain
independent editorial review rather than claiming it ran.

One maker self-review and a focused correction pass precede independent review.
Use the repository's maximum of three review rounds; do not keep polishing until
every page has the same shape. Stop when factual meaning is preserved, each
piece develops naturally, copy fits its surface, and reviewers have no material
voice or narrative blockers. Escalate unresolved source or taste decisions.

## UX and rendered verification

Inventory all local routes from `apps.json`, including private and unlisted
applications. Exercise complete tasks and their recovery states.

| Surface | Minimum flow |
| --- | --- |
| Portfolio | Navigate, open an article, switch theme, follow a Lab link, recover from a missing route |
| Forms | Invalid input, pending submission, fixture success, provider failure, retry |
| Strava | Signed-out experience, connection boundary, activity selection, playback, disconnect |
| Air quality | Select a location, inspect conditions, recover from unavailable data |
| Meet in the Middle | Set origins, change travel options, inspect places, handle no overlap |
| Hairstyle | Select/validate an image, fixture generation, allowance and error states |
| Atlas | Enter a mission, clarify, inspect results, recover from provider failure |
| Voice Studio | Load fixtures, review/grade, exercise available dataset controls |
| Writer/private apps | Denied access, authenticated fixtures, publication boundaries |

Check widths of 320, 390, 768, and 1440 CSS pixels, applicable light/dark themes,
reduced motion, keyboard navigation, and zoom/reflow. Verify visible focus,
dialog dismissal and focus restoration, accessible names, announced status,
contrast, touch targets, long text, overflow, loading, empty, and error states.
Follow the repository's 44-pixel target guidance and relevant WCAG criteria.

For Maps apps, exercise bottom sheets, internal scrolling, safe areas, changing
viewport height, gesture conflicts, and unobscured controls. Screenshot the
affected interaction states, not just the initial screen. Reuse installed
Playwright dependencies; keep temporary evidence outside published assets unless
an asset replacement is itself required.

The initially inspected Atlas `scripts/uiux-audit.mjs` loads live Maps despite
mocking other services and gates execution on `ALLOW_LIVE_MAPS_BROWSER=1`.
Inspect the current file before use. Default to keyless/intercepted checks and
record what they cannot establish. Do not enable live providers, submit real
forms, send email, or activate publishing controls without the required exact
authorization. An opt-in environment flag is not permission by itself.

## Verification and integration

Capture baseline failures first. Workers run the nearest meaningful verifier
after each correction; the root runs the integrated checks after edits settle.
Confirm scripts against the actual branch before execution.

```bash
npm run check:labs
npm run check:content
npm run test:labs

npm --prefix gateway test
npm --prefix portfolio test

npm --prefix demos/strava-explorer test
npm --prefix demos/strava-explorer run lint
npm --prefix demos/aqi-map test
npm --prefix demos/isochrones test
npm --prefix demos/hairstyle-ai-studio run check
npm --prefix demos/real-world-reasoning-agent test
npm --prefix demos/voice-studio test

node scripts/build-local.mjs
node scripts/smoke.mjs
git diff --check
```

Discover additional packages on the refreshed branch and run their corresponding
checks. Use sanitized environments and local targets. Some test scripts build
their app; avoid redundant or concurrent writes. Re-run dependency audits after
lockfile changes, and verify the container when packaging/build behavior changes.
Do not use raw `node --test` in the gateway; its supported script sets test mode.

After integration, use fresh independent reviewers for:

1. Security, protocol correctness, dependencies, and performance evidence.
2. Copy, claims, Ryan's voice, and narrative across complete pieces.
3. Rendered UX, accessibility, links, canonical ownership, and social metadata.

Provide the raw diff, baseline/current evidence, and relevant assets without a
desired verdict. Correct material findings, rerun affected deterministic checks,
and request another read where needed. Reviewer agreement cannot substitute for
test, source, or browser evidence.

The root updates the existing audit report with finding IDs, measurements,
dispositions, and precise remaining exposure. Record user-visible corrections in
`CHANGELOG.md`. Add root-caused reusable lessons to `LEARNINGS.md` using its
Context/Learning/Evidence/Use next time format. Any proposed durable skill or
instruction changes need `skill-improvement-loop`, the deterministic gate,
behavioral evidence where required, and protected-path authorization. This
task-specific plan does not itself alter those instruction contracts.

## Done conditions and handoff

The implementation is ready only when every inventoried surface has an audit
disposition; confirmed in-scope defects are fixed or precisely blocked; fresh
dependency results and reproducible performance evidence exist; and revised
public prose has passed factual, voice, narrative, and rendered review.

Check metadata promises against page content, preserve canonical routes and
publication state, and verify the integrated tree. Include no unrelated changes,
accidental generated files, sensitive data, or unresolved public placeholders.

Return changed paths, exact commands and observed results, review and screenshot
locations, remaining risks, and the appropriate terminal state. Use
`SUCCESS_VERIFIED` only when the acceptance evidence exists;
`COMPLETE_NEEDS_VERIFICATION`, `PARTIAL_BLOCKED`, or `NEEDS_HUMAN` must identify the
specific gap. Do not call the repository secure because tests pass, or call the
copy ready because its lint output is clean.

## Sources for behavior decisions

- [HTTP encoding negotiation, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.3).
- [Content Security Policy, MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
- [WCAG quick reference, W3C](https://www.w3.org/WAI/WCAG22/quickref/).
- [Clarity source and installation](https://github.com/addyosmani/clarity).
- [Portfolio evidence ledger](PORTFOLIO_EVIDENCE_LEDGER.md).
