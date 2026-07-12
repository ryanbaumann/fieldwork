# portfolio

Ryan Baumann's portfolio — [work](https://trails.ninja/portfolio/work/),
writing, and talks from 15+ years building developer platforms as a growth
engine, currently as Head of Developer Experience at Google Maps Platform.

Built to be **bare bones, fast, and easy to update**: a zero-dependency
static site generator over a flat-file markdown CMS. No framework, no
database, no client-side JavaScript. Every page is a single request.

## Quickstart

```bash
node build.mjs   # renders content/ into dist/
node serve.mjs   # preview at http://localhost:4000
```

That's the whole toolchain. Node 20+, no `npm install`.

## How it works

```
content/            the CMS — flat files, edit and rebuild
  site.json         identity, thesis, section intros, links
  work/*.md         case studies (front matter + markdown body)
  writing/*.md      blog posts (the blog is live; posts appear as files land)
  talks/*.md        talks, videos, and decks
  pages/*.md        standalone pages (e.g. /about/)
static/             copied verbatim (favicon, decks/, images)
build.mjs           the entire generator (~350 lines, zero deps)
style.css           the entire design system, inlined at build time
serve.mjs           tiny preview server
```

Each collection folder has a `_TEMPLATE.md` showing its front-matter
schema. Underscore-prefixed files are drafts — the build skips them.

## Updating the site

Adding anything is: copy the template, write markdown, `node build.mjs`.
The repo ships agent skills that encode the standards, so an AI coding
agent maintains the site in the same voice and style:

- `.claude/skills/content/` — the CMS how-to (schemas, where things go, new content types)
- `.claude/skills/writing/` — how Ryan writes (voice, structure, banned words)
- `.claude/skills/design/` — how Ryan designs (principles, tokens, performance budget)
- `.claude/skills/presenting/` — how Ryan presents (demo-first format, adding decks)

## Deploying

`dist/` is plain static files — host it anywhere (GitHub Pages, Cloud Run,
a bucket, any CDN). To serve under a subpath instead of a domain root:

```bash
BASE_PATH=/portfolio/ node build.mjs
```

## License

MIT
