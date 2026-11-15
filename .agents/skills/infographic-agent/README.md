# Infographic Agent Skill

This standalone skill generates infographic PNGs, visual summaries, and charts from text or topics with Gemini. It runs in local terminals and AI coding agents without browser or Playwright dependencies.

## Installation and Setup

Install the skill in your coding agent environment:

```bash
npx skills add ryanbaumann/infographic-agent
```

Or install Python dependencies and run the CLI directly:

```bash
npx infographic-agent --install
npx infographic-agent "Top 5 programming languages in 2026"
```

## Prerequisites

- **Python 3.9+**: Install `google-genai` and `pillow`.
- **Gemini API Key**: Create a free key in [Google AI Studio](https://aistudio.google.com/apikey) and export it:
  ```bash
  export GEMINI_API_KEY="your-key"
  ```
  Run `npx infographic-agent --setup` to store the key locally if `GEMINI_API_KEY` is unset.
- **Vertex AI (Optional)**: Set your Google Cloud project instead of an API key:
  ```bash
  export GOOGLE_CLOUD_PROJECT="your-project-id"
  ```

## Pipeline Architecture

The skill executes a three-step pipeline:

1. **Research and Plan (`gemini-4-hydrogen`)**: Grounds the topic with Google Search using `MEDIUM` thinking (`LOW` with `--no-research`) and omits `temperature`.
2. **Evaluate**: Validates schema fields, prompt prefix, quoted text labels, source attribution, contrast guidance, and word count.
3. **Render (`gemini-nano-banana-2.1` default)**: Generates a text-accurate infographic PNG. Pass `--image-model gemini-3.1-flash-lite-image` for faster drafts. Legacy `gemini-3.1-flash-image` inputs normalize automatically to `gemini-nano-banana-2.1`.

## CLI Flags

| Flag | Short | Description | Default and Choices |
| :--- | :--- | :--- | :--- |
| `topic` | None | Topic or content to visualize. | Required unless `--text` is set |
| `--output` | `-o` | Output PNG file path. | `infographic.png` |
| `--mode` | `-m` | Visual layout preset. | `data-story` (`blog-post`, `brandkit`, `classroom`, `custom`, `data-story`, `executive-summary`, `portfolio-showcase`, `quick-slide`, `technical-deep-dive`) |
| `--aspect` | `-a` | Output aspect ratio. | `16:9` (`1:1`, `1:4`, `3:4`, `4:3`, `9:16`, `16:9`, `16:10`, `21:9`) |
| `--resolution` | `-r` | Requested image size. | `1K` (`0.5K`, `1K`, `2K`) |
| `--instructions` | `-i` | Additional layout or color guidance. | `""` |
| `--image-model` | None | Gemini image renderer model. | `gemini-nano-banana-2.1` (`gemini-nano-banana-2.1`, `gemini-3.1-flash-lite-image`) |
| `--no-research` | None | Skip web search grounding and use `LOW` thinking. | Off |
| `--yes` | `-y` | Generate once and exit without the refine loop. | Off |
| `--no-open` | None | Do not open the output image automatically. | Off |
| `--setup` | None | Configure the local Gemini API key and exit. | Off |

Visit [github.com/ryanbaumann/infographic-agent](https://github.com/ryanbaumann/infographic-agent) for additional examples.
