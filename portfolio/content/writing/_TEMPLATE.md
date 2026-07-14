---
title: A thesis, not a topic
summary: One sentence that states the claim and why it matters.
date: 2026-01-15
updated: 2026-01-15
canonical: https://www.ryanbaumann-portfolio.com/writing/post-title/
image: /img/writing/post-title.jpg
imageAlt: A specific description of the evidence shown in the article image
socialImage: /social/post-title.png
shareTitle: A concise title for social previews
shareSummary: One specific claim or reason to read.
shareImageAlt: A literal description of the social preview image
tags: ["developer experience"]
draft: true
noindex: true
# For scheduling, set draft/noindex false and add a UTC timestamp:
# publishAt: 2026-07-14T16:00:00Z
order: 99
---

State the claim in the first paragraph and explain what a developer can do differently after reading.

## The evidence

Use real work, public artifacts, and attributable metrics. Link the artifact every time. Credit the team when the work was shared.

## What changed

Explain the operating decision and the observable result. Keep separate metrics separate. Do not turn correlation into causation.

## What to do next

End with a concrete action for each relevant reader. Do not repeat the introduction as a summary.

Files starting with `_` are skipped by the build. Copy this file to `<slug>.md` to publish.

For a hosted post, write the body below the front matter. It renders at `/writing/<slug>/`. Publish here first, then syndicate to LinkedIn or Substack with the portfolio URL as canonical where the platform permits it.

For an external entry, add `external: https://...` to the front matter and leave the body empty. Drafts are safe by default. Use `npm run new:post -- "Title" --publish` for immediate publication or `--schedule 2026-07-14T16:00:00Z` for the next scheduled deploy after that UTC time.
