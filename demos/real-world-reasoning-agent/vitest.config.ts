import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Unit test config for Atlas's genui layer (protocol/store/parity) plus any
// component tests WS1-3 add later. Pure logic tests run in plain `node` (fast,
// no DOM); anything that needs a DOM (`*.test.tsx`) gets `jsdom` instead.
export default defineConfig({
  // @a2ui/web_core@0.15.0 targets Zod v3 APIs (`z.ZodType.prototype.describe`),
  // while `overrides.zod` pins >=4.6.7 to remediate GHSA-mrhx-c7xc-m3w5.
  // Inline `@a2ui/*` in Vite SSR and alias `zod` to Zod v4's built-in `zod/v3` surface.
  resolve: {
    noExternal: ['@a2ui/web_core'],
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^zod$/, replacement: fileURLToPath(new URL('./node_modules/zod/v3/index.js', import.meta.url)) },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          // server/ integration tests spawn server/index.mjs; keep them in the
          // node (no-DOM) project alongside the pure-logic src tests.
          include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
          environment: 'node',
          globals: false,
          // Pure-logic tests reset their zustand stores per-test and never mutate
          // the global env, so we can reuse one worker's transformed module graph
          // across files (isolate:false). Collection — not execution — dominates
          // the run (heavy @google/genai / deck.gl imports), so sharing the graph
          // is the biggest single speed lever. jsdom project stays isolated below.
          pool: 'threads',
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          globals: false,
        },
      },
    ],
    globals: false,
  },
});
