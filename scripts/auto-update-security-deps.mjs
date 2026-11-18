#!/usr/bin/env node
// scripts/auto-update-security-deps.mjs
//
// Zero-dependency security audit and remediation runner across every lockfile
// in the Fieldwork monorepo.
//
// Modes:
//   node scripts/auto-update-security-deps.mjs --check
//   node scripts/auto-update-security-deps.mjs --fix [--summary-file <path>]

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateAudit,
  ghsaIdFromUrl,
  isVersionInUpperBoundRange,
  validateExceptions,
} from './ci-audit.mjs';
import { ensureNpmInEnv } from './lib/npm-bin.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const SAFE_PKG_NAME = /^(?:@[a-z0-9~][a-z0-9-._~]*\/)?[a-z0-9~][a-z0-9-._~]*$/;
const SAFE_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function discoverLockfileTargets(repoRoot = REPO_ROOT) {
  const candidates = ['.', 'portfolio', 'gateway'];
  const demosDir = join(repoRoot, 'demos');
  if (existsSync(demosDir)) {
    for (const entry of readdirSync(demosDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      candidates.push(`demos/${entry.name}`);
      candidates.push(`demos/${entry.name}/server`);
    }
  }
  const found = [];
  for (const rel of candidates) {
    const abs = resolve(repoRoot, rel);
    if (existsSync(join(abs, 'package.json')) && existsSync(join(abs, 'package-lock.json'))) {
      found.push(rel);
    }
  }
  return [...new Set(found)].sort();
}

export function parseAuditReport(rawStdout) {
  if (typeof rawStdout !== 'string' || !rawStdout.trim()) {
    throw new Error('Empty output from npm audit --json');
  }
  const parsed = JSON.parse(rawStdout);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || (!parsed.metadata && !parsed.vulnerabilities)) {
    throw new Error(parsed?.error?.summary || 'Unexpected JSON format from npm audit');
  }
  const rawCounts = parsed.metadata?.vulnerabilities || {};
  const counts = {
    info: Number(rawCounts.info || 0),
    low: Number(rawCounts.low || 0),
    moderate: Number(rawCounts.moderate || 0),
    high: Number(rawCounts.high || 0),
    critical: Number(rawCounts.critical || 0),
  };
  counts.total = Number.isFinite(rawCounts.total)
    ? Number(rawCounts.total)
    : counts.info + counts.low + counts.moderate + counts.high + counts.critical;

  const vulnerabilities = parsed.vulnerabilities && typeof parsed.vulnerabilities === 'object' && !Array.isArray(parsed.vulnerabilities)
    ? parsed.vulnerabilities
    : {};

  const packages = Object.entries(vulnerabilities)
    .map(([name, info]) => {
      const viaList = Array.isArray(info?.via) ? info.via : [];
      const advisories = viaList
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          source: item.source ?? null,
          name: item.name || name,
          title: item.title || 'Security advisory',
          url: item.url || null,
          severity: item.severity || info?.severity || 'unknown',
          range: item.range || null,
        }));
      return {
        name,
        severity: info?.severity || 'unknown',
        isDirect: Boolean(info?.isDirect),
        fixAvailable: info?.fixAvailable ?? false,
        advisories,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { counts, packages, rawReport: { vulnerabilities } };
}

function defaultRunner(command, args, { cwd, env }) {
  const res = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  return {
    status: res.status ?? 1,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

function runAudit(targetDir, registry, env, runner) {
  const res = runner('npm', ['audit', '--json', `--registry=${registry}`], { cwd: targetDir, env });
  return parseAuditReport(res.stdout);
}

function queryLatestVersion(pkgName, targetDir, registry, env, runner) {
  if (!SAFE_PKG_NAME.test(pkgName)) return null;
  const res = runner('npm', ['view', pkgName, 'version', '--json', `--registry=${registry}`], {
    cwd: targetDir,
    env,
  });
  if (res.status !== 0 || !res.stdout.trim()) return null;
  try {
    const parsed = JSON.parse(res.stdout.trim());
    const version = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
    return typeof version === 'string' && SAFE_SEMVER.test(version) ? version : null;
  } catch {
    const plain = res.stdout.trim().replace(/^"|"$/g, '');
    return SAFE_SEMVER.test(plain) ? plain : null;
  }
}

function verifyTargetPackage(targetDir, env, runner) {
  const steps = [
    ['ci', '--no-audit', '--no-fund'],
    ['run', 'lint', '--if-present'],
    ['test', '--if-present'],
    ['run', 'build', '--if-present'],
  ];
  for (const args of steps) {
    const res = runner('npm', args, { cwd: targetDir, env });
    if (res.status !== 0) return false;
  }
  return true;
}

export function formatSecuritySummaryMarkdown(summary) {
  const lines = [
    '## Automated Security Dependency Update Summary',
    '',
    `- **Vulnerabilities before**: ${summary.totalBefore}`,
    `- **Vulnerabilities fixed**: ${summary.totalFixed}`,
    `- **Vulnerabilities remaining**: ${summary.totalAfter}`,
    `- **Excused (unpatched) / unexcused**: ${summary.excusedAfter ?? 0} excused, ${summary.unexcusedAfter ?? summary.totalAfter} unexcused`,
    '',
    '| Package | Before | After | Overrides Applied | Changed |',
    '| :--- | :---: | :---: | :--- | :---: |',
  ];
  for (const item of summary.targets) {
    const overrides = item.overridesApplied.length > 0 ? item.overridesApplied.map((v) => `\`${v}\``).join(', ') : '—';
    lines.push(`| \`${item.target}\` | ${item.before.counts.total} | ${item.after.counts.total} | ${overrides} | ${item.changed ? 'Yes' : 'No'} |`);
  }
  if (Array.isArray(summary.prunedExceptions) && summary.prunedExceptions.length > 0) {
    lines.push(
      '',
      '### Pruned Resolved Audit Exceptions',
      '',
      ...summary.prunedExceptions.map((id) => `- \`${id}\` (no matching lockfile advisories remain)`),
    );
  }
  const remainingItems = summary.targets.flatMap((t) =>
    t.after.packages.flatMap((p) =>
      p.advisories.map((adv) => `- \`${t.target}\` -> \`${p.name}\` (${adv.severity}): ${adv.title}${adv.url ? ` (${adv.url})` : ''}`),
    ),
  );
  if (remainingItems.length > 0) {
    lines.push('', '### Remaining Advisories Requiring Manual Code Review', '', ...remainingItems);
  }
  lines.push('');
  return lines.join('\n');
}

export function runSecurityAuditAndFix({
  repoRoot = REPO_ROOT,
  mode = 'check',
  registry = DEFAULT_REGISTRY,
  summaryFile = null,
  githubOutput = process.env.GITHUB_OUTPUT || null,
  baseEnv = process.env,
  runner = defaultRunner,
  now = Date.now(),
} = {}) {
  if (mode !== 'check' && mode !== 'fix') {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  const childEnv = {
    ...ensureNpmInEnv(baseEnv),
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
  };
  const targets = discoverLockfileTargets(repoRoot);
  const results = [];
  const errors = [];
  const latestVersionCache = Object.create(null);

  const getCachedLatestVersion = (pkgName, cwd) => {
    if (Object.hasOwn(latestVersionCache, pkgName)) return latestVersionCache[pkgName];
    const version = queryLatestVersion(pkgName, cwd, registry, childEnv, runner);
    latestVersionCache[pkgName] = version;
    return version;
  };

  for (const relTarget of targets) {
    const absTarget = resolve(repoRoot, relTarget);
    const pkgJsonPath = join(absTarget, 'package.json');
    const lockPath = join(absTarget, 'package-lock.json');
    const initialPkgJson = readFileSync(pkgJsonPath, 'utf8');
    const initialLock = readFileSync(lockPath, 'utf8');

    try {
      const before = runAudit(absTarget, registry, childEnv, runner);
      let after = before;
      const overridesApplied = [];

      if (mode === 'fix' && before.counts.total > 0) {
        runner('npm', ['audit', 'fix', `--registry=${registry}`, '--no-fund'], {
          cwd: absTarget,
          env: childEnv,
        });
        const auditFixCandidate = runAudit(absTarget, registry, childEnv, runner);
        if (
          auditFixCandidate.counts.total < before.counts.total
          && verifyTargetPackage(absTarget, childEnv, runner)
        ) {
          after = auditFixCandidate;
        } else {
          // Discard no-op lockfile churn or unverified edits.
          writeFileSync(pkgJsonPath, initialPkgJson);
          writeFileSync(lockPath, initialLock);
        }

        if (after.counts.total > 0) {
          const directAdvisoryPackages = after.packages.filter((pkg) => pkg.advisories.length > 0);
          for (const vulnPkg of directAdvisoryPackages) {
            const latestVersion = getCachedLatestVersion(vulnPkg.name, absTarget);
            if (!latestVersion) continue;
            if (
              vulnPkg.advisories.length > 0
              && vulnPkg.advisories.every((adv) => isVersionInUpperBoundRange(latestVersion, adv.range))
            ) {
              continue;
            }

            const snapPkg = readFileSync(pkgJsonPath, 'utf8');
            const snapLock = readFileSync(lockPath, 'utf8');
            const parsedPkg = JSON.parse(snapPkg);
            const nextRange = `^${latestVersion}`;
            if (parsedPkg.overrides?.[vulnPkg.name] === nextRange) continue;
            parsedPkg.overrides = { ...(parsedPkg.overrides || {}), [vulnPkg.name]: nextRange };
            writeFileSync(pkgJsonPath, `${JSON.stringify(parsedPkg, null, 2)}\n`);

            const installRes = runner(
              'npm',
              ['install', `--registry=${registry}`, '--no-audit', '--no-fund'],
              { cwd: absTarget, env: childEnv },
            );
            if (installRes.status !== 0) {
              writeFileSync(pkgJsonPath, snapPkg);
              writeFileSync(lockPath, snapLock);
              continue;
            }

            const candidateAudit = runAudit(absTarget, registry, childEnv, runner);
            if (
              candidateAudit.counts.total < after.counts.total
              && verifyTargetPackage(absTarget, childEnv, runner)
            ) {
              after = candidateAudit;
              overridesApplied.push(`${vulnPkg.name}@${nextRange}`);
            } else {
              writeFileSync(pkgJsonPath, snapPkg);
              writeFileSync(lockPath, snapLock);
            }
          }
        }

        if (after.counts.total >= before.counts.total) {
          writeFileSync(pkgJsonPath, initialPkgJson);
          writeFileSync(lockPath, initialLock);
          after = before;
          overridesApplied.length = 0;
        }
      }

      const finalPkgJson = readFileSync(pkgJsonPath, 'utf8');
      const finalLock = readFileSync(lockPath, 'utf8');
      const changed = finalPkgJson !== initialPkgJson || finalLock !== initialLock;

      results.push({
        target: relTarget,
        before,
        after,
        changed,
        fixedCount: Math.max(0, before.counts.total - after.counts.total),
        overridesApplied,
      });
    } catch (error) {
      writeFileSync(pkgJsonPath, initialPkgJson);
      writeFileSync(lockPath, initialLock);
      errors.push({ target: relTarget, message: error.message });
    }
  }

  const exceptionsPath = join(repoRoot, '.github', 'audit-exceptions.json');
  let rawExceptionsDoc = null;
  let activeExceptions = [];
  const prunedExceptions = [];
  let exceptionsChanged = false;

  if (existsSync(exceptionsPath)) {
    try {
      rawExceptionsDoc = JSON.parse(readFileSync(exceptionsPath, 'utf8'));
      activeExceptions = validateExceptions(rawExceptionsDoc);
    } catch (error) {
      errors.push({ target: '.github/audit-exceptions.json', message: error.message });
    }
  }

  if (mode === 'fix' && rawExceptionsDoc && errors.length === 0 && results.length > 0 && activeExceptions.length > 0) {
    const matchesAnyRemainingTarget = (exception) => results.some((item) =>
      item.after.packages.some((pkg) =>
        pkg.advisories.some((adv) =>
          ghsaIdFromUrl(adv.url) === exception.id
          && adv.name === exception.package
          && String(adv.range || '').trim() === exception.vulnerableRange,
        ),
      ),
    );

    const keptIds = new Set();
    for (const exception of activeExceptions) {
      if (matchesAnyRemainingTarget(exception)) {
        keptIds.add(exception.id);
      } else {
        prunedExceptions.push(exception.id);
      }
    }

    if (prunedExceptions.length > 0) {
      const updatedDoc = {
        ...rawExceptionsDoc,
        exceptions: rawExceptionsDoc.exceptions.filter((entry) => keptIds.has(entry.id)),
      };
      writeFileSync(exceptionsPath, `${JSON.stringify(updatedDoc, null, 2)}\n`);
      activeExceptions = validateExceptions(updatedDoc);
      exceptionsChanged = true;
    }
  }

  const latestVersions = Object.create(null);
  for (const exception of activeExceptions) {
    const appearsInRepo = results.some((item) => Object.hasOwn(item.after.rawReport.vulnerabilities, exception.package));
    if (!appearsInRepo || latestVersions[exception.package]) continue;
    const version = getCachedLatestVersion(exception.package, repoRoot);
    if (version) latestVersions[exception.package] = version;
  }

  let excusedAfter = 0;
  let unexcusedAfter = 0;
  for (const item of results) {
    const evaluated = evaluateAudit(item.after.rawReport, activeExceptions, {
      now,
      latestVersions,
      auditLevel: 'info',
    });
    item.excusedCount = evaluated.excused.length;
    item.unexcusedCount = evaluated.blocking.length;
    excusedAfter += item.excusedCount;
    unexcusedAfter += item.unexcusedCount;
  }

  const totalBefore = results.reduce((sum, item) => sum + item.before.counts.total, 0);
  const totalAfter = results.reduce((sum, item) => sum + item.after.counts.total, 0);
  const totalFixed = results.reduce((sum, item) => sum + item.fixedCount, 0);
  const changed = results.some((item) => item.changed) || exceptionsChanged;

  const summary = {
    mode,
    changed,
    totalBefore,
    totalAfter,
    totalFixed,
    excusedAfter,
    unexcusedAfter,
    prunedExceptions,
    targets: results,
    errors,
  };

  if (summaryFile) {
    writeFileSync(summaryFile, formatSecuritySummaryMarkdown(summary));
  }
  if (githubOutput) {
    appendFileSync(
      githubOutput,
      `changed=${changed}\nfixed_count=${totalFixed}\npruned_count=${prunedExceptions.length}\nremaining_count=${totalAfter}\nunexcused_count=${unexcusedAfter}\n`,
    );
  }

  return summary;
}

function parseCliArgs(argv) {
  let mode = 'check';
  let summaryFile = null;
  let registry = DEFAULT_REGISTRY;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') mode = 'check';
    else if (arg === '--fix') mode = 'fix';
    else if (arg === '--summary-file' && argv[i + 1]) {
      summaryFile = resolve(argv[++i]);
    } else if (arg.startsWith('--registry=')) {
      registry = arg.slice('--registry='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { mode, summaryFile, registry };
}

function main() {
  const { mode, summaryFile, registry } = parseCliArgs(process.argv.slice(2));
  const summary = runSecurityAuditAndFix({ mode, summaryFile, registry });
  console.log(JSON.stringify({
    mode: summary.mode,
    changed: summary.changed,
    totalBefore: summary.totalBefore,
    totalFixed: summary.totalFixed,
    totalAfter: summary.totalAfter,
    excusedAfter: summary.excusedAfter,
    unexcusedAfter: summary.unexcusedAfter,
    prunedExceptions: summary.prunedExceptions,
    targets: summary.targets.map((t) => ({
      target: t.target,
      before: t.before.counts.total,
      after: t.after.counts.total,
      excused: t.excusedCount,
      unexcused: t.unexcusedCount,
      changed: t.changed,
      overridesApplied: t.overridesApplied,
    })),
    errors: summary.errors,
  }, null, 2));

  if (summary.errors.length > 0) {
    process.exit(1);
  }
  if (mode === 'check' && summary.unexcusedAfter > 0) {
    process.exit(1);
  }
  if (mode === 'fix' && summary.unexcusedAfter > 0 && !summary.changed) {
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
