import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkDocument, checkStockPhrases } from '../lib/content-rules.mjs';

function doc(front, body = 'A real paragraph.', collection = 'writing') {
  return { path: 'test.md', collection, raw: `---\n${front}\n---\n${body}` };
}

const ESSAY_FRONT = [
  'title: A thesis, not a topic',
  'summary: One sentence.',
  'image: /img/writing/x.jpg',
  'imageAlt: The header evidence',
  'socialImage: /social/x.jpg',
  'shareTitle: A title',
  'shareSummary: A claim.',
  'shareImageAlt: The social card',
  'tags: ["ai"]',
].join('\n');

const ESSAY_BODY = 'Prose.\n\n![Inline evidence.](/img/writing/x-evidence.png)';

const rules = (findings) => findings.map((f) => f.rule);

test('a compliant hosted essay produces no findings', () => {
  assert.deepEqual(checkDocument(doc(ESSAY_FRONT, ESSAY_BODY)), []);
});

test('em-dashes are caught in the body and in front-matter prose', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `Prose — more prose.\n\n![Alt.](/img/a.png)`))).includes('W-EMDASH'));
  const front = ESSAY_FRONT.replace('summary: One sentence.', 'summary: One sentence — and another.');
  assert.ok(rules(checkDocument(doc(front, ESSAY_BODY))).includes('W-EMDASH'));
});

test('banned phrases and hype adjectives are caught', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `We're excited to announce it.\n\n![Alt.](/img/a.png)`))).includes('W-ANNOUNCE'));
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `A cutting-edge result.\n\n![Alt.](/img/a.png)`))).includes('W-HYPE'));
});

test('code samples and explicitly ignored lines are exempt', () => {
  const fenced = '```js\nconst a = 1; // revolutionary — really\n```\n\n![Alt.](/img/a.png)';
  assert.deepEqual(checkDocument(doc(ESSAY_FRONT, fenced)), []);
  const ignored = '<!-- lint-ignore -->\nNever write "revolutionary" in a headline.\n\n![Alt.](/img/a.png)';
  assert.deepEqual(checkDocument(doc(ESSAY_FRONT, ignored)), []);
});

test('a generic site preview cannot be a post header', () => {
  const front = ESSAY_FRONT.replace('image: /img/writing/x.jpg', 'image: /previews/fieldwork.jpg');
  assert.ok(rules(checkDocument(doc(front, ESSAY_BODY))).includes('C-GENERIC-PREVIEW'));
});

test('shareSummary may not be a copy of summary', () => {
  const front = ESSAY_FRONT.replace('shareSummary: A claim.', 'shareSummary: One sentence.');
  assert.ok(rules(checkDocument(doc(front, ESSAY_BODY))).includes('C-SHARE-DUP'));
});

test('header and social alt text must differ', () => {
  const front = ESSAY_FRONT.replace('shareImageAlt: The social card', 'shareImageAlt: The header evidence');
  assert.ok(rules(checkDocument(doc(front, ESSAY_BODY))).includes('C-ALT-DISTINCT'));
});

test('tag count and vocabulary are advisory, not blocking', () => {
  const front = ESSAY_FRONT.replace('tags: ["ai"]', 'tags: ["ai","growth","evals","product"]');
  const findings = checkDocument(doc(front, ESSAY_BODY));
  assert.ok(rules(findings).includes('C-TAGS-COUNT'));
  assert.ok(findings.every((f) => f.severity === 'warn'));

  const synonym = ESSAY_FRONT.replace('tags: ["ai"]', 'tags: ["applied ai"]');
  assert.ok(rules(checkDocument(doc(synonym, ESSAY_BODY))).includes('C-TAGS-VOCAB'));
});

test('a hosted essay needs the full asset contract and a distinct inline image', () => {
  const front = ESSAY_FRONT.replace('socialImage: /social/x.jpg\n', '');
  assert.ok(rules(checkDocument(doc(front, ESSAY_BODY))).includes('C-ASSETS'));

  // Reusing the header as the only inline image is the documented failure.
  const reused = 'Prose.\n\n![Alt.](/img/writing/x.jpg)';
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, reused))).includes('C-ASSETS'));
});

test('external link-outs carry no body and no asset contract', () => {
  const front = `title: A link\nsummary: One sentence.\nexternal: https://example.com\ntags: ["ai"]`;
  assert.deepEqual(checkDocument(doc(front, '')), []);
});

test('a phrase repeated across three entries is flagged, two is not', () => {
  const phrase = 'we are still learning what works';
  const make = (path) => ({ path, collection: 'writing', raw: `---\ntitle: T\n---\n${phrase} in production.` });
  assert.deepEqual(checkStockPhrases([make('a.md'), make('b.md')]), []);
  const findings = checkStockPhrases([make('a.md'), make('b.md'), make('c.md')]);
  assert.ok(rules(findings).includes('W-STOCK-PHRASE'));
  assert.match(findings[0].message, /appears in 3 entries/);
});

test('the same evidence link in three entries is not a stock phrase', () => {
  const url = 'https://github.com/ryanbaumann/fieldwork/tree/main/scripts/lib/content-rules.mjs';
  const make = (path, text) => ({ path, collection: 'writing', raw: `---\ntitle: T\n---\n${text}` });
  const docs = [
    make('a.md', `The rules live in [content-rules.mjs](${url}).`),
    make('b.md', `Four checks run from [the linter](${url}) on every build.`),
    make('c.md', `I keep them in [one file](${url}) so they stay readable.`),
  ];
  assert.deepEqual(checkStockPhrases(docs), []);
});

test('spaced hyphens are caught in prose but exempt in table rows', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `Prose - with a spaced hyphen.\n\n![Alt.](/img/a.png)`))).includes('W-SPACED-HYPHEN'));
  const table = '| Column - Name | Description |\n| --- | --- |\n| A - B | Details |\n\n![Alt.](/img/a.png)';
  assert.deepEqual(checkDocument(doc(ESSAY_FRONT, table)), []);
});

test('competitor model names are caught in prose', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `Tested on Claude Opus.\n\n![Alt.](/img/a.png)`))).includes('W-COMPETITOR-MODEL'));
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `Compared against ChatGPT.\n\n![Alt.](/img/a.png)`))).includes('W-COMPETITOR-MODEL'));
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `Prompting GPT-4 directly.\n\n![Alt.](/img/a.png)`))).includes('W-COMPETITOR-MODEL'));
});

test('code spans and URLs are exempt from spaced-hyphen and competitor rules', () => {
  const body = 'Run `a - b` in a shell, or read [the notes](https://example.com/gpt-4-notes).\n\n![Alt.](/img/a.png)';
  const found = rules(checkDocument(doc(ESSAY_FRONT, body)));
  assert.ok(!found.includes('W-SPACED-HYPHEN'));
  assert.ok(!found.includes('W-COMPETITOR-MODEL'));
});

test('avoid words are caught in prose unless matching formal titles or domain tags', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `An end-to-end solution for developers.\n\n![Alt.](/img/a.png)`))).includes('W-AVOID-WORD'));
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `This platform empowers teams.\n\n![Alt.](/img/a.png)`))).includes('W-AVOID-WORD'));

  // Formal job titles and domain tags are exempted
  const titleProse = `I was a Senior Solutions Architect and led the solutions architecture team.\n\n![Alt.](/img/a.png)`;
  assert.deepEqual(checkDocument(doc(ESSAY_FRONT, titleProse)), []);

  const tagFront = ESSAY_FRONT.replace('tags: ["ai"]', 'tags: ["industry solutions"]');
  assert.deepEqual(checkDocument(doc(tagFront, ESSAY_BODY)), []);
});

test('forbidden absolute "every launch" is caught', () => {
  assert.ok(rules(checkDocument(doc(ESSAY_FRONT, `We measure every launch carefully.\n\n![Alt.](/img/a.png)`))).includes('W-ABSOLUTE'));
});

