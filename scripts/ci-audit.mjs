#!/usr/bin/env node
// scripts/ci-audit.mjs
//
// Zero-dependency CI gate around `npm audit`. Behaves like
// `npm audit --audit-level=moderate`, except that it can excuse an advisory
// listed in .github/audit-exceptions.json. An exception applies only when all
// of these are true:
//   1. The advisory GHSA ID, package name, and vulnerable range match exactly.
//   2. The exception has not reached its `expires` date.
//   3. The latest npm release of the package is still inside the vulnerable
//      range, so no patched release exists yet.
// When upstream ships a fix, rule 3 stops matching and the gate fails again,
// which forces the upgrade. Any lookup or parse failure fails closed.
//
// Usage (from a package directory that has a package-lock.json):
//   node ../../scripts/ci-audit.mjs [--exceptions <path>] [--registry <url>]

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureNpmInEnv } from './lib/npm-bin.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_EXCEPTIONS_PATH = join(REPO_ROOT, '.github', 'audit-exceptions.json');
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const GHSA_ID = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;
const SAFE_PKG_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const UPPER_BOUND_RANGE = /^(<=?)\s*(\d+)\.(\d+)\.(\d+)$/;
const RELEASE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateExceptions(raw) {
  const list = raw?.exceptions;
  if (!Array.isArray(list)) throw new Error('audit exceptions file must contain an "exceptions" array');
  return list.map((entry, index) => {
    const where = `exceptions[${index}]`;
    if (!GHSA_ID.test(entry?.id || '')) throw new Error(`${where}.id must be a GHSA ID`);
    if (!SAFE_PKG_NAME.test(entry?.package || '')) throw new Error(`${where}.package is not a valid npm package name`);
    if (!UPPER_BOUND_RANGE.test(String(entry?.vulnerableRange || '').trim())) {
      throw new Error(`${where}.vulnerableRange must look like "<=1.2.3" or "<1.2.3"`);
    }
    if (!ISO_DATE.test(entry?.expires || '') || Number.isNaN(Date.parse(`${entry.expires}T00:00:00Z`))) {
      throw new Error(`${where}.expires must be an ISO date (YYYY-MM-DD)`);
    }
    if (typeof entry?.reason !== 'string' || entry.reason.trim().length < 20) {
      throw new Error(`${where}.reason must explain why the advisory is not exploitable`);
    }
    return { ...entry, vulnerableRange: entry.vulnerableRange.trim() };
  });
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

// Returns true only when `version` is a plain release inside an upper-bound
// range. Anything unparseable returns false so the exception fails closed.
export function isVersionInUpperBoundRange(version, range) {
  const rangeMatch = UPPER_BOUND_RANGE.exec(String(range || '').trim());
  const versionMatch = RELEASE_VERSION.exec(String(version || '').trim());
  if (!rangeMatch || !versionMatch) return false;
  const bound = rangeMatch.slice(2, 5).map(Number);
  const current = versionMatch.slice(1, 4).map(Number);
  const cmp = compareVersions(current, bound);
  return rangeMatch[1] === '<=' ? cmp <= 0 : cmp < 0;
}

export function ghsaIdFromUrl(url) {
  const match = /\/advisories\/(GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})\b/.exec(String(url || ''));
  return match ? match[1] : null;
}

function exceptionStatus(exception, { now, latestVersions }) {
  if (now >= Date.parse(`${exception.expires}T00:00:00Z`)) return 'expired';
  const latest = latestVersions[exception.package];
  if (!latest) return 'latest-version-unknown';
  if (!isVersionInUpperBoundRange(latest, exception.vulnerableRange)) return 'patched-release-available';
  return 'active';
}

/**
 * Pure evaluation of an `npm audit --json` report against exceptions.
 * @returns {{ blocking: Array, excused: Array, inactiveExceptions: Array }}
 */
export function evaluateAudit(report, exceptions, { now = Date.now(), latestVersions = {}, auditLevel = 'moderate' } = {}) {
  if (!report || typeof report !== 'object' || typeof report.vulnerabilities !== 'object' || report.vulnerabilities === null) {
    throw new Error(report?.error?.summary || 'Unexpected npm audit JSON format');
  }
  const threshold = SEVERITY_RANK[auditLevel];
  if (threshold === undefined) throw new Error(`Unknown audit level: ${auditLevel}`);

  const statuses = exceptions.map((exception) => ({ exception, status: exceptionStatus(exception, { now, latestVersions }) }));
  const active = statuses.filter((item) => item.status === 'active').map((item) => item.exception);

  const advisoryIsExcused = (advisory) => active.some((exception) => (
    ghsaIdFromUrl(advisory.url) === exception.id
    && advisory.name === exception.package
    && String(advisory.range || '').trim() === exception.vulnerableRange
  ));

  const nodes = report.vulnerabilities;
  const excusedNodes = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, node] of Object.entries(nodes)) {
      if (excusedNodes.has(name)) continue;
      const via = Array.isArray(node?.via) ? node.via : [];
      if (via.length === 0) continue;
      const allExcused = via.every((item) => (typeof item === 'string'
        ? excusedNodes.has(item)
        : Boolean(item) && typeof item === 'object' && advisoryIsExcused(item)));
      if (allExcused) {
        excusedNodes.add(name);
        changed = true;
      }
    }
  }

  const blocking = [];
  const excused = [];
  for (const [name, node] of Object.entries(nodes)) {
    const rank = SEVERITY_RANK[node?.severity] ?? SEVERITY_RANK.critical;
    if (rank < threshold) continue;
    const advisories = (Array.isArray(node?.via) ? node.via : [])
      .map((item) => (typeof item === 'string' ? `via ${item}` : `${ghsaIdFromUrl(item?.url) || item?.url || 'unknown advisory'} (${item?.range || '?'})`));
    const entry = { name, severity: node?.severity || 'unknown', advisories };
    if (excusedNodes.has(name)) excused.push(entry);
    else blocking.push(entry);
  }

  return {
    blocking,
    excused,
    inactiveExceptions: statuses.filter((item) => item.status !== 'active')
      .map((item) => ({ id: item.exception.id, package: item.exception.package, status: item.status })),
  };
}

function runNpm(args, env) {
  return spawnSync('npm', args, { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
}

function parseArgs(argv) {
  const options = { exceptionsPath: DEFAULT_EXCEPTIONS_PATH, registry: DEFAULT_REGISTRY };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inlineValue] = argv[i].split(/=(.*)/s, 2);
    const value = () => {
      const next = inlineValue ?? argv[++i];
      if (!next) throw new Error(`Missing value for ${flag}`);
      return next;
    };
    if (flag === '--exceptions') options.exceptionsPath = resolve(value());
    else if (flag === '--registry') options.registry = value();
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!/^https:\/\//.test(options.registry)) throw new Error('--registry must be an https URL');
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const env = ensureNpmInEnv(process.env);
  const exceptions = validateExceptions(JSON.parse(readFileSync(options.exceptionsPath, 'utf8')));

  const audit = runNpm(['audit', '--json', `--registry=${options.registry}`], env);
  if (audit.error) throw audit.error;
  const report = JSON.parse(audit.stdout);

  const reportedPackages = new Set(Object.keys(report.vulnerabilities || {}));
  const latestVersions = {};
  for (const exception of exceptions) {
    if (!reportedPackages.has(exception.package) || latestVersions[exception.package]) continue;
    const view = runNpm(['view', exception.package, 'version', '--json', `--registry=${options.registry}`], env);
    if (view.status === 0) {
      try {
        const parsed = JSON.parse(view.stdout);
        if (typeof parsed === 'string') latestVersions[exception.package] = parsed;
      } catch {
        // Leave unknown; the exception fails closed.
      }
    }
  }

  const result = evaluateAudit(report, exceptions, { latestVersions });
  for (const item of result.excused) {
    console.log(`excused  ${item.severity.padEnd(8)} ${item.name}: ${item.advisories.join(', ')}`);
  }
  for (const item of result.inactiveExceptions) {
    if (reportedPackages.has(item.package)) console.log(`inactive exception ${item.id} (${item.package}): ${item.status}`);
  }
  if (result.blocking.length > 0) {
    for (const item of result.blocking) {
      console.error(`BLOCKING ${item.severity.padEnd(8)} ${item.name}: ${item.advisories.join(', ')}`);
    }
    console.error(`\n[ci-audit] ${result.blocking.length} package(s) at or above moderate severity are not excused.`);
    process.exitCode = 1;
    return;
  }
  console.log(`[ci-audit] passed (${result.excused.length} excused, 0 blocking).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`[ci-audit] failed closed: ${err.message}`);
    process.exitCode = 1;
  }
}
