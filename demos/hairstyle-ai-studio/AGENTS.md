# AGENTS.md: Hairstyle AI Studio

## Project Overview
Hairstyle AI Studio is a React, Vite, and TypeScript web app for Gemini hairstyle visualization.

## Key Files
- `app/services/geminiService.ts`: Sends same-origin proxy requests for validation, analysis, generation, and refinement.
- `gateway/lib/hairstyleAi.js` (repository root): Owns Gemini model IDs, prompts, input validation, and Interactions API calls.
- `app/services/geminiModels.ts`: Defines client-visible layout and quality labels only.
- `app/hooks/useAppFlow.ts`: Manages step state, IndexedDB history, cancellation, and API error recovery.
- `app/components/`: Renders upload, style selection, loading, result, salon brief, and key dialog views.
- `app/types.ts`: Declares shared TypeScript types for app state and generated images.

## Commands
- `npm install`: Install package dependencies.
- `npm run dev`: Start the local Vite development server.
- `npm run typecheck`: Run TypeScript validation.
- `npm test`: Run Vitest unit tests.
- `npm run build`: Build production static assets.
- `npm run check`: Run typecheck, tests, and production build.

## Gemini Model Policy
Keep model IDs server-owned in `gateway/lib/hairstyleAi.js`. Do not duplicate raw model IDs in browser code. Route `/analyze` to `gemini-4-hydrogen` with `MEDIUM` thinking and zero `temperature`. Route `generationMode: 'fast'` (default) to `gemini-3.1-flash-lite-image` and `generationMode: 'studio'` to `gemini-nano-banana-2.1`. Verify future model updates against official Gemini API documentation.

## Secret Handling
- Never add `VITE_GEMINI_API_KEY` because Vite bundles `VITE_*` variables into public browser code.
- Use server-side `GEMINI_API_KEY` for the shared allowance of five successful image generations per IP per UTC day.
- Validate personal keys through `/api/hairstyle-ai-studio/validate-key`, store them in React memory only, and pass `X-Gemini-API-Key` transiently.
- Keep the per-IP abuse limiter active on personal keys and never fall back to the shared key when a personal key fails.
- Never log, persist, return, or send API keys to analytics, screenshots, or commits.

## UX Rules
Preserve the mobile-first salon flow: Upload, Style, Generate, Refine, and Salon Brief. Every visible control must change real output. Keep interactive touch targets at least 44 by 44 CSS pixels. Use inline recoverable error banners instead of blocking `alert()` calls.

## Styling
Compile Tailwind through PostCSS (`tailwind.config.js` and `postcss.config.js`). Add custom color shades in `tailwind.config.js` before referencing them in components.

## Privacy Rules
Explain clearly when the app sends face photos to Gemini. Keep saved history in browser storage only and preserve delete and clear-all controls.
