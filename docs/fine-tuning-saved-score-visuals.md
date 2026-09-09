# A Saved Score Is Not a Fine-Tuning Result: visual sources

Created: 2026-09-08

These assets are deterministic editorial diagrams built from the article's
retained evidence. No generative image model, image-generation prompt, or
external reference image was used.

## Header and inline evidence

- Files: `portfolio/static/img/writing/fine-tuning-header.svg` and
  `portfolio/static/img/writing/fine-tuning-evidence.svg`
- Size: 1200×675 each
- Format: hand-authored SVG with system sans and monospace fonts
- Palette: warm paper `#faf9f6`, ink `#111827`, blue `#2563eb`, gray
  `#6b7280`, and coral `#dc2626`
- Inputs: the saved 2/10 summary, the one clean base output and nine clean tuned
  outputs visible in the retained file, and the runner branch that prints the
  saved summary when a trace is present
- Job: show why a stored aggregate and individually inspectable outputs are
  different evidence, then show the provenance that would be needed to resolve
  the mismatch
- Validation: rasterized at 1200×675 in Chromium in light and dark color schemes
  and inspected with the rendered article at 390 and 1440 px

The values are evidence labels, not a recomputed evaluation. The diagrams do
not identify either number as the correct performance score.

## Social preview

- File: `portfolio/static/social/fine-tuning-was-the-easy-part.jpg`
- Size: 1200×627
- Renderer: Chromium from the repository's installed Playwright dependency
- Output settings: JPEG, quality 80, device scale factor 1
- Input: the same saved-summary/output mismatch described above

The exact source fragment used for the raster card was:

```html
<style>
*{box-sizing:border-box}
body{margin:0;padding:64px;background:#faf9f6;color:#111827;font-family:system-ui,sans-serif}
small{font:26px monospace;color:#2563eb}
h1{font-size:60px;line-height:1.1;max-width:1040px;margin:30px 0 44px}
section{display:flex;gap:36px}
article{border-top:2px solid #d9dde5;padding-top:22px;width:48%;font-size:28px}
b{font-size:86px;display:block;color:#2563eb}
</style>
<small>FIELDWORK · RYAN BAUMANN</small>
<h1>A saved score is not a<br>fine-tuning result</h1>
<section>
  <article>Saved summary<b>2 matches</b></article>
  <article>Individual outputs<b>1 match</b></article>
</section>
```
