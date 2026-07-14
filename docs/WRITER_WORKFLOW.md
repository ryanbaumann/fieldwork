# Draft and scheduled essay workflow

Essays support three publishing states from front matter:

```yaml
# Private writer preview only
draft: true
noindex: true

# Public on the next deploy
draft: false
noindex: false

# Public on the first scheduled deploy after this UTC time
draft: false
noindex: false
publishAt: 2026-07-14T16:00:00Z
```

Create a safe draft with `npm run new:post -- "Essay title"`. Use `--publish` for immediate publication or `--schedule 2026-07-14T16:00:00Z` to scaffold a scheduled essay.

## Writer page

Production builds a second copy at `/writer/`. It includes drafts and future essays, is excluded from public app discovery, forces `noindex, nofollow`, disables analytics, and is protected by the gateway's private-app password session.

The writer dashboard can publish now, schedule in the browser's local timezone, or keep an unpublished essay as a draft. Publish now requires an explicit browser confirmation. A save creates a focused commit on `main` through the GitHub Contents API. The normal push deploy handles immediate publication; an hourly scheduled deploy publishes due timestamps.

Required runtime configuration:

- `PORTFOLIO_WRITER_PASSWORD`: a long random value stored in Secret Manager.
- `GITHUB_CONTENT_TOKEN`: a fine-grained GitHub token restricted to this repository with **Contents: read and write**. Store it in Secret Manager.
- `GITHUB_CONTENT_REPOSITORY`: optional, defaults to `ryanbaumann/Portfolio`.
- `GITHUB_CONTENT_BRANCH`: optional, defaults to `main`.

Attach the two secrets to the Cloud Run service as secret-backed environment variables. Never use `VITE_` names or Docker build arguments for them.

GitHub's Contents permission applies to the whole repository, not only the writing folder. The application restricts updates to `portfolio/content/writing/<slug>.md`, but the token itself cannot be path-scoped. Use a fine-grained token dedicated to this service, rotate it regularly, and never expose it to browser code. The configured branch must allow Contents API commits; protected branches that require pull requests reject the update with an actionable error. If that is your policy, set `GITHUB_CONTENT_BRANCH` to a dedicated publishing branch and merge its changes through the normal PR workflow.

## Important confidentiality limit

This repository is public. A Markdown draft committed here can still be read in GitHub history even when its rendered preview is password protected. Assets under `portfolio/static/` are also copied to the public build. Use this workflow for unfinished writing, not confidential or embargoed material. Confidential drafts require a private content repository or store.

Scheduled publication is not exact to the minute. GitHub's hourly schedule can be delayed, so an essay appears at or shortly after `publishAt`. Use the manual deploy workflow when exact timing matters.
