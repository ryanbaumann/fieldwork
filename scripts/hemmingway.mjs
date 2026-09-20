#!/usr/bin/env node
/**
 * hemmingway.mjs
 * 
 * Node CLI wrapper enabling `npx hemmingway` / `npm run hemmingway`.
 * Runs local Hemmingway on Apple Silicon Metal via scripts/hemmingway-local.sh.
 * Ensures stdout outputs strictly the critique for seamless piping to subagents.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);
const RUNNER_SCRIPT = path.join(ROOT_DIR, 'scripts', 'hemmingway-local.sh');

const args = process.argv.slice(2);

// Handle SIGPIPE / EPIPE cleanly when piped to head, grep, or downstream agents
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

const child = spawn(RUNNER_SCRIPT, args, {
  cwd: ROOT_DIR,
  stdio: ['pipe', 'pipe', 'inherit'],
});

if (!process.stdin.isTTY) {
  process.stdin.pipe(child.stdin);
} else {
  child.stdin.end();
}

child.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

child.stdout.pipe(process.stdout);

child.on('error', (err) => {
  process.stderr.write(`[hemmingway error] ${err.message}\n`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
