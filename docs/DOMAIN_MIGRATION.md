# Domain migration to ryanbaumann.dev

`https://ryanbaumann.dev/` is the only canonical public origin. Keep
`ryanbaumann-portfolio.com` mapped to the same Cloud Run service during the
migration; the gateway permanently redirects its pages, and
`www.ryanbaumann.dev`, to the matching path on the apex `.dev` domain.

As checked on July 17, 2026, the new apex and www names still serve
Squarespace, while the old domain resolves through Google's hosting records.
The DNS cutover below replaces only the new domain's Squarespace web records.

## 1. Keep the canonical-domain change ready, but do not merge it yet

The deploy workflow's final smoke test targets `ryanbaumann.dev`, so the new
domain must reach the existing Cloud Run service before this change merges.
Keep the domain-change PR ready while completing steps 2 through 6. The brief
overlap is safe because the currently deployed site still identifies the old
domain as canonical until the cutover deploy.

## 2. Confirm how the old domain reaches Cloud Run

Set the project and region used by the deploy workflow, then inspect existing
domain mappings:

```bash
GCP_PROJECT_ID="geojson-bq-blog"
GCP_REGION="us-west1"

gcloud beta run domain-mappings list \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION"
```

These are the repository's configured deployment values. Do not substitute a
different project and do not rely on the active local gcloud default. In
particular, this repository must never use `gmp-demos-ryanbaumann`.

If the old domain appears, continue with Cloud Run domain mappings below. If
it does not, the domain is probably fronted by a load balancer, Firebase
Hosting, or a registrar forwarding service. Add `ryanbaumann.dev` to that same
front end instead of creating a second routing layer.

Google's current Cloud Run options and domain-mapping limitations are in
[Mapping custom domains](https://docs.cloud.google.com/run/docs/mapping-custom-domains).
Direct Cloud Run domain mapping is still a Preview feature and Google's
documentation recommends a global external Application Load Balancer for a
production-grade front end. The existing portfolio already uses direct domain
mappings in supported `us-west1`; these steps preserve that architecture for
the one-year redirect window. Move both old and new hosts together if the site
later adopts the recommended load balancer, so redirects and TLS remain
consistent.

## 3. Verify the new domain in the deployment project

```bash
gcloud domains list-user-verified
gcloud domains verify ryanbaumann.dev
```

The second command opens Google Search Console if verification is needed.
Complete the DNS TXT verification with the same Google account that manages
the Cloud project.

## 4. Map the apex and www names to the existing service

Do not deploy another Cloud Run service. Map both names to `trails-ninja`:

```bash
gcloud beta run domain-mappings create \
  --service trails-ninja \
  --domain ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION"

gcloud beta run domain-mappings create \
  --service trails-ninja \
  --domain www.ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION"
```

The www mapping exists only so requests can reach the gateway and receive its
permanent redirect to the apex domain.

## 5. Copy the returned DNS records into the registrar

Retrieve the required records rather than guessing their values:

```bash
gcloud beta run domain-mappings describe \
  --domain ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --format='yaml(status.resourceRecords)'

gcloud beta run domain-mappings describe \
  --domain www.ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --format='yaml(status.resourceRecords)'
```

The current domain is managed through Squarespace. Open **Domains**, select
`ryanbaumann.dev`, open **DNS settings**, and edit the custom records. Then:

1. Remove the four Squarespace A records for `@` (`198.185.159.144`,
   `198.185.159.145`, `198.49.23.144`, and `198.49.23.145`) and the Squarespace
   `www` CNAME. These currently send the domain to the Squarespace site.
2. Add every A, AAAA, or CNAME record returned by Cloud Run exactly as shown.
3. Do not remove MX, email-verification, or unrelated TXT records.
4. Save each record. Squarespace custom records use a four-hour TTL by
   default; propagation can take longer.

Squarespace's current DNS editor instructions are in
[Edit your domain's DNS records](https://support.squarespace.com/hc/en-us/articles/360002101888-Adding-DNS-records-to-your-domain).

Because `.dev` is HTTPS-only in modern browsers, wait for the managed
certificate before treating the domain as live.

## 6. Wait for DNS and certificate readiness

```bash
gcloud beta run domain-mappings describe \
  --domain ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --format='yaml(status.conditions,status.resourceRecords)'

gcloud beta run domain-mappings describe \
  --domain www.ryanbaumann.dev \
  --project "$GCP_PROJECT_ID" \
  --region "$GCP_REGION" \
  --format='yaml(status.conditions,status.resourceRecords)'
```

Wait until both mappings report ready and their managed certificates are
valid, then confirm the apex and `www` reach the currently deployed portfolio:

```bash
curl --fail --silent --show-error --head https://ryanbaumann.dev/
curl --fail --silent --show-error --head https://www.ryanbaumann.dev/
```

At this point the response should be `200`; its HTML can still contain the old
canonical until the next step.

## 7. Merge and deploy the canonical-domain change

Merge the domain-change PR or run **Actions > Deploy to Cloud Run** from
`main`. The deployment must now emit `ryanbaumann.dev` in canonical tags, Open
Graph URLs, RSS, sitemap, Lab metadata, analytics host gating, and newly
generated Field Note URLs. The workflow's production smoke test should pass
against the new domain.

Then verify the canonical and redirects:

```bash
curl --fail --silent --show-error --head https://ryanbaumann.dev/
curl --silent --show-error --head https://www.ryanbaumann.dev/writing/
curl --silent --show-error --head 'https://www.ryanbaumann-portfolio.com/writing/?utm_source=legacy'
```

Expected results:

- `ryanbaumann.dev` returns `200`.
- www and both old-domain variants return `308` with a `Location` on
  `https://ryanbaumann.dev` that preserves the path and query string.
- the new homepage canonical, sitemap, and RSS URLs use `ryanbaumann.dev`.

## 8. Keep the old domain mapped for at least one year

Do not replace the old domain with a registrar-only homepage forward. Keep its
apex and www DNS records mapped to this Cloud Run service so every old deep
link receives a path-preserving permanent redirect. Keep the registration and
TLS mapping for at least one year.

Google recommends putting permanent redirects in place before using Search
Console's Change of Address tool, maintaining them for at least 180 days, and
retaining the old registration for at least a year. See
[Change of Address](https://support.google.com/webmasters/answer/9370220).

## 9. Update dependent services

1. **Google Maps browser keys:** add `https://ryanbaumann.dev/*` to website
   restrictions. Keep the old referrers temporarily, then remove them after
   traffic has migrated.
2. **Strava:** set the application's authorization callback domain to
   `ryanbaumann.dev`. The app derives its redirect URI from the current site
   origin. Strava requires it to fall within the configured callback domain.
3. **Google writer OAuth:** set the Cloud Run `WRITER_PUBLIC_ORIGIN` variable
   to `https://ryanbaumann.dev`, add
   `https://ryanbaumann.dev/auth/google/callback` to the OAuth client's
   authorized redirect URIs, and complete a full writer login. The session
   cookie is host-only, so leaving the old origin configured causes a login
   loop after the legacy-domain redirect.
4. **Google Analytics:** change the web stream URL to
   `https://ryanbaumann.dev` without creating a new stream, so historical data
   stays together.
5. **Search Console:** verify Domain properties for the old and new domains,
   submit `https://ryanbaumann.dev/sitemap.xml`, then run Change of Address
   from each old-domain property after redirects are live.
6. **Resend:** if `CONTACT_FROM_EMAIL` uses either portfolio domain, verify
   `ryanbaumann.dev` in Resend and update the sender before eventually removing
   any old-domain email-verification records. Keep the old domain's web mappings
   for the full redirect year, and preserve required SPF, DKIM, and verification
   records while the old sender remains in use.
7. **Profiles and publishing tools:** update LinkedIn, X, Substack, GitHub,
   speaker bios, and saved syndication templates to use `ryanbaumann.dev`.

## 10. Final production check

```bash
BASE_URL=https://ryanbaumann.dev node scripts/smoke-production.mjs
```

Also complete one Strava authorization flow, one Field Notes subscription,
and one contact-form submission from the new origin.
