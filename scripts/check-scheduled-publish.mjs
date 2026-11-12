#!/usr/bin/env node
// scripts/check-scheduled-publish.mjs: preflight gate for the hourly
// scheduled deploy (see .github/workflows/deploy.yml). The cron trigger
// ensures two things go live without manual intervention:
//   1. Commits merged to `main` via `GITHUB_TOKEN` auto-merge (e.g. Dependabot
//      and automated security updates), which GitHub's anti-recursion rule
//      prevents from firing `on: push` workflows.
//   2. Content entries whose `publishAt` timestamp has newly come due since the
//      live Cloud Run revision was deployed.
//
// Most hourly ticks have neither an undeployed commit nor a newly due entry, so
// the workflow skips the Cloud Build + Cloud Run deploy when `due=false`.
//
// Env:
//   CLOUD_RUN_SERVICE_JSON  Optional path to `gcloud run services describe
//                           fieldwork --format=json` output. Extracts both the
//                           live image SHA (`:<40-hex-sha>`) and Ready
//                           transition timestamp so skipped cron runs never
//                           advance `since`.
//   CURRENT_HEAD_SHA        Optional 40-char git SHA checked out on `main`.
//                           When set, triggers `due=true` (`undeployed-commit`
//                           or `missing-last-deployed-sha`) unless Cloud Run's
//                           live Ready revision already serves that exact SHA.
//   LAST_DEPLOYED_SHA       Optional explicit override for the live SHA.
//   PUBLISH_CHECK_SINCE     Fallback ISO-8601 timestamp of the last deploy if
//                           Cloud Run's Ready timestamp is unavailable. If
//                           neither is valid, fails safe (`due=true`).
//   PUBLISH_CHECK_NOW       ISO-8601 timestamp to treat as "now" (tests only).
//   PUBLISH_CHECK_CONTENT_DIR  Content directory to scan (defaults to
//                           portfolio/content relative to the repo root).
//   GITHUB_OUTPUT           When set, appends `due=true`/`due=false` to it.
//
// Exit code is always 0: any unexpected error fails safe (`due=true`).

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findDueEntries, scanContentEntries } from './lib/scheduled-publish.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseTimestamp(value) {
  if (!value) return null;
  const ms = new Date(value).valueOf();
  return Number.isNaN(ms) ? null : ms;
}

export function parseCloudRunDeployState(service) {
  if (!service || typeof service !== 'object') {
    return { lastDeployedSha: null, lastDeployedAt: null };
  }
  const conditions = Array.isArray(service.status?.conditions) ? service.status.conditions : [];
  const readyCondition = conditions.find((cond) => cond?.type === 'Ready') || null;
  const latestCreated = service.status?.latestCreatedRevisionName || '';
  const latestReady = service.status?.latestReadyRevisionName || '';
  const isReady = readyCondition?.status === 'True'
    && (!latestCreated || latestReady === latestCreated);

  const image = String(service.spec?.template?.spec?.containers?.[0]?.image || '');
  const tagMatch = image.match(/:([0-9a-f]{40})(?:@|$)/i);
  const lastDeployedSha = isReady && tagMatch ? tagMatch[1].toLowerCase() : null;
  const transitionTime = readyCondition?.lastTransitionTime;
  const lastDeployedAt = isReady && typeof transitionTime === 'string' && parseTimestamp(transitionTime) !== null
    ? transitionTime
    : null;

  return { lastDeployedSha, lastDeployedAt };
}

function readCloudRunStateFromFile(jsonPath) {
  if (!jsonPath || !existsSync(jsonPath)) {
    return { lastDeployedSha: null, lastDeployedAt: null };
  }
  const parsed = JSON.parse(readFileSync(jsonPath, 'utf8'));
  return parseCloudRunDeployState(parsed);
}

export function checkScheduledPublish(env = process.env) {
  const contentDir = env.PUBLISH_CHECK_CONTENT_DIR || resolve(REPO_ROOT, 'portfolio', 'content');
  const nowMs = parseTimestamp(env.PUBLISH_CHECK_NOW) ?? Date.now();
  const cloudRunState = readCloudRunStateFromFile(env.CLOUD_RUN_SERVICE_JSON);

  const headSha = typeof env.CURRENT_HEAD_SHA === 'string' && env.CURRENT_HEAD_SHA.trim()
    ? env.CURRENT_HEAD_SHA.trim().toLowerCase()
    : null;
  const rawDeployedSha = typeof env.LAST_DEPLOYED_SHA === 'string' && env.LAST_DEPLOYED_SHA.trim()
    ? env.LAST_DEPLOYED_SHA.trim().toLowerCase()
    : cloudRunState.lastDeployedSha;

  if (headSha) {
    if (!rawDeployedSha) {
      return {
        due: true,
        reason: 'missing-last-deployed-sha',
        headSha,
        lastDeployedSha: null,
        entries: [],
      };
    }
    if (headSha !== rawDeployedSha) {
      return {
        due: true,
        reason: 'undeployed-commit',
        headSha,
        lastDeployedSha: rawDeployedSha,
        entries: [],
      };
    }
  }

  const sinceMs = parseTimestamp(cloudRunState.lastDeployedAt || env.PUBLISH_CHECK_SINCE);
  if (sinceMs === null) {
    return {
      due: true,
      reason: 'missing-or-invalid-since',
      entries: [],
    };
  }

  const entries = scanContentEntries(contentDir);
  const due = findDueEntries({ entries, sinceMs, nowMs });
  return {
    due: due.length > 0,
    reason: due.length > 0 ? 'entries-newly-due' : 'nothing-due',
    entries: due.map(({ collection, file, meta, reason }) => ({
      collection,
      file,
      publishAt: meta.publishAt,
      reason,
    })),
  };
}

function main() {
  let result;
  try {
    result = checkScheduledPublish(process.env);
  } catch (error) {
    result = { due: true, reason: 'error', error: error.message, entries: [] };
  }

  console.log(JSON.stringify(result, null, 2));

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `due=${result.due}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
