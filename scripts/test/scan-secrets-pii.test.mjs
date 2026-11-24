import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isAllowedCommitEmail,
  isAllowedEmail,
  redactMatch,
  scanText,
} from '../scan-secrets-pii.mjs';

test('redactMatch masks emails and tokens without echoing raw values', () => {
  const maskedEmail = redactMatch(['alice', 'gmail.com'].join('@'));
  assert.equal(maskedEmail, 'al***@gmail.com');
  assert.ok(!maskedEmail.includes('alice'));

  const syntheticKey = 'AIza' + 'X'.repeat(35);
  const maskedKey = redactMatch(syntheticKey);
  assert.equal(maskedKey, 'AIza***XXX');
  assert.ok(!maskedKey.includes('XXXXXX'));
});

test('scanText detects secrets and personal PII while allowing RFC 2606 examples', () => {
  const syntheticApiKey = 'AIza' + 'B'.repeat(35);
  const syntheticGithubPat = 'ghp_' + '1'.repeat(36);
  const syntheticResendKey = 're_' + 'A'.repeat(28);
  const syntheticPersonalEmail = ['person.name', 'gmail.com'].join('@');
  const syntheticHomePath = '/' + ['Users', 'realperson', 'repo'].join('/') + '/';
  const syntheticCorp = ['jdoe', 'google', 'com'].join('_');

  const dirty = [
    `const key = "${syntheticApiKey}";`,
    `const gh = "${syntheticGithubPat}";`,
    `const rs = "${syntheticResendKey}";`,
    `Contact: ${syntheticPersonalEmail}`,
    `Path: ${syntheticHomePath}file.md`,
    `Corp: ${syntheticCorp}`,
    'GOOGLE_OAUTH_ALLOWED_EMAIL=' + syntheticPersonalEmail,
  ].join('\n');

  const findings = scanText(dirty, 'docs/sample.md');
  const rules = new Set(findings.map((item) => item.rule));
  assert.ok(rules.has('google-api-key'));
  assert.ok(rules.has('github-token'));
  assert.ok(rules.has('resend-api-key'));
  assert.ok(rules.has('non-allowlisted-email'));
  assert.ok(rules.has('local-user-home-path'));
  assert.ok(rules.has('corporate-username-marker'));
  assert.ok(rules.has('hardcoded-oauth-allowed-email'));

  for (const item of findings) {
    assert.ok(!item.sample.includes(syntheticApiKey));
    assert.ok(!item.sample.includes(syntheticGithubPat));
    assert.ok(!item.sample.includes(syntheticPersonalEmail));
  }
});

test('scanText allows safe placeholders, RFC 2606 emails, and GitHub noreply addresses', () => {
  const clean = [
    'Email: owner@example.com',
    'Reply: 12345+bot@users.noreply.github.com',
    'Sender: onboarding@resend.dev',
    'GOOGLE_OAUTH_ALLOWED_EMAIL=',
    'GOOGLE_OAUTH_ALLOWED_EMAIL=${values.GOOGLE_OAUTH_ALLOWED_EMAIL}',
    'Home: /Users/user/project/file.md',
    'Identifier: re_placeholder_snake_case_identifier_value',
  ].join('\n');

  assert.deepEqual(scanText(clean, 'docs/clean.md'), []);
});

test('isAllowedEmail and isAllowedCommitEmail enforce strict allowlists', () => {
  assert.equal(isAllowedEmail('writer@example.test', 'gateway/test/googleAuth.test.js'), true);
  assert.equal(isAllowedEmail('user@users.noreply.github.com', 'docs/a.md'), true);
  assert.equal(isAllowedEmail(['private', 'gmail.com'].join('@'), 'SECURITY.md'), false);
  const testGmailFixture = ['seo.pitch.example', 'gmail.com'].join('@');
  assert.equal(isAllowedEmail(testGmailFixture, 'gateway/test/server.test.js'), true);
  assert.equal(isAllowedEmail(testGmailFixture, 'SECURITY.md'), false);

  assert.equal(isAllowedCommitEmail('ryanbaumann@users.noreply.github.com'), true);
  assert.equal(isAllowedCommitEmail('noreply@github.com'), true);
  assert.equal(isAllowedCommitEmail(['private', 'gmail.com'].join('@')), false);
});

test('scanText does not allow emails preceded by } to bypass detection and catches encrypted private keys', () => {
  const bypassedAttempt = '{"k":"v"}' + ['personal', 'gmail.com'].join('@');
  const encryptedKey = '-----BEGIN ' + 'ENCRYPTED PRIVATE KEY-----';
  const findings = scanText(`${bypassedAttempt}\n${encryptedKey}`, 'docs/edge.md');
  const rules = new Set(findings.map((item) => item.rule));
  assert.ok(rules.has('non-allowlisted-email'));
  assert.ok(rules.has('private-key'));
});
