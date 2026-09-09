# Voice & Editorial Studio

An unlisted browser demo for comparing the checked-in voice examples, revealing model labels, and inspecting diagnostic grades. The examples and training summaries come from `src/evalData.js`; this page does not run a model or train one. The text cleanup tab applies simple replacements, lets you edit the output, and exports a JSONL pair for you to review.

```bash
npm install
npm run dev
npm test
```

No API key or server proxy is required. Votes stay in page memory and reset on reload. The repository's dataset review and editing tools run separately; see [the experiment workflow](../../experiment/voice-ft/README.md). Unlisted means omitted from public navigation, so anyone with the URL can still open the app.
