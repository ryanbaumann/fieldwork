import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  evaluateAudit,
  ghsaIdFromUrl,
  isVersionInUpperBoundRange,
  validateExceptions,
} from '../ci-audit.mjs';

const NOW = Date.parse('2026-11-18T00:00:00Z');
const PICOMATCH_EXCEPTION = {
  id: 'GHSA-fc5q-39xc-vjpf',
  package: 'picomatch',
  vulnerableRange: '<=4.0.7',
  expires: '2027-02-17',
  reason: 'Build-time only dependency with developer-authored globs.',
};

// Mirrors the real `npm audit --json` graph for the picomatch advisory.
function picomatchReport(extra = {}) {
  return {
    vulnerabilities: {
      picomatch: {
        severity: 'high',
        via: [{ source: 1, name: 'picomatch', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf', range: '<=4.0.7', severity: 'high' }],
      },
      fdir: { severity: 'high', via: ['picomatch'] },
      tinyglobby: { severity: 'high', via: ['fdir', 'picomatch'] },
      vite: { severity: 'high', via: ['picomatch', 'tinyglobby'] },
      vitest: { severity: 'high', via: ['picomatch', 'tinyglobby', 'vite'] },
      ...extra,
    },
  };
}

test('active exception excuses the advisory and every package that only reaches it transitively', () => {
  const result = evaluateAudit(picomatchReport(), [PICOMATCH_EXCEPTION], { now: NOW, latestVersions: { picomatch: '4.0.7' } });
  assert.deepEqual(result.blocking, []);
  assert.deepEqual(result.excused.map((item) => item.name).sort(), ['fdir', 'picomatch', 'tinyglobby', 'vite', 'vitest']);
});

test('exception stops applying once a patched release is published', () => {
  const result = evaluateAudit(picomatchReport(), [PICOMATCH_EXCEPTION], { now: NOW, latestVersions: { picomatch: '4.0.8' } });
  assert.equal(result.blocking.length, 5);
  assert.deepEqual(result.inactiveExceptions, [{ id: 'GHSA-fc5q-39xc-vjpf', package: 'picomatch', status: 'patched-release-available' }]);
});

test('exception fails closed when expired or when the latest version is unknown', () => {
  const expired = evaluateAudit(picomatchReport(), [PICOMATCH_EXCEPTION], { now: Date.parse('2027-02-17T00:00:00Z'), latestVersions: { picomatch: '4.0.7' } });
  assert.equal(expired.blocking.length, 5);
  assert.equal(expired.inactiveExceptions[0].status, 'expired');

  const unknown = evaluateAudit(picomatchReport(), [PICOMATCH_EXCEPTION], { now: NOW, latestVersions: {} });
  assert.equal(unknown.blocking.length, 5);
  assert.equal(unknown.inactiveExceptions[0].status, 'latest-version-unknown');
});

test('a second, unrelated advisory on the same dependency path still blocks', () => {
  const report = picomatchReport({
    vite: {
      severity: 'high',
      via: ['picomatch', 'tinyglobby', { name: 'vite', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc', range: '<8.4.0', severity: 'moderate' }],
    },
  });
  const result = evaluateAudit(report, [PICOMATCH_EXCEPTION], { now: NOW, latestVersions: { picomatch: '4.0.7' } });
  assert.deepEqual(result.blocking.map((item) => item.name).sort(), ['vite', 'vitest']);
});

test('a changed advisory range or a different package does not match the exception', () => {
  const report = picomatchReport();
  report.vulnerabilities.picomatch.via[0].range = '<=4.0.9';
  const result = evaluateAudit(report, [PICOMATCH_EXCEPTION], { now: NOW, latestVersions: { picomatch: '4.0.7' } });
  assert.equal(result.blocking.length, 5);
});

test('low-severity findings below the moderate threshold never block', () => {
  const report = { vulnerabilities: { leftpad: { severity: 'low', via: [{ name: 'leftpad', url: 'https://github.com/advisories/GHSA-zzzz-zzzz-zzzz', range: '*' }] } } };
  const result = evaluateAudit(report, [], { now: NOW });
  assert.deepEqual(result.blocking, []);
});

test('isVersionInUpperBoundRange handles <= and < bounds and rejects prereleases or garbage', () => {
  assert.equal(isVersionInUpperBoundRange('4.0.7', '<=4.0.7'), true);
  assert.equal(isVersionInUpperBoundRange('4.0.8', '<=4.0.7'), false);
  assert.equal(isVersionInUpperBoundRange('4.0.7', '<4.0.7'), false);
  assert.equal(isVersionInUpperBoundRange('3.9.9', '<4.0.0'), true);
  assert.equal(isVersionInUpperBoundRange('4.0.8-beta.1', '<=4.0.7'), false);
  assert.equal(isVersionInUpperBoundRange('4.0.7', '*'), false);
});

test('ghsaIdFromUrl extracts IDs only from advisory URLs', () => {
  assert.equal(ghsaIdFromUrl('https://github.com/advisories/GHSA-fc5q-39xc-vjpf'), 'GHSA-fc5q-39xc-vjpf');
  assert.equal(ghsaIdFromUrl('https://example.com/GHSA-fc5q-39xc-vjpf'), null);
});

test('validateExceptions rejects malformed entries and accepts the committed file', () => {
  assert.throws(() => validateExceptions({}), /exceptions/);
  assert.throws(() => validateExceptions({ exceptions: [{ ...PICOMATCH_EXCEPTION, vulnerableRange: '*' }] }), /vulnerableRange/);
  assert.throws(() => validateExceptions({ exceptions: [{ ...PICOMATCH_EXCEPTION, expires: 'soon' }] }), /expires/);
  assert.throws(() => validateExceptions({ exceptions: [{ ...PICOMATCH_EXCEPTION, reason: 'ok' }] }), /reason/);

  const committed = JSON.parse(readFileSync(new URL('../../.github/audit-exceptions.json', import.meta.url), 'utf8'));
  const validated = validateExceptions(committed);
  for (const entry of validated) {
    const days = (Date.parse(`${entry.expires}T00:00:00Z`) - NOW) / 86_400_000;
    assert.ok(days <= 120, `${entry.id} expires more than 120 days out; re-review instead of extending silently`);
  }
});
