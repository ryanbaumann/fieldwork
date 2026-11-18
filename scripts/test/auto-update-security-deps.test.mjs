import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  discoverLockfileTargets,
  formatSecuritySummaryMarkdown,
  parseAuditReport,
  runSecurityAuditAndFix,
} from '../auto-update-security-deps.mjs';

function makeAuditJson(vulns = {}) {
  const entries = Object.values(vulns);
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
  for (const item of entries) {
    const sev = item.severity || 'high';
    counts[sev] = (counts[sev] || 0) + 1;
    counts.total += 1;
  }
  return JSON.stringify({
    auditReportVersion: 2,
    vulnerabilities: vulns,
    metadata: { vulnerabilities: counts },
  });
}

test('discoverLockfileTargets finds demos with both package.json and package-lock.json', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-discover-'));
  try {
    mkdirSync(join(root, 'gateway'), { recursive: true });
    writeFileSync(join(root, 'gateway/package.json'), '{}');

    mkdirSync(join(root, 'demos/alpha'), { recursive: true });
    writeFileSync(join(root, 'demos/alpha/package.json'), '{}');
    writeFileSync(join(root, 'demos/alpha/package-lock.json'), '{}');

    mkdirSync(join(root, 'demos/alpha/server'), { recursive: true });
    writeFileSync(join(root, 'demos/alpha/server/package.json'), '{}');

    assert.deepEqual(discoverLockfileTargets(root), ['demos/alpha']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('parseAuditReport extracts counts and advisory metadata', () => {
  const raw = makeAuditJson({
    minimatch: {
      name: 'minimatch',
      severity: 'high',
      isDirect: false,
      fixAvailable: true,
      via: [
        {
          source: 1001,
          name: 'minimatch',
          title: 'ReDoS in minimatch',
          url: 'https://github.com/advisories/GHSA-xxxx',
          severity: 'high',
          range: '<11.0.8',
        },
      ],
    },
  });
  const parsed = parseAuditReport(raw);
  assert.equal(parsed.counts.total, 1);
  assert.equal(parsed.counts.high, 1);
  assert.equal(parsed.packages.length, 1);
  assert.equal(parsed.packages[0].name, 'minimatch');
  assert.equal(parsed.packages[0].advisories[0].title, 'ReDoS in minimatch');
});

test('runSecurityAuditAndFix applies npm audit fix and falls back to verified overrides when needed', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-fix-'));
  try {
    const demoDir = join(root, 'demos/demo-a');
    mkdirSync(demoDir, { recursive: true });
    writeFileSync(join(demoDir, 'package.json'), JSON.stringify({ name: 'demo-a', version: '1.0.0' }, null, 2) + '\n');
    writeFileSync(join(demoDir, 'package-lock.json'), '{"lockfileVersion":3,"step":"initial"}\n');

    let auditPhase = 0;
    const summaryPath = join(root, 'summary.md');
    const outputPath = join(root, 'github-output.txt');

    const summary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      summaryFile: summaryPath,
      githubOutput: outputPath,
      runner(_cmd, args, { cwd }) {
        if (args[0] === 'audit' && args[1] === '--json') {
          auditPhase += 1;
          if (auditPhase <= 2) {
            return {
              status: 1,
              stdout: makeAuditJson({
                'fast-xml-parser': {
                  name: 'fast-xml-parser',
                  severity: 'high',
                  via: [{ name: 'fast-xml-parser', title: 'Entity expansion', severity: 'high', url: 'https://github.com/advisories/GHSA-test' }],
                },
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: makeAuditJson({}), stderr: '' };
        }
        if (args[0] === 'audit' && args[1] === 'fix') {
          return { status: 0, stdout: '', stderr: '' };
        }
        if (args[0] === 'view' && args[1] === 'fast-xml-parser') {
          return { status: 0, stdout: '"5.12.0"\n', stderr: '' };
        }
        if (args[0] === 'install') {
          writeFileSync(join(cwd, 'package-lock.json'), '{"lockfileVersion":3,"step":"overridden"}\n');
          return { status: 0, stdout: '', stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    assert.equal(summary.changed, true);
    assert.equal(summary.totalBefore, 1);
    assert.equal(summary.totalFixed, 1);
    assert.equal(summary.totalAfter, 0);
    assert.deepEqual(summary.targets[0].overridesApplied, ['fast-xml-parser@^5.12.0']);

    const updatedPkg = JSON.parse(readFileSync(join(demoDir, 'package.json'), 'utf8'));
    assert.equal(updatedPkg.overrides['fast-xml-parser'], '^5.12.0');

    const md = readFileSync(summaryPath, 'utf8');
    assert.match(md, /fast-xml-parser@\^5\.12\.0/);
    const ghOut = readFileSync(outputPath, 'utf8');
    assert.match(ghOut, /changed=true/);
    assert.match(ghOut, /fixed_count=1/);
    assert.match(ghOut, /remaining_count=0/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('runSecurityAuditAndFix rolls back an override if package verification fails', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-rollback-'));
  try {
    const demoDir = join(root, 'demos/demo-b');
    mkdirSync(demoDir, { recursive: true });
    const initialPkg = JSON.stringify({ name: 'demo-b', version: '1.0.0' }, null, 2) + '\n';
    const initialLock = '{"lockfileVersion":3,"step":"initial"}\n';
    writeFileSync(join(demoDir, 'package.json'), initialPkg);
    writeFileSync(join(demoDir, 'package-lock.json'), initialLock);

    let auditCalls = 0;
    const summary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      githubOutput: null,
      runner(_cmd, args, { cwd }) {
        if (args[0] === 'audit' && args[1] === '--json') {
          auditCalls += 1;
          if (auditCalls <= 2) {
            return {
              status: 1,
              stdout: makeAuditJson({
                zod: {
                  name: 'zod',
                  severity: 'high',
                  via: [{ name: 'zod', title: 'DoS in zod', severity: 'high' }],
                },
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: makeAuditJson({}), stderr: '' };
        }
        if (args[0] === 'view') {
          return { status: 0, stdout: '"4.6.7"\n', stderr: '' };
        }
        if (args[0] === 'install') {
          writeFileSync(join(cwd, 'package-lock.json'), '{"lockfileVersion":3,"step":"broken"}\n');
          return { status: 0, stdout: '', stderr: '' };
        }
        if (args[0] === 'test') {
          return { status: 1, stdout: '', stderr: 'test failed' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    assert.equal(summary.changed, false);
    assert.equal(summary.totalAfter, 1);
    assert.equal(readFileSync(join(demoDir, 'package.json'), 'utf8'), initialPkg);
    assert.equal(readFileSync(join(demoDir, 'package-lock.json'), 'utf8'), initialLock);
    assert.match(formatSecuritySummaryMarkdown(summary), /Remaining Advisories Requiring Manual Code Review/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('runSecurityAuditAndFix rolls back no-op npm audit fix lockfile churn and honors active unpatched exceptions', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-noop-excused-'));
  try {
    const demoDir = join(root, 'demos/demo-c');
    mkdirSync(demoDir, { recursive: true });
    mkdirSync(join(root, '.github'), { recursive: true });

    const initialPkg = JSON.stringify({ name: 'demo-c', version: '1.0.0' }, null, 2) + '\n';
    const initialLock = '{"lockfileVersion":3,"step":"clean"}\n';
    writeFileSync(join(demoDir, 'package.json'), initialPkg);
    writeFileSync(join(demoDir, 'package-lock.json'), initialLock);

    const initialExceptions = JSON.stringify({
      $comment: 'test exceptions',
      exceptions: [
        {
          id: 'GHSA-fc5q-39xc-vjpf',
          package: 'picomatch',
          vulnerableRange: '<=4.0.7',
          expires: '2099-01-01',
          reason: 'Unpatched build-time transitive dependency.',
        },
      ],
    }, null, 2) + '\n';
    writeFileSync(join(root, '.github/audit-exceptions.json'), initialExceptions);

    const picomatchAudit = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        picomatch: {
          name: 'picomatch',
          severity: 'high',
          via: [{
            source: 1,
            name: 'picomatch',
            title: 'picomatch ReDoS',
            url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
            severity: 'high',
            range: '<=4.0.7',
          }],
        },
        vite: {
          name: 'vite',
          severity: 'high',
          via: ['picomatch'],
        },
      },
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2 } },
    });

    const summary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      githubOutput: null,
      runner(_cmd, args, { cwd }) {
        if (args[0] === 'audit' && args[1] === '--json') {
          return { status: 1, stdout: picomatchAudit, stderr: '' };
        }
        if (args[0] === 'audit' && args[1] === 'fix') {
          // Simulate npm audit fix rewriting lockfile metadata without fixing anything.
          writeFileSync(join(cwd, 'package-lock.json'), '{"lockfileVersion":3,"step":"churned-metadata"}\n');
          return { status: 0, stdout: '', stderr: '' };
        }
        if (args[0] === 'view' && args[1] === 'picomatch') {
          return { status: 0, stdout: '"4.0.7"\n', stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    assert.equal(summary.changed, false);
    assert.equal(summary.totalFixed, 0);
    assert.equal(summary.unexcusedAfter, 0);
    assert.equal(summary.excusedAfter, 2);
    assert.deepEqual(summary.prunedExceptions, []);
    assert.equal(readFileSync(join(demoDir, 'package-lock.json'), 'utf8'), initialLock);
    assert.equal(readFileSync(join(root, '.github/audit-exceptions.json'), 'utf8'), initialExceptions);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('runSecurityAuditAndFix upgrades lockfiles and prunes resolved exceptions in one pass when upstream ships a patch', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-prune-on-fix-'));
  try {
    const demoDir = join(root, 'demos/demo-d');
    mkdirSync(demoDir, { recursive: true });
    mkdirSync(join(root, '.github'), { recursive: true });

    writeFileSync(join(demoDir, 'package.json'), JSON.stringify({ name: 'demo-d', version: '1.0.0' }, null, 2) + '\n');
    writeFileSync(join(demoDir, 'package-lock.json'), '{"lockfileVersion":3,"picomatch":"4.0.7"}\n');
    writeFileSync(join(root, '.github/audit-exceptions.json'), JSON.stringify({
      $comment: 'keep comment',
      exceptions: [
        {
          id: 'GHSA-fc5q-39xc-vjpf',
          package: 'picomatch',
          vulnerableRange: '<=4.0.7',
          expires: '2099-01-01',
          reason: 'Unpatched build-time transitive dependency.',
        },
      ],
    }, null, 2) + '\n');

    let fixed = false;
    const outputPath = join(root, 'gh-out.txt');
    const summaryPath = join(root, 'summary.md');

    const summary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      summaryFile: summaryPath,
      githubOutput: outputPath,
      runner(_cmd, args, { cwd }) {
        if (args[0] === 'audit' && args[1] === '--json') {
          if (!fixed) {
            return {
              status: 1,
              stdout: makeAuditJson({
                picomatch: {
                  name: 'picomatch',
                  severity: 'high',
                  via: [{
                    source: 1,
                    name: 'picomatch',
                    title: 'picomatch ReDoS',
                    url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
                    severity: 'high',
                    range: '<=4.0.7',
                  }],
                },
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: makeAuditJson({}), stderr: '' };
        }
        if (args[0] === 'audit' && args[1] === 'fix') {
          fixed = true;
          writeFileSync(join(cwd, 'package-lock.json'), '{"lockfileVersion":3,"picomatch":"4.0.8"}\n');
          return { status: 0, stdout: '', stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    assert.equal(summary.changed, true);
    assert.equal(summary.totalFixed, 1);
    assert.equal(summary.totalAfter, 0);
    assert.equal(summary.unexcusedAfter, 0);
    assert.deepEqual(summary.prunedExceptions, ['GHSA-fc5q-39xc-vjpf']);

    const updatedExceptions = JSON.parse(readFileSync(join(root, '.github/audit-exceptions.json'), 'utf8'));
    assert.equal(updatedExceptions.$comment, 'keep comment');
    assert.deepEqual(updatedExceptions.exceptions, []);
    assert.match(readFileSync(summaryPath, 'utf8'), /GHSA-fc5q-39xc-vjpf/);
    assert.match(readFileSync(outputPath, 'utf8'), /pruned_count=1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('runSecurityAuditAndFix prunes stale exceptions when lockfiles already have zero advisories, but never when an audit errors', () => {
  const root = mkdtempSync(join(tmpdir(), 'sec-deps-prune-stale-'));
  try {
    const demoDir = join(root, 'demos/demo-e');
    mkdirSync(demoDir, { recursive: true });
    mkdirSync(join(root, '.github'), { recursive: true });

    writeFileSync(join(demoDir, 'package.json'), JSON.stringify({ name: 'demo-e', version: '1.0.0' }, null, 2) + '\n');
    writeFileSync(join(demoDir, 'package-lock.json'), '{"lockfileVersion":3,"picomatch":"4.0.8"}\n');
    const exceptionsFile = join(root, '.github/audit-exceptions.json');
    const rawExceptions = JSON.stringify({
      exceptions: [
        {
          id: 'GHSA-fc5q-39xc-vjpf',
          package: 'picomatch',
          vulnerableRange: '<=4.0.7',
          expires: '2099-01-01',
          reason: 'Already upgraded manually.',
        },
      ],
    }, null, 2) + '\n';
    writeFileSync(exceptionsFile, rawExceptions);

    // 1. If audit throws on a target, do NOT prune exceptions.
    const failedSummary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      githubOutput: null,
      runner() {
        return { status: 1, stdout: 'not-json', stderr: 'network failure' };
      },
    });
    assert.equal(failedSummary.errors.length, 1);
    assert.deepEqual(failedSummary.prunedExceptions, []);
    assert.equal(readFileSync(exceptionsFile, 'utf8'), rawExceptions);

    // 2. When all targets audit cleanly with 0 matching advisories, prune stale exception.
    const cleanSummary = runSecurityAuditAndFix({
      repoRoot: root,
      mode: 'fix',
      githubOutput: null,
      runner(_cmd, args) {
        if (args[0] === 'audit' && args[1] === '--json') {
          return { status: 0, stdout: makeAuditJson({}), stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      },
    });
    assert.equal(cleanSummary.changed, true);
    assert.deepEqual(cleanSummary.prunedExceptions, ['GHSA-fc5q-39xc-vjpf']);
    assert.deepEqual(JSON.parse(readFileSync(exceptionsFile, 'utf8')).exceptions, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
