---
title: Post title
summary: One-sentence description shown in lists and previews.
date: 2026-01-15
order: 99
---

Files starting with `_` are skipped by the build — copy to `<slug>.md` to
publish. Two kinds of writing entries:

1. **A post hosted here**: write the body in markdown below the front
   matter. It renders at `/writing/<slug>/`. Use the writing skill
   (`.claude/skills/writing/SKILL.md`) for voice.
2. **An external piece** (LinkedIn, a launch blog): add
   `external: https://...` to the front matter and leave the body empty.
   It lists with an outbound link.

Entries sort by `order`, then `date` descending.
