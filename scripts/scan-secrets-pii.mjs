#!/usr/bin/env node
// scripts/scan-secrets-pii.mjs
//
// Zero-dependency static secret & PII hygiene scanner for tracked repository
// files and optional git commit author/committer metadata.
//
// Usage:
//   node scripts/scan-secrets-pii.mjs [--check-git-authors] [--json]

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.tgz', '.7z',
  '.mp4', '.mov', '.webm', '.mp3', '.wav', '.ogg',
  '.sqlite', '.db', '.bin', '.wasm',
]);

const PLACEHOLDER_USERNAMES = new Set([
  'you', 'user', 'username', 'runner', 'ubuntu', 'node', 'app', 'dev',
  'example', 'admin', 'root', 'someone', 'builder', 'ci',
]);

const ALLOWED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.test',
  'acme.example',
  'nomail.example',
  'invalid',
  'localhost.localdomain',
  'users.noreply.github.com',
]);

const ALLOWED_EXACT_EMAILS = new Set([
  'noreply@github.com',
  'noreply@anthropic.com',
  'onboarding@resend.dev',
]);

const ALLOWED_TEST_FIXTURE_EMAILS = [
  { file: 'gateway/test/auth.test.js', email: ['password', 'github.com'].join('@') },
  { file: 'gateway/test/server.test.js', email: ['seo.pitch.example', 'gmail.com'].join('@') },
  { file: 'gateway/test/server.test.js', email: ['a.b.c.d.e', 'gmail.com'].join('@') },
  { file: 'gateway/test/strava.test.js', domain: 'dgtzuqphqg23d.cloudfront.net' },
  { file: 'demos/strava-explorer/scripts/deploy-gcp.sh', domain: 'developer.gserviceaccount.com' },
];

const TEST_FIXTURE_SECRET_RE = /(?:fixture|test|mock|fake|dummy|placeholder|example|strava-secret|google-secret|server-secret|actual-secret-value)/i;
const ENV_VAR_LITERAL_VALUE_RE = /["']([A-Z][A-Z0-9_]{5,})["']?$/;
const URL_BASIC_AUTH_PREFIX_RE = /https?:\/\/[^\s/]+:$/;

const NON_EMAIL_SUFFIXES = [
  '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif',
  '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json',
];

const SECRET_RULES = [
  { id: 'google-api-key', label: 'Google API key literal', pattern: /AIza[0-9A-Za-z\-_]{35}/g },
  { id: 'google-oauth-token', label: 'Google OAuth access token', pattern: /ya29\.[0-9A-Za-z\-_]{20,}/g },
  { id: 'github-token', label: 'GitHub access token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { id: 'aws-access-key', label: 'AWS access key ID', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'private-key', label: 'Private key block', pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g },
  { id: 'stripe-live-key', label: 'Stripe live secret key', pattern: /\bsk_live_[0-9A-Za-z]{16,}\b/g },
  { id: 'ai-provider-key', label: 'AI provider secret key', pattern: /\bsk-(?:proj|ant)-[A-Za-z0-9_-]{20,}\b/g },
  { id: 'resend-api-key', label: 'Resend API key', pattern: /\bre_[A-Za-z0-9]{24,}\b/g },
  { id: 'slack-token', label: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: 'mapbox-secret-token', label: 'Mapbox secret token', pattern: /\bsk\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { id: 'oauth-client-secret', label: 'Hardcoded OAuth client_secret literal', pattern: /(?:client_secret|clientSecret)["']?\s*[:=]\s*["'][^"'\\\s]{12,}/gi },
];

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LOCAL_HOME_PATH_RE = /(?:\/(?:Users|home)\/([A-Za-z0-9._-]+)\/|[A-Za-z]:\\Users\\([A-Za-z0-9._-]+)\\)/g;
const CORP_USERNAME_RE = /\b[a-z0-9._-]+_google_com\b/gi;
const HARDCODED_OAUTH_ALLOWED_EMAIL_RE = /^\s*(?:export\s+)?GOOGLE_OAUTH_ALLOWED_EMAIL\s*=\s*([^\s#]+)/;
const COMPUTE_SA_TEMPLATE_RE = /\$\{[A-Z0-9_]+\}-compute@developer\.gserviceaccount\.com$/;

export function redactMatch(raw) {
  const value = String(raw || '');
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    const prefix = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
    return `${prefix}***@${domain}`;
  }
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-3)}`;
}

export function isAllowedEmail(rawEmail, relPath = '') {
  const email = String(rawEmail || '').trim().toLowerCase();
  const normalizedPath = String(relPath || '').replaceAll('\\', '/');
  if (!email.includes('@')) return true;
  if (NON_EMAIL_SUFFIXES.some((suffix) => email.endsWith(suffix))) return true;
  if (ALLOWED_EXACT_EMAILS.has(email)) return true;
  const [, domain = ''] = email.split('@');
  if (ALLOWED_EMAIL_DOMAINS.has(domain)) return true;
  if (
    domain.endsWith('.example')
    || domain.endsWith('.example.com')
    || domain.endsWith('.example.org')
    || domain.endsWith('.example.net')
    || domain.endsWith('.example.test')
  ) return true;
  if (/\.test\.[a-z]+$/i.test(normalizedPath) && email === ['a', 'b.com'].join('@')) return true;
  for (const rule of ALLOWED_TEST_FIXTURE_EMAILS) {
    if (normalizedPath !== rule.file) continue;
    if (rule.email && email === rule.email) return true;
    if (rule.domain && domain === rule.domain) return true;
  }
  return false;
}

export function isAllowedCommitEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email.includes('@')) return false;
  if (ALLOWED_EXACT_EMAILS.has(email)) return true;
  const [, domain = ''] = email.split('@');
  return ALLOWED_EMAIL_DOMAINS.has(domain);
}

export function scanText(text, relPath = '') {
  const findings = [];
  const normalizedPath = String(relPath || '').replaceAll('\\', '/');
  const isTestFile = /(?:^|\/)test\/|\.test\.[a-z]+$/i.test(normalizedPath);
  const lines = String(text || '').split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    for (const rule of SECRET_RULES) {
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(line)) !== null) {
        if (rule.id === 'oauth-client-secret') {
          if (ENV_VAR_LITERAL_VALUE_RE.test(match[0])) continue;
          if (isTestFile && TEST_FIXTURE_SECRET_RE.test(match[0])) continue;
        }
        findings.push({
          file: normalizedPath,
          line: lineNumber,
          rule: rule.id,
          label: rule.label,
          sample: redactMatch(match[0]),
        });
      }
    }

    EMAIL_RE.lastIndex = 0;
    let emailMatch;
    while ((emailMatch = EMAIL_RE.exec(line)) !== null) {
      const rawEmail = emailMatch[0];
      if (isAllowedEmail(rawEmail, normalizedPath)) continue;
      if (URL_BASIC_AUTH_PREFIX_RE.test(line.slice(0, emailMatch.index))) continue;
      const prefixSlice = line.slice(0, emailMatch.index + rawEmail.length);
      if (COMPUTE_SA_TEMPLATE_RE.test(prefixSlice)) continue;
      findings.push({
        file: normalizedPath,
        line: lineNumber,
        rule: 'non-allowlisted-email',
        label: 'Non-allowlisted email address',
        sample: redactMatch(rawEmail),
      });
    }

    LOCAL_HOME_PATH_RE.lastIndex = 0;
    let pathMatch;
    while ((pathMatch = LOCAL_HOME_PATH_RE.exec(line)) !== null) {
      const user = (pathMatch[1] || pathMatch[2] || '').toLowerCase();
      if (PLACEHOLDER_USERNAMES.has(user)) continue;
      findings.push({
        file: normalizedPath,
        line: lineNumber,
        rule: 'local-user-home-path',
        label: 'Local machine user path',
        sample: redactMatch(pathMatch[0]),
      });
    }

    CORP_USERNAME_RE.lastIndex = 0;
    let corpMatch;
    while ((corpMatch = CORP_USERNAME_RE.exec(line)) !== null) {
      findings.push({
        file: normalizedPath,
        line: lineNumber,
        rule: 'corporate-username-marker',
        label: 'Corporate username marker',
        sample: redactMatch(corpMatch[0]),
      });
    }

    if (!isTestFile) {
      const oauthMatch = line.match(HARDCODED_OAUTH_ALLOWED_EMAIL_RE);
      if (oauthMatch) {
        const value = oauthMatch[1].replace(/^['"]|['"]$/g, '');
        if (value && !value.startsWith('${') && !value.startsWith('<') && !value.startsWith('YOUR_')) {
          findings.push({
            file: normalizedPath,
            line: lineNumber,
            rule: 'hardcoded-oauth-allowed-email',
            label: 'Hardcoded GOOGLE_OAUTH_ALLOWED_EMAIL default',
            sample: redactMatch(value),
          });
        }
      }
    }
  }

  return findings;
}

export function scanGitAuthors(repoRoot = REPO_ROOT, ref = 'HEAD') {
  const stdout = execFileSync(
    'git',
    ['-C', repoRoot, 'log', ref, '--format=%h\t%ae\t%ce'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  const findings = [];
  for (const row of stdout.split(/\r?\n/)) {
    if (!row) continue;
    const [sha, authorEmail, committerEmail] = row.split('\t');
    if (authorEmail && !isAllowedCommitEmail(authorEmail)) {
      findings.push({
        file: `git:${sha}`,
        line: 0,
        rule: 'git-author-email',
        label: 'Non-noreply git author email',
        sample: redactMatch(authorEmail),
      });
    }
    if (committerEmail && !isAllowedCommitEmail(committerEmail)) {
      findings.push({
        file: `git:${sha}`,
        line: 0,
        rule: 'git-committer-email',
        label: 'Non-noreply git committer email',
        sample: redactMatch(committerEmail),
      });
    }
  }
  return findings;
}

export function scanRepository(repoRoot = REPO_ROOT, { checkGitAuthors = false, ref = 'HEAD' } = {}) {
  const rawList = execFileSync('git', ['-C', repoRoot, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const trackedFiles = rawList.split('\0').filter(Boolean);
  const findings = [];
  let scannedFiles = 0;

  for (const relPath of trackedFiles) {
    if (relPath === 'package-lock.json' || relPath.endsWith('/package-lock.json')) continue;
    if (BINARY_EXTENSIONS.has(extname(relPath).toLowerCase())) continue;
    const absPath = resolve(repoRoot, relPath);
    if (!existsSync(absPath)) continue;
    let stats;
    try {
      stats = statSync(absPath);
    } catch {
      continue;
    }
    if (!stats.isFile() || stats.size > 5 * 1024 * 1024) continue;
    const content = readFileSync(absPath, 'utf8');
    scannedFiles += 1;
    findings.push(...scanText(content, relPath));
  }

  if (checkGitAuthors) {
    findings.push(...scanGitAuthors(repoRoot, ref));
  }

  return { scannedFiles, findings };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkGitAuthors = args.has('--check-git-authors');
  const jsonOutput = args.has('--json');
  const result = scanRepository(REPO_ROOT, { checkGitAuthors });

  if (jsonOutput) {
    console.log(JSON.stringify({
      ok: result.findings.length === 0,
      scannedFiles: result.scannedFiles,
      findingCount: result.findings.length,
      findings: result.findings,
    }, null, 2));
  } else if (result.findings.length === 0) {
    console.log(`[security:scan] clean (${result.scannedFiles} tracked files scanned${checkGitAuthors ? ', git authors checked' : ''})`);
  } else {
    console.error(`[security:scan] found ${result.findings.length} secret/PII hygiene violation(s):`);
    for (const item of result.findings) {
      const loc = item.line > 0 ? `${item.file}:${item.line}` : item.file;
      console.error(`  - [${item.rule}] ${loc} (${item.label}: ${item.sample})`);
    }
  }

  if (result.findings.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
