---
name: hairstyle-ai-studio
description: Guidance on modifying the hairstyle-ai-studio codebase, including models, UX/UI rules, testing, and deployment.
---

# Hairstyle AI Studio Skill

Use this skill when modifying Gemini model routing, UX flows, documentation, or tests in `demos/hairstyle-ai-studio/`.

## Workflow
1. Read `AGENTS.md` first.
2. Read `gateway/lib/hairstyleAi.js` in the repository root before changing model IDs (`gemini-4-hydrogen`, `gemini-3.1-flash-lite-image`, `gemini-nano-banana-2.1`), prompts, or validation.
3. Keep browser HTTP calls in `app/services/geminiService.ts` and keep Gemini prompts in the gateway.
4. Keep flow orchestration in `app/hooks/useAppFlow.ts` and shared types in `app/types.ts`.
5. Run typecheck, tests, and build in `demos/hairstyle-ai-studio/`, then run gateway unit tests.

## Secret Checklist
- Never place Gemini keys in `VITE_*` variables, localStorage, IndexedDB, logs, analytics, URLs, or committed files.
- Reserve server-side `GEMINI_API_KEY` for five successful image generations per client IP per UTC day.
- Validate personal keys via `/api/hairstyle-ai-studio/validate-key`, hold them in React memory only, and send `X-Gemini-API-Key` per request.
- Enforce the gateway abuse limiter on personal keys and fail closed when a personal key is invalid.
- Update `README.md`, `AGENTS.md`, and gateway tests whenever model routing or quota rules change.

## UX Checklist
- Maintain mobile-first Upload, Style, Result, and Salon Brief paths with `>= 44px` touch targets.
- Use inline error recovery instead of `alert()` dialogs.
- Display clear privacy disclosures near photo upload controls.
- Keep Fast and Studio quality controls understandable to non-technical visitors.
