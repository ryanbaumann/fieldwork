import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyContactSubmission,
  collectContactSignals,
  contactBotReason,
  contactDns,
  contactFlags,
  contactSubjectTag,
  deterministicContactDecision,
  formatContactTriage,
  lookupMailServer,
  parseContactClassifierOutput,
  parseFillMs,
} from '../lib/contactSpam.js';

test('deterministic contact rules flag explicit advertising for review but allow legitimate SEO context', () => {
  assert.equal(deterministicContactDecision('We offer SEO services and backlink packages for your website.').decision, 'review');
  assert.equal(deterministicContactDecision('Could you speak about how AEO changes developer documentation?').decision, 'allow');
  assert.equal(deterministicContactDecision('I lead SEO at our company and want to hire a developer platform speaker.').decision, 'allow');
});

test('classifier output requires exact structured values', () => {
  assert.deepEqual(parseContactClassifierOutput('{"decision":"reject","category":"advertising","confidence":0.99}'), {
    decision: 'reject', category: 'advertising', confidence: 0.99, source: 'model', reason: '',
  });
  assert.equal(
    parseContactClassifierOutput('{"decision":"review","category":"advertising","confidence":0.6,"reason":"Offers SEO.\\r\\nBcc: x@example.com"}').reason,
    'Offers SEO. Bcc: x@example.com',
  );
  assert.equal(parseContactClassifierOutput('SPAM'), null);
  assert.equal(parseContactClassifierOutput('{"decision":"reject","category":"advertising","confidence":5}'), null);
});

test('model advertising decisions are delivered for review and send no identity fields', async () => {
  let requestBody;
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"decision":"reject","category":"advertising","confidence":0.99}' }] } }] }),
    };
  };
  const result = await classifyContactSubmission({
    intent: 'Speaking opportunity',
    message: 'We offer SEO services and backlink packages for your website.',
    geminiApiKey: 'test-key',
    fetchImpl,
  });
  assert.equal(result.decision, 'review');
  const modelText = requestBody.contents[0].parts[0].text;
  assert.doesNotMatch(modelText, /name:|email:/i);
});

test('model-only rejection is delivered for review', async () => {
  const result = await classifyContactSubmission({
    intent: 'Speaking opportunity',
    message: 'A vague commercial pitch that the model must evaluate.',
    geminiApiKey: 'test-key',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"decision":"reject","category":"advertising","confidence":0.99}' }] } }] }),
    }),
  });
  assert.equal(result.decision, 'review');
});

test('ambiguous, malformed, and failed model responses fail open', async () => {
  const cases = [
    async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"decision":"reject","category":"advertising","confidence":0.7}' }] } }] }) }),
    async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'SPAM' }] } }] }) }),
    async () => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); },
  ];
  const decisions = [];
  for (const fetchImpl of cases) {
    decisions.push(await classifyContactSubmission({
      intent: 'Other',
      message: 'I have a potentially useful professional question for Ryan.',
      geminiApiKey: 'test-key',
      fetchImpl,
    }));
  }
  assert.equal(decisions[0].decision, 'review');
  assert.equal(decisions[1].decision, 'allow');
  assert.equal(decisions[2].decision, 'allow');
});

test('expanded rules flag common pitches and report the matched phrase', () => {
  const pitches = [
    'Our team can build a new website for your brand at half the price.',
    'We provide dedicated developers for any stack you need.',
    'I would like to publish a sponsored post on your blog next month.',
    'Our digital marketing agency helps founders like you grow.',
    'Get a free quote today, reply STOP to unsubscribe.',
  ];
  for (const pitch of pitches) {
    const result = deterministicContactDecision(pitch);
    assert.equal(result.decision, 'review', pitch);
    assert.ok(result.rule, pitch);
  }
  assert.equal(deterministicContactDecision('Would you speak at our developer meetup about web development with maps?').decision, 'allow');
});

test('a rule match stays flagged when the model allows the message', async () => {
  const result = await classifyContactSubmission({
    intent: 'Other',
    message: 'We offer SEO services and backlink packages for your website.',
    geminiApiKey: 'test-key',
    geminiLimiter: null,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"decision":"allow","category":"legitimate","confidence":0.95,"reason":"Looks fine."}' }] } }] }),
    }),
  });
  assert.equal(result.decision, 'review');
  assert.equal(result.category, 'advertising');
  assert.equal(result.rule, 'SEO services');
  assert.equal(result.reason, 'Looks fine.');
});

test('bot reasons cover honeypot, scripted posts, and impossibly fast fills only', () => {
  const browser = collectContactSignals({ headers: { origin: 'https://ryanbaumann.dev', 'sec-fetch-site': 'same-origin' }, fillMs: 40_000 });
  assert.equal(contactBotReason({ honeypot: '', signals: browser }), null);
  assert.equal(contactBotReason({ honeypot: 'x', signals: browser }), 'honeypot');
  assert.equal(contactBotReason({ honeypot: '', signals: collectContactSignals({ headers: {}, fillMs: 40_000 }) }), 'no_browser_headers');
  assert.equal(contactBotReason({ honeypot: '', signals: { ...browser, fillMs: 1_200 } }), 'too_fast');
  // Missing timing (JavaScript off) is a soft flag, never a silent drop.
  assert.equal(contactBotReason({ honeypot: '', signals: { ...browser, fillMs: null } }), null);
  assert.equal(parseFillMs(''), null);
  assert.equal(parseFillMs('-5'), null);
  assert.equal(parseFillMs('abc'), null);
  assert.equal(parseFillMs('4321.6'), 4322);
});

test('mail server lookup handles webmail, null MX, missing domains, and timeouts', async () => {
  const original = contactDns.resolveMx;
  try {
    contactDns.resolveMx = async () => { throw new Error('webmail must not hit DNS'); };
    assert.equal(await lookupMailServer('gmail.com'), 'found');
    assert.equal(await lookupMailServer(''), 'invalid');
    contactDns.resolveMx = async () => [{ exchange: '', priority: 0 }];
    assert.equal(await lookupMailServer('nullmx.example'), 'none');
    contactDns.resolveMx = async () => { throw Object.assign(new Error('x'), { code: 'ENOTFOUND' }); };
    assert.equal(await lookupMailServer('missing.example'), 'none');
    contactDns.resolveMx = () => new Promise(() => {});
    assert.equal(await lookupMailServer('slow.example', 20), 'unknown');
  } finally {
    contactDns.resolveMx = original;
  }
});

test('subject tags separate likely pitches from messages worth a second look', () => {
  const clean = { decision: 'allow', category: 'legitimate', confidence: 0.95, source: 'model' };
  assert.equal(contactSubjectTag(clean, []), '');
  assert.equal(contactSubjectTag(clean, ['3 links in message']), '[Check] ');
  assert.equal(contactSubjectTag({ ...clean, decision: 'review' }, []), '[Check] ');
  assert.equal(contactSubjectTag({ ...clean, decision: 'review', category: 'advertising' }, []), '[Spam? advertising] ');
  assert.equal(contactSubjectTag({ ...clean, decision: 'review', category: 'gibberish' }, []), '[Spam? gibberish] ');
  assert.equal(contactSubjectTag({ ...clean, decision: 'reject', category: 'advertising' }, []), '[Spam? advertising] ');
});

test('triage block shows evidence and keeps visitor headers on one line', () => {
  const signals = collectContactSignals({
    headers: {
      'sec-fetch-site': 'same-origin',
      origin: 'https://ryanbaumann.dev',
      'user-agent': 'Bot/1.0\r\nBcc: evil@example.com',
      'accept-language': 'en-US',
      referer: 'https://ryanbaumann.dev/contact/',
    },
    ip: '198.51.100.7',
    email: 'pat@acme.example',
    message: 'See https://a.example and https://b.example and www.c.example for details.',
    fillMs: 61_000,
  });
  signals.mailServer = 'found';
  const classification = { decision: 'review', category: 'advertising', confidence: 0.91, source: 'model', reason: 'Offers web design.' };
  const flags = contactFlags(classification, signals);
  assert.deepEqual(flags, ['3 links in message']);
  const triage = formatContactTriage({ name: 'Pat Doe', classification, signals, flags });
  assert.match(triage, /^-- \nTriage\nVerdict: review · advertising · confidence 0\.91 · via model\nWhy: Offers web design\./);
  assert.match(triage, /Form: browser form \(same-origin\) · filled in 61s/);
  assert.match(triage, /Sender: acme\.example \(own domain, mail server found\)/);
  assert.match(triage, /Browser: Bot\/1\.0 Bcc: evil@example\.com\n/);
  assert.doesNotMatch(triage, /\r|\nBcc:/);
  assert.match(triage, /Website: https:\/\/acme\.example/);
  assert.match(triage, /IP lookup: https:\/\/ipinfo\.io\/198\.51\.100\.7/);
});

test('invalid IPs and email domains are not echoed as links', () => {
  const signals = collectContactSignals({ headers: { 'sec-fetch-site': 'same-origin' }, ip: 'not-an-ip', email: 'x@bad_domain/../', message: 'hello there friend of mine', fillMs: 9_000 });
  signals.mailServer = 'invalid';
  const classification = { decision: 'allow', category: 'other', confidence: 0, source: 'rules' };
  const triage = formatContactTriage({ name: 'X', classification, signals, flags: contactFlags(classification, signals) });
  assert.doesNotMatch(triage, /Website: |IP lookup: /);
  assert.match(triage, /Flags: email domain is not valid/);
  assert.match(triage, /Sender: invalid domain/);
});
