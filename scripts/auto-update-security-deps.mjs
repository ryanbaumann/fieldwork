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

import { ensureNpmInEnv } from './lib/npm-bin.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const SAFE_PKG_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
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
  if (!parsed || typeof parsed !== 'object' || (!parsed.metadata && !parsed.vulnerabilities)) {
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

  const packages = Object.entries(parsed.vulnerabilities || {})
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

  return { counts, packages };
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
    '',
    '| Package | Before | After | Overrides Applied | Changed |',
    '| :--- | :---: | :---: | :--- | :---: |',
  ];
  for (const item of summary.targets) {
    const overrides = item.overridesApplied.length > 0 ? item.overridesApplied.map((v) => `\`${v}\``).join(', ') : '—';
    lines.push(`| \`${item.target}\` | ${item.before.counts.total} | ${item.after.counts.total} | ${overrides} | ${item.changed ? 'Yes' : 'No'} |`);
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
        after = runAudit(absTarget, registry, childEnv, runner);

        if (after.counts.total > 0) {
          const directAdvisoryPackages = after.packages.filter((pkg) => pkg.advisories.length > 0);
          for (const vulnPkg of directAdvisoryPackages) {
            const snapPkg = readFileSync(pkgJsonPath, 'utf8');
            const snapLock = readFileSync(lockPath, 'utf8');
            const latestVersion = queryLatestVersion(vulnPkg.name, absTarget, registry, childEnv, runner);
            if (!latestVersion) continue;

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

  const totalBefore = results.reduce((sum, item) => sum + item.before.counts.total, 0);
  const totalAfter = results.reduce((sum, item) => sum + item.after.counts.total, 0);
  const totalFixed = results.reduce((sum, item) => sum + item.fixedCount, 0);
  const changed = results.some((item) => item.changed);

  const summary = {
    mode,
    changed,
    totalBefore,
    totalAfter,
    totalFixed,
    targets: results,
    errors,
  };

  if (summaryFile) {
    writeFileSync(summaryFile, formatSecuritySummaryMarkdown(summary));
  }
  if (githubOutput) {
    appendFileSync(
      githubOutput,
      `changed=${changed}\nfixed_count=${totalFixed}\nremaining_count=${totalAfter}\n`,
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
    targets: summary.targets.map((t) => ({
      target: t.target,
      before: t.before.counts.total,
      after: t.after.counts.total,
      changed: t.changed,
      overridesApplied: t.overridesApplied,
    })),
    errors: summary.errors,
  }, null, 2));

  if (summary.errors.length > 0) {
    process.exit(1);
  }
  if (mode === 'check' && summary.totalAfter > 0) {
    process.exit(1);
  }
  if (mode === 'fix' && summary.totalBefore > 0 && !summary.changed && summary.totalAfter > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
