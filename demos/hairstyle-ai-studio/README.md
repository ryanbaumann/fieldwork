# Hairstyle AI Studio

Preview hairstyles on your own photos before visiting the salon. Upload a front portrait, pick or write a style, and refine private on-device looks.

The canonical source lives in [ryanbaumann/fieldwork](https://github.com/ryanbaumann/fieldwork/tree/main/demos/hairstyle-ai-studio).

## Fieldwork Architecture

- The React, Vite, Tailwind, IndexedDB history, refinement, and salon-brief flows run inside `demos/hairstyle-ai-studio/`.
- Fieldwork's zero-dependency Node gateway owns `/api/hairstyle-ai-studio/*`.
- The shared server key grants five successful image generations per client IP per UTC day. Style recommendations do not consume this allowance.
- Visitors can connect a personal Gemini API key at any time. The gateway validates the key without generating content.
- The browser keeps a personal key in React memory only and sends it in a transient same-origin header.
- Personal-key requests bypass the shared spend cap and keep a per-IP abuse guard. The gateway never logs, stores, or returns visitor keys.
- The gateway validates image payloads, caps prompt length, enforces same-origin browser mutations, and separates quota errors by source.
- Analytics events include enumerated funnel states only and exclude keys, photos, prompts, URLs, filenames, and raw errors.

## Models

| Task | Model |
| :--- | :--- |
| Opt-in style recommendation (`/analyze`) | `gemini-4-hydrogen` (`MEDIUM` thinking, zero `temperature`) |
| Fast image generation and refinement (`generationMode: 'fast'`) | `gemini-3.1-flash-lite-image` |
| Studio image generation and refinement (`generationMode: 'studio'`) | `gemini-nano-banana-2.1` |

The client derives look titles locally so each makeover uses one image model call.

## Local Development

Install dependencies and start the Vite server from `demos/hairstyle-ai-studio/`:

```bash
npm install
npm run dev
```

Start the Fieldwork gateway from the repository root in a second terminal:

```bash
node gateway/server.js
```

Vite forwards `/api/*` to `http://localhost:8080` by default. Set `PROXY_TARGET` to override the gateway origin.

## Verification

Run typechecks, unit tests, and the production build:

```bash
npm run typecheck
npm test
npm run build
```

Run `NODE_ENV=test node --test gateway/test/hairstyleAi.test.js gateway/test/rateLimit.test.js` from the repository root to verify gateway routing and rate limits.

## Privacy

The app sends photos to Google Gemini only when a visitor triggers a recommendation, generation, or refinement. Fieldwork never stores uploaded or generated photos on the server. The browser stores generated looks in IndexedDB, and visitors can delete items at any time.

## License

MIT. See [LICENSE](LICENSE).
