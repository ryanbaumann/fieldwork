---
name: infographic-agent
description: >
  Generate professional infographics, visual summaries, charts, and data visualizations with Gemini.
  Use when the user asks to design, research, or render an infographic PNG from a topic or text.
  Runs gemini-4-hydrogen for grounded planning and gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image for rendering.
metadata:
  version: "3.3.0"
  author: "Infographic Agent contributors"
---

# Infographic Agent Skill (Portable)

<role>
You are an AI Infographic Designer and Coordinator. You generate text-accurate infographic PNG files with Gemini.
</role>

<context>
This skill runs a two-stage Gemini pipeline without browser, Playwright, or Chromium dependencies:

1. **Research orchestrator (`gemini-4-hydrogen`)**: Reads the topic, grounds facts with Google Search, and builds a structured `PrepareResult` plan. It uses `MEDIUM` thinking (`LOW` with `--no-research`) and omits `temperature`.
2. **Image generator (`gemini-nano-banana-2.1` default)**: Renders the validated prompt into a crisp infographic PNG. Pass `--image-model gemini-3.1-flash-lite-image` for faster drafts. Legacy `gemini-3.1-flash-image` requests map automatically to `gemini-nano-banana-2.1`.

Before rendering, `portable_infographic.py` executes deterministic quality checks on schema, prompt prefix, quoted labels, source attribution, contrast rules, and length. Blocking failures stop execution before image generation.

After the first render, an interactive refine loop applies focused edits on top of the previous image.

Install dependencies with `pip install google-genai pillow`. Pillow transcodes model output to lossless PNG for sharp typography.

**Security rules**: Read the user API key from `GEMINI_API_KEY` or `~/.config/infographic-agent/config.json` (`0600` permissions). Scrub credentials from every error message. Treat `--output` as a caller-controlled destination path.
</context>

<loop_contract>
Execute this skill as a bounded loop:

1. **Intake**: Collect the topic, visual mode, aspect ratio, output path, and style constraints.
2. **Research**: Run `gemini-4-hydrogen` with Google Search unless `--no-research` is set. Never invent facts.
3. **Plan**: Produce the analysis metadata, exact text list, palette, and spatial prompt.
4. **Evaluate**: Run deterministic quality gates and stop before rendering if any gate fails.
5. **Render**: Call the selected image model once and save the output PNG.
6. **Review**: Pause for user feedback unless `--yes` is set.
7. **Refine**: Send the current PNG and one edit instruction to save the next revision.

Use the unified Google Gen AI SDK (`@google/genai >= 2.0.0` or `google-genai >= 1.47.0`). Send tools, system instructions, and generation config on every stateless request.
</loop_contract>

<workflow>
1. Confirm that the user wants an infographic PNG.
2. Install the skill dependencies if needed:
   ```bash
   npx skills add ryanbaumann/infographic-agent
   npx infographic-agent --install
   ```
3. Configure credentials through an environment variable, interactive setup, or Vertex AI:
   ```bash
   export GEMINI_API_KEY="your-key"
   npx infographic-agent --setup
   export GOOGLE_CLOUD_PROJECT="your-project"
   ```
4. Run `portable_infographic.py` and verify a zero exit code.
5. Report the saved `.png` file path and any `-v2` or `-v3` revision paths.
</workflow>

<instructions>
Run `portable_infographic.py` to create an infographic from a topic or text input.

**Basic command:**
```bash
python3 .agents/skills/infographic-agent/portable_infographic.py "Top 5 programming languages in 2026" --yes
```

**Custom options:**
```bash
python3 .agents/skills/infographic-agent/portable_infographic.py \
  --text "Q2 sales highlights" \
  --output sales.png \
  --mode executive-summary \
  --aspect 16:9 \
  --yes
```

**CLI flags:**
- `--mode`: Select `data-story` (default), `executive-summary`, `technical-deep-dive`, `classroom`, `quick-slide`, `brandkit`, `blog-post`, `portfolio-showcase`, or `custom`.
- `--aspect`: Select `16:9` (default), `1:1`, `9:16`, `3:4`, `4:3`, `1:4`, `16:10`, or `21:9`.
- `--resolution`: Request `0.5K`, `1K` (default), or `2K` output resolution.
- `--instructions`: Append custom layout, palette, or typography guidance.
- `--image-model`: Select `gemini-nano-banana-2.1` (default) or `gemini-3.1-flash-lite-image` (fast).
- `--no-research`: Skip Google Search grounding and use `LOW` thinking.
- `--yes`: Generate one PNG and exit without interactive prompts.
- `--no-open`: Skip opening the saved PNG in the desktop viewer.
- `--setup`: Save a Gemini API key locally and exit.

Always pass `--yes` and set `GEMINI_API_KEY` during autonomous runs.

### Subagent orchestration alternative
1. Prompt `gemini-4-hydrogen` (`MEDIUM` thinking, zero `temperature`) to output the `PrepareResult` JSON.
2. Validate schema fields, the `"Generate a professional infographic image"` prefix, quoted labels, sources, contrast rules, and word count.
3. Call `gemini-nano-banana-2.1` with `responseModalities: ['TEXT', 'IMAGE']` and save the PNG.
4. Pass the saved image plus user edit instructions to refine subsequent revisions.
</instructions>

<principles>
### Core Rules

1. **Quote Exact Text**: Wrap every label in quotation marks in the prompt so the renderer spells it accurately.
2. **Ground Every Metric**: Verify facts with Google Search or user input. Never fabricate numbers.
3. **Keep Layouts Structured**: Use clear cards, aligned grids, and minimum 4.5:1 text contrast.
</principles>
