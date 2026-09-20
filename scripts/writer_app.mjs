#!/usr/bin/env node
/**
 * writer_app.mjs
 * 
 * Local Zero-Dependency Copywriting & Live Preview Studio.
 * 
 * Features:
 * - Live side-by-side editing & preview with exact portfolio style.css and markdownToHtml()
 * - Google Docs-style inline suggestions (selection highlight -> local Gemma 4 edit -> diff card -> 1-click Accept/Reject)
 * - Full draft voice critique (local Gemma 4 review -> clickable margin critique cards with jump-to-line)
 * - Thesis-driven headline generation (local Gemma 4 headline -> 1-click apply to front matter)
 * - Deterministic instant voice linter (em-dashes, AI stock tells, passive voice, hype adjectives)
 * - Device breakpoint preview (Desktop, Tablet, Mobile)
 * - Bidirectional click-to-edit navigation
 * - Direct local disk sync to portfolio/content/writing/*.md & work/*.md
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

const CONTENT_DIR = path.join(ROOT_DIR, 'portfolio', 'content');
const STYLE_CSS_PATH = path.join(ROOT_DIR, 'portfolio', 'style.css');
const GEMMA_SCRIPT = path.join(ROOT_DIR, 'scripts', 'gemma-local.sh');
const LOCAL_GEMMA_PY = path.join(ROOT_DIR, 'scripts', 'local_gemma.py');

const PORT = parseInt(process.env.PORT || '8090', 10);

// ---------------------------------------------------------------------------
// Markdown Parser & HTML Renderer (Zero-dependency, exact portfolio logic)
// ---------------------------------------------------------------------------

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseFrontMatter(raw) {
  const meta = {};
  if (!raw.startsWith('---')) return { meta, body: raw.trim() };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta, body: raw.trim() };
  const block = raw.slice(raw.indexOf('\n') + 1, end);
  for (const line of block.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key) continue;
    try {
      meta[key] = JSON.parse(value);
    } catch {
      meta[key] = value;
    }
  }
  return { meta, body: raw.slice(end + 4).trim() };
}

function serializeFrontMatter(meta, body) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string' && (v.includes(':') || v.includes('"') || v.includes('\n') || v.startsWith('[') || v.startsWith('{'))) {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else if (typeof v === 'object' || typeof v === 'boolean' || typeof v === 'number') {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(body);
  return lines.join('\n');
}

function inlineMd(text) {
  let html = escapeHtml(text);
  html = html
    .replace(/&lt;ins class=&quot;([^&]+)&quot;&gt;/g, '<ins class="$1">')
    .replace(/&lt;\/ins&gt;/g, '</ins>')
    .replace(/&lt;del class=&quot;([^&]+)&quot;&gt;/g, '<del class="$1">')
    .replace(/&lt;\/del&gt;/g, '</del>');
  const codeSpans = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code>${code}</code>`);
    return `\x00CODE_${codeSpans.length - 1}\x00`;
  });
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    return `<img src="${src}" alt="${alt}" loading="lazy" />`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\x00CODE_(\d+)\x00/g, (_, idx) => codeSpans[Number(idx)]);
  return html;
}

function markdownToHtml(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let index = 0;
  const headingIds = new Set();

  function headingId(rawHeading) {
    const explicit = rawHeading.match(/\s+\{#([a-z][a-z0-9-]*)\}\s*$/i);
    const label = explicit ? rawHeading.slice(0, explicit.index).trim() : rawHeading.trim();
    const base = explicit?.[1].toLowerCase()
      || label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')
      || 'section';
    let id = base;
    let suffix = 2;
    while (headingIds.has(id)) id = `${base}-${suffix++}`;
    headingIds.add(id);
    return { id, label };
  }

  while (index < lines.length) {
    const line = lines[index];
    const lineNum = index + 1;

    if (line.trim().startsWith('<!--')) {
      while (index < lines.length && !lines[index].includes('-->')) {
        index += 1;
      }
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim().replace(/[^a-z0-9_-]/gi, '');
      const code = [];
      const startLine = index + 1;
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      out.push(`<pre data-src-line="${startLine}"><code${language ? ` class="language-${language}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = Math.min(Math.max(heading[1].length, 2), 5);
      const { id, label } = headingId(heading[2]);
      out.push(`<h${level} id="${id}" data-src-line="${lineNum}"><a class="heading-anchor" href="#${id}" aria-label="Link to this section">${inlineMd(label)}</a></h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      out.push(`<hr data-src-line="${lineNum}" />`);
      index += 1;
      continue;
    }

    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const cells = (value) => value.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const headers = cells(line);
      const startLine = index + 1;
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      out.push(`<div class="table-scroll" data-src-line="${startLine}"><table><thead><tr>${headers.map((cell) => `<th>${inlineMd(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inlineMd(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      const startLine = index + 1;
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(`<li data-src-line="${index + 1}">${inlineMd(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
        index += 1;
      }
      out.push(`<ul data-src-line="${startLine}">${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      const startLine = index + 1;
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(`<li data-src-line="${index + 1}">${inlineMd(lines[index].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        index += 1;
      }
      out.push(`<ol data-src-line="${startLine}">${items.join('')}</ol>`);
      continue;
    }

    if (line.startsWith('> ') || line === '>') {
      const quote = [];
      const startLine = index + 1;
      while (index < lines.length && (lines[index].startsWith('> ') || lines[index] === '>')) {
        quote.push(inlineMd(lines[index].startsWith('> ') ? lines[index].slice(2) : ''));
        index += 1;
      }
      out.push(`<blockquote data-src-line="${startLine}"><p>${quote.join('<br />')}</p></blockquote>`);
      continue;
    }

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const paragraph = [];
    const startLine = index + 1;
    while (index < lines.length && lines[index].trim() !== '' && !/^(#{1,4}\s|```|>\s|>\s*$|\s*[-*]\s|\s*\d+\.\s|\s*<!--)/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    out.push(`<p data-src-line="${startLine}">${inlineMd(paragraph.join(' '))}</p>`);
  }

  return out.join('\n');
}

function renderFullArticleHtml(rawMarkdown, collectionName = 'writing', theme = 'system') {
  const { meta, body } = parseFrontMatter(rawMarkdown);
  const title = meta.title || 'Untitled';
  const summary = meta.summary || '';
  const date = meta.date || '';
  const period = meta.period || meta.date || '';
  const org = meta.org || meta.venue || '';
  const role = meta.role || '';
  const bodyHtml = markdownToHtml(body);
  const css = fs.existsSync(STYLE_CSS_PATH) ? fs.readFileSync(STYLE_CSS_PATH, 'utf8') : '';

  const metaParts = [org, role, period].filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(theme)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} - Preview</title>
  <style>
${css}

/* Live Preview Overrides & Enhancements */
body {
  padding: 1.5rem 1rem 4rem;
  background-color: var(--bg);
  color: var(--ink);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.prose {
  margin: 0 auto;
  max-width: var(--prose);
}
[data-src-line] {
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}
[data-src-line]:hover {
  outline: 1px dashed var(--accent);
}
.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
  font-size: 0.85rem;
  color: var(--faint);
}
.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-weight: 600;
  color: var(--accent-ink);
}
.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}
  </style>
</head>
<body>
  <div class="prose">
    <div class="preview-header-bar">
      <span class="preview-badge"><span class="preview-dot"></span> Live Rendered Output</span>
      <span>${collectionName === 'writing' ? 'Field Notes' : collectionName.toUpperCase()}</span>
    </div>

    <article>
      <p class="eyebrow">${collectionName === 'writing' ? 'Field Notes' : escapeHtml(collectionName)}</p>
      <h1>${escapeHtml(title)}</h1>
      ${metaParts ? `<p class="article-meta">${escapeHtml(metaParts)}</p>` : ''}
      ${summary ? `<p class="lede">${escapeHtml(summary)}</p>` : ''}
      
      <div class="article-body">
        ${bodyHtml}
      </div>

      <div class="article-colophon">
        <p class="article-disclosure">Written by Ryan Baumann. Fine-tuned local language models assist with copyediting and voice consistency; all ideas, analysis, and code are my own.</p>
      </div>

      <p class="share-links">
        <span class="share-label">Share</span>
        <span class="chip">LinkedIn</span>
        <span class="chip">Email</span>
      </p>

      <p class="back">← All ${collectionName === 'writing' ? 'notes' : collectionName}</p>
    </article>
  </div>

  <script>
    // Handle click-to-edit back to parent window
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-src-line]');
      if (el) {
        const line = parseInt(el.getAttribute('data-src-line'), 10);
        window.parent.postMessage({ type: 'jump-to-line', line }, '*');
      }
    });

    // Theme listener from parent
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'set-theme') {
        document.documentElement.dataset.theme = e.data.theme;
      }
    });
  </script>
</body>
</html>`;
}

function lcsTokens(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (a[i] === b[j]) dp[i + 1][j + 1] = dp[i][j] + 1;
      else dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'same', val: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', val: b[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'del', val: a[i - 1] });
      i--;
    }
  }
  return result;
}

function wordDiffInline(oldStr, newStr) {
  if (oldStr === newStr) return escapeHtml(newStr);
  if (!oldStr) return `<ins class="rich-diff-ins">${escapeHtml(newStr)}</ins>`;
  if (!newStr) return `<del class="rich-diff-del">${escapeHtml(oldStr)}</del>`;

  const a = oldStr.match(/\S+\s*/g) || [];
  const b = newStr.match(/\S+\s*/g) || [];
  const rawDiff = lcsTokens(a, b);
  const merged = [];
  for (const item of rawDiff) {
    const last = merged[merged.length - 1];
    if (last && last.type === item.type) {
      last.val += item.val;
    } else {
      merged.push({ ...item });
    }
  }
  return merged.map(item => {
    if (item.type === 'same') return escapeHtml(item.val);
    if (item.type === 'add') return `<ins class="rich-diff-ins">${escapeHtml(item.val)}</ins>`;
    if (item.type === 'del') return `<del class="rich-diff-del">${escapeHtml(item.val)}</del>`;
  }).join('');
}

function parseBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') { index++; continue; }
    if (line.trim().startsWith('<!--')) {
      const start = index;
      while (index < lines.length && !lines[index].includes('-->')) index++;
      index++;
      blocks.push({ type: 'comment', raw: lines.slice(start, index).join('\n') });
      continue;
    }
    if (line.startsWith('```')) {
      const start = index; index++;
      while (index < lines.length && !lines[index].startsWith('```')) index++;
      index++;
      blocks.push({ type: 'code', raw: lines.slice(start, index).join('\n') });
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      blocks.push({ type: 'heading', raw: line });
      index++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr', raw: line });
      index++;
      continue;
    }
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const start = index; index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) index++;
      blocks.push({ type: 'table', raw: lines.slice(start, index).join('\n') });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const start = index;
      while (index < lines.length && (/^\s*[-*]\s+/.test(lines[index]) || /^\s*\d+\.\s+/.test(lines[index]) || (lines[index].startsWith(' ') && lines[index].trim() !== ''))) {
        index++;
      }
      blocks.push({ type: 'list', raw: lines.slice(start, index).join('\n') });
      continue;
    }
    if (line.startsWith('> ') || line === '>') {
      const start = index;
      while (index < lines.length && (lines[index].startsWith('> ') || lines[index] === '>')) index++;
      blocks.push({ type: 'blockquote', raw: lines.slice(start, index).join('\n') });
      continue;
    }
    const start = index;
    while (index < lines.length && lines[index].trim() !== '' && !/^(#{1,6}\s|```|>\s|>\s*$|\s*[-*]\s|\s*\d+\.\s|\s*<!--|\|)/.test(lines[index])) {
      index++;
    }
    blocks.push({ type: 'paragraph', raw: lines.slice(start, index).join('\n') });
  }
  return blocks;
}

function renderRichDiffBody(headBody, curBody) {
  const headBlocks = parseBlocks(headBody || '');
  const curBlocks = parseBlocks(curBody || '');

  const m = headBlocks.length, n = curBlocks.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (headBlocks[i].raw === curBlocks[j].raw) dp[i + 1][j + 1] = dp[i][j] + 1;
      else dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const steps = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && headBlocks[i - 1].raw === curBlocks[j - 1].raw) {
      steps.unshift({ type: 'same', block: curBlocks[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      steps.unshift({ type: 'add', block: curBlocks[j - 1] });
      j--;
    } else if (i > 0) {
      steps.unshift({ type: 'del', block: headBlocks[i - 1] });
      i--;
    }
  }

  const chunks = [];
  let curr = null;
  for (const step of steps) {
    if (step.type === 'same') {
      if (curr) { chunks.push(curr); curr = null; }
      chunks.push({ type: 'same', block: step.block });
    } else {
      if (!curr) curr = { type: 'change', dels: [], adds: [] };
      if (step.type === 'del') curr.dels.push(step.block);
      if (step.type === 'add') curr.adds.push(step.block);
    }
  }
  if (curr) chunks.push(curr);

  const outHtml = [];
  for (const chunk of chunks) {
    if (chunk.type === 'same') {
      outHtml.push(markdownToHtml(chunk.block.raw));
      continue;
    }

    if (chunk.dels.length === 1 && chunk.adds.length === 1 && chunk.dels[0].type === 'paragraph' && chunk.adds[0].type === 'paragraph') {
      outHtml.push(`<p>${wordDiffInline(chunk.dels[0].raw, chunk.adds[0].raw)}</p>`);
      continue;
    }

    if (chunk.dels.length === 1 && chunk.adds.length === 1 && chunk.dels[0].type === 'heading' && chunk.adds[0].type === 'heading') {
      const matchLevel = chunk.adds[0].raw.match(/^(#{1,6})\s+(.*)$/);
      const level = matchLevel ? Math.min(Math.max(matchLevel[1].length, 2), 5) : 2;
      const oldTxt = chunk.dels[0].raw.replace(/^#{1,6}\s+/, '');
      const newTxt = chunk.adds[0].raw.replace(/^#{1,6}\s+/, '');
      outHtml.push(`<h${level}>${wordDiffInline(oldTxt, newTxt)}</h${level}>`);
      continue;
    }

    if (chunk.dels.length === chunk.adds.length && chunk.dels.every((d, idx) => d.type === chunk.adds[idx].type)) {
      for (let k = 0; k < chunk.dels.length; k++) {
        const d = chunk.dels[k];
        const a = chunk.adds[k];
        if (d.type === 'paragraph') {
          outHtml.push(`<p>${wordDiffInline(d.raw, a.raw)}</p>`);
        } else if (d.type === 'heading') {
          const matchLevel = a.raw.match(/^(#{1,6})\s+(.*)$/);
          const level = matchLevel ? Math.min(Math.max(matchLevel[1].length, 2), 5) : 2;
          const oldTxt = d.raw.replace(/^#{1,6}\s+/, '');
          const newTxt = a.raw.replace(/^#{1,6}\s+/, '');
          outHtml.push(`<h${level}>${wordDiffInline(oldTxt, newTxt)}</h${level}>`);
        } else if (d.type === 'list' && a.type === 'list') {
          const dLines = d.raw.split('\n').filter(Boolean);
          const aLines = a.raw.split('\n').filter(Boolean);
          const isOrdered = /^\s*\d+\.\s+/.test(aLines[0] || '');
          const tag = isOrdered ? 'ol' : 'ul';
          const items = [];
          const maxLen = Math.max(dLines.length, aLines.length);
          for (let l = 0; l < maxLen; l++) {
            const dLine = (dLines[l] || '').replace(/^\s*([-*]|\d+\.)\s+/, '');
            const aLine = (aLines[l] || '').replace(/^\s*([-*]|\d+\.)\s+/, '');
            items.push(`<li>${inlineMd(wordDiffInline(dLine, aLine))}</li>`);
          }
          outHtml.push(`<${tag}>${items.join('')}</${tag}>`);
        } else {
          outHtml.push(`<div class="rich-diff-block-del"><span class="rich-diff-tag removed">REMOVED</span>${markdownToHtml(d.raw)}</div>`);
          outHtml.push(`<div class="rich-diff-block-ins"><span class="rich-diff-tag added">ADDED</span>${markdownToHtml(a.raw)}</div>`);
        }
      }
      continue;
    }

    for (const del of chunk.dels) {
      outHtml.push(`<div class="rich-diff-block-del"><span class="rich-diff-tag removed">- REMOVED BLOCK</span>${markdownToHtml(del.raw)}</div>`);
    }
    for (const add of chunk.adds) {
      outHtml.push(`<div class="rich-diff-block-ins"><span class="rich-diff-tag added">+ ADDED BLOCK</span>${markdownToHtml(add.raw)}</div>`);
    }
  }

  return outHtml.join('\n');
}

function renderRichDiffArticleHtml(headMarkdown, rawMarkdown, collectionName = 'writing', theme = 'system') {
  const head = parseFrontMatter(headMarkdown || '');
  const cur = parseFrontMatter(rawMarkdown || '');

  const curTitle = cur.meta.title || 'Untitled';
  const headTitle = head.meta.title || '';
  const titleHtml = headTitle && headTitle !== curTitle 
    ? wordDiffInline(headTitle, curTitle) 
    : escapeHtml(curTitle);

  const curSummary = cur.meta.summary || '';
  const headSummary = head.meta.summary || '';
  const summaryHtml = headSummary && headSummary !== curSummary 
    ? wordDiffInline(headSummary, curSummary) 
    : escapeHtml(curSummary);

  const period = cur.meta.period || cur.meta.date || '';
  const org = cur.meta.org || cur.meta.venue || '';
  const role = cur.meta.role || '';
  const metaParts = [org, role, period].filter(Boolean).join(' · ');

  const bodyHtml = renderRichDiffBody(head.body || '', cur.body || '');
  const css = fs.existsSync(STYLE_CSS_PATH) ? fs.readFileSync(STYLE_CSS_PATH, 'utf8') : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(theme)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(curTitle)} - Rich Diff</title>
  <style>
${css}

/* Live Preview Overrides & Enhancements */
body {
  padding: 1.5rem 1rem 4rem;
  background-color: var(--bg);
  color: var(--ink);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.prose {
  margin: 0 auto;
  max-width: var(--prose);
}
[data-src-line] {
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}
[data-src-line]:hover {
  outline: 1px dashed var(--accent);
}
.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
  font-size: 0.85rem;
  color: var(--faint);
}
.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-weight: 600;
  color: var(--accent-ink);
}
.preview-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b82f6;
}

/* Rich Diff Styling */
ins.rich-diff-ins {
  background-color: rgba(34, 197, 94, 0.22);
  color: #15803d;
  text-decoration: none;
  border-bottom: 2px solid #22c55e;
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  font-weight: 500;
}
[data-theme="dark"] ins.rich-diff-ins {
  background-color: rgba(34, 197, 94, 0.25);
  color: #86efac;
}

del.rich-diff-del {
  background-color: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
  text-decoration: line-through;
  opacity: 0.85;
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}
[data-theme="dark"] del.rich-diff-del {
  background-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.rich-diff-block-ins {
  background: rgba(34, 197, 94, 0.08);
  border-left: 4px solid #22c55e;
  padding: 0.85rem 1.15rem;
  margin: 1.25rem 0;
  border-radius: 0 8px 8px 0;
}
.rich-diff-block-del {
  background: rgba(239, 68, 68, 0.08);
  border-left: 4px solid #ef4444;
  padding: 0.85rem 1.15rem;
  margin: 1.25rem 0;
  border-radius: 0 8px 8px 0;
  opacity: 0.85;
}
.rich-diff-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  margin-bottom: 0.6rem;
}
.rich-diff-tag.added {
  background: #22c55e;
  color: #fff;
}
.rich-diff-tag.removed {
  background: #ef4444;
  color: #fff;
}
.rich-diff-banner {
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.rich-diff-banner-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--accent-ink);
}
.rich-diff-legend {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.78rem;
  color: var(--muted);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}
.legend-swatch.ins { background: #22c55e; }
.legend-swatch.del { background: #ef4444; }
  </style>
</head>
<body>
  <div class="prose">
    <div class="preview-header-bar">
      <span class="preview-badge"><span class="preview-dot"></span> ✨ Rich Prose Diff vs Git HEAD</span>
      <span>${collectionName === 'writing' ? 'Field Notes' : collectionName.toUpperCase()}</span>
    </div>

    <div class="rich-diff-banner">
      <div class="rich-diff-banner-left">
        <span>✨ Rich Prose Diff</span>
        <span style="font-weight: 400; color: var(--muted);">Visual formatting and typography comparison</span>
      </div>
      <div class="rich-diff-legend">
        <span class="legend-item"><span class="legend-swatch ins"></span> Added</span>
        <span class="legend-item"><span class="legend-swatch del"></span> Removed</span>
      </div>
    </div>

    <article>
      <p class="eyebrow">${collectionName === 'writing' ? 'Field Notes' : escapeHtml(collectionName)}</p>
      <h1>${titleHtml}</h1>
      ${metaParts ? `<p class="article-meta">${escapeHtml(metaParts)}</p>` : ''}
      ${summaryHtml ? `<p class="lede">${summaryHtml}</p>` : ''}
      
      <div class="article-body">
        ${bodyHtml}
      </div>

      <div class="article-colophon">
        <p class="article-disclosure">Written by Ryan Baumann. Fine-tuned local language models assist with copyediting and voice consistency; all ideas, analysis, and code are my own.</p>
      </div>

      <p class="back">← All ${collectionName === 'writing' ? 'notes' : collectionName}</p>
    </article>
  </div>

  <script>
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-src-line]');
      if (el) {
        const line = parseInt(el.getAttribute('data-src-line'), 10);
        window.parent.postMessage({ type: 'jump-to-line', line }, '*');
      }
    });

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'set-theme') {
        document.documentElement.dataset.theme = e.data.theme;
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Local Gemma 4 Model Execution (Apple Silicon Metal / MLX)
// ---------------------------------------------------------------------------

function runLocalGemma(command, args = [], stdinText = '') {
  return new Promise((resolve, reject) => {
    // Check if python runner exists
    if (!fs.existsSync(LOCAL_GEMMA_PY)) {
      return reject(new Error(`Runner not found at ${LOCAL_GEMMA_PY}`));
    }

    const procArgs = [LOCAL_GEMMA_PY, command, ...args];
    let cmd = 'python3';
    let finalArgs = procArgs;

    if (fs.existsSync(GEMMA_SCRIPT)) {
      cmd = 'bash';
      finalArgs = [GEMMA_SCRIPT, command, ...args];
    }

    const proc = spawn(cmd, finalArgs, {
      cwd: ROOT_DIR,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let stdout = '';
    let stderr = '';

    if (stdinText) {
      proc.stdin.write(stdinText);
    }
    proc.stdin.end();

    proc.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    // Timeout after 120s for local Metal execution (cold load + generation)
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`Local Gemma execution timed out after 120s: ${stderr}`));
    }, 120000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`Process exited with code ${code}: ${stderr || stdout}`));
      }
      resolve(stdout.trim());
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Static Content File Scanning & Persistence
// ---------------------------------------------------------------------------

function listAllPosts() {
  const collections = ['writing', 'work', 'talks', 'scripts'];
  const results = [];

  for (const col of collections) {
    const dir = path.join(CONTENT_DIR, col);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { meta, body } = parseFrontMatter(raw);
      const slug = f.replace(/\.md$/, '');
      const words = body.trim().split(/\s+/).filter(Boolean).length;

      results.push({
        collection: col,
        slug,
        filename: f,
        filepath: fullPath,
        title: meta.title || slug,
        summary: meta.summary || '',
        date: meta.date || '',
        updated: meta.updated || '',
        draft: Boolean(meta.draft),
        wordCount: words,
        readingTime: `${Math.max(1, Math.ceil(words / 225))} min`,
        mtime: stat.mtimeMs
      });
    }
  }

  // Sort writing first by date descending
  return results.sort((a, b) => {
    if (a.collection === 'writing' && b.collection !== 'writing') return -1;
    if (b.collection === 'writing' && a.collection !== 'writing') return 1;
    return (b.date || '').localeCompare(a.date || '');
  });
}

function getPostContent(collection, slug) {
  const filepath = path.join(CONTENT_DIR, collection, `${slug}.md`);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Post not found: ${collection}/${slug}`);
  }
  const stat = fs.statSync(filepath);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const words = body.trim().split(/\s+/).filter(Boolean).length;

  return {
    collection,
    slug,
    filepath,
    rawMarkdown: raw,
    meta,
    body,
    wordCount: words,
    readingTime: `${Math.max(1, Math.ceil(words / 225))} min`,
    mtime: stat.mtimeMs
  };
}

function savePostContent(collection, slug, rawMarkdown) {
  const dir = path.join(CONTENT_DIR, collection);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${slug}.md`);
  fs.writeFileSync(filepath, rawMarkdown, 'utf8');
  const stat = fs.statSync(filepath);
  const { meta, body } = parseFrontMatter(rawMarkdown);
  const words = body.trim().split(/\s+/).filter(Boolean).length;

  return {
    success: true,
    collection,
    slug,
    filepath,
    title: meta.title || slug,
    wordCount: words,
    readingTime: `${Math.max(1, Math.ceil(words / 225))} min`,
    mtime: stat.mtimeMs
  };
}

// ---------------------------------------------------------------------------
// HTTP Server & API Dispatcher
// ---------------------------------------------------------------------------

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function readBodyJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString('utf8'); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  try {
    // API: List all posts
    if (pathname === '/api/posts' && req.method === 'GET') {
      const posts = listAllPosts();
      return sendJson(res, 200, { posts });
    }

    // API: Get specific post
    if (pathname === '/api/post' && req.method === 'GET') {
      const collection = parsedUrl.searchParams.get('collection') || 'writing';
      const slug = parsedUrl.searchParams.get('slug');
      if (!slug) return sendJson(res, 400, { error: 'Missing slug parameter' });
      const post = getPostContent(collection, slug);
      return sendJson(res, 200, post);
    }

    // API: Save post
    if (pathname === '/api/save' && req.method === 'POST') {
      const data = await readBodyJson(req);
      if (!data.slug || !data.rawMarkdown) {
        return sendJson(res, 400, { error: 'Missing slug or rawMarkdown' });
      }
      const result = savePostContent(data.collection || 'writing', data.slug, data.rawMarkdown);
      return sendJson(res, 200, result);
    }

    // API: Render Live Preview
    if (pathname === '/api/render' && req.method === 'POST') {
      const data = await readBodyJson(req);
      const html = renderFullArticleHtml(data.rawMarkdown || '', data.collection || 'writing', data.theme || 'system');
      return sendHtml(res, 200, html);
    }

    // API: Render Rich Diff Preview
    if (pathname === '/api/render-rich-diff' && req.method === 'POST') {
      const data = await readBodyJson(req);
      const collection = data.collection || 'writing';
      const slug = data.slug;
      let headMarkdown = data.headMarkdown;
      if (headMarkdown === undefined) {
        if (slug) {
          const relPath = path.join('portfolio', 'content', collection, `${slug}.md`);
          try {
            const proc = spawn('git', ['show', `HEAD:${relPath}`], { cwd: ROOT_DIR });
            let out = '';
            proc.stdout.on('data', d => { out += d.toString('utf8'); });
            await new Promise((resolve) => { proc.on('close', resolve); });
            headMarkdown = out;
          } catch {
            headMarkdown = '';
          }
        }
      }
      let rawMarkdown = data.rawMarkdown;
      if (rawMarkdown === undefined && slug) {
        const filePath = path.join(ROOT_DIR, 'portfolio', 'content', collection, `${slug}.md`);
        if (fs.existsSync(filePath)) {
          rawMarkdown = fs.readFileSync(filePath, 'utf8');
        }
      }
      const html = renderRichDiffArticleHtml(headMarkdown || '', rawMarkdown || '', collection, data.theme || 'system');
      return sendHtml(res, 200, html);
    }

    // API: Git HEAD Content
    if (pathname === '/api/git-head' && (req.method === 'GET' || req.method === 'POST')) {
      const collection = parsedUrl.searchParams.get('collection') || 'writing';
      const slug = parsedUrl.searchParams.get('slug');
      if (!slug) return sendJson(res, 400, { error: 'Missing slug parameter' });
      
      const relPath = path.join('portfolio', 'content', collection, `${slug}.md`);
      const proc = spawn('git', ['show', `HEAD:${relPath}`], { cwd: ROOT_DIR });
      let headOutput = '';
      proc.stdout.on('data', d => { headOutput += d.toString('utf8'); });
      proc.on('close', code => {
        sendJson(res, 200, {
          success: code === 0,
          headMarkdown: code === 0 ? headOutput : '',
          relPath
        });
      });
      return;
    }

function extractModelOutput(stdout) {
  if (!stdout) return '';
  const delimiter = /={40,}\n[^\n]+\n={40,}\n?/;
  const match = stdout.match(delimiter);
  if (match) {
    return stdout.slice(match.index + match[0].length).trim();
  }
  return stdout.split('\n')
    .filter(line => !line.startsWith('[*]') && !line.startsWith('[✓]'))
    .join('\n')
    .trim();
}

    // API: AI Voice Suggest / Edit (Selection)
    if (pathname === '/api/voice/suggest' && req.method === 'POST') {
      const data = await readBodyJson(req);
      const text = (data.text || '').trim();
      if (!text) return sendJson(res, 400, { error: 'No text provided for suggestion' });

      try {
        const rawOutput = await runLocalGemma('edit', ['-'], text);
        const cleanSuggestion = extractModelOutput(rawOutput);
        return sendJson(res, 200, {
          original: text,
          suggestion: cleanSuggestion,
          intent: data.intent || 'Voice rewrite'
        });
      } catch (err) {
        console.error('Voice suggest error:', err.message);
        return sendJson(res, 500, { error: `Local model error: ${err.message}` });
      }
    }

    // API: AI Full Voice Review
    if (pathname === '/api/voice/review' && req.method === 'POST') {
      const data = await readBodyJson(req);
      const text = (data.text || data.rawMarkdown || '').trim();
      if (!text) return sendJson(res, 400, { error: 'No text provided for review' });

      try {
        const rawOutput = await runLocalGemma('review', ['-'], text);
        const cleanReview = extractModelOutput(rawOutput);
        return sendJson(res, 200, { reviewText: cleanReview });
      } catch (err) {
        console.error('Voice review error:', err.message);
        return sendJson(res, 500, { error: `Local model error: ${err.message}` });
      }
    }

    // API: AI Headline Generator
    if (pathname === '/api/voice/headline' && req.method === 'POST') {
      const data = await readBodyJson(req);
      const topic = (data.topic || data.title || data.summary || '').trim();
      if (!topic) return sendJson(res, 400, { error: 'No topic provided for headlines' });

      try {
        const rawOutput = await runLocalGemma('headline', [topic]);
        const cleanOutput = extractModelOutput(rawOutput);
        const lines = cleanOutput.split('\n')
          .map(l => l.replace(/^[\d\.\-\*\s"\']+|["\']+$/g, '').trim())
          .filter(l => l.length > 5 && !l.toLowerCase().startsWith('here are'));
        return sendJson(res, 200, { headlines: lines, raw: cleanOutput });
      } catch (err) {
        console.error('Headline gen error:', err.message);
        return sendJson(res, 500, { error: `Local model error: ${err.message}` });
      }
    }

    // API: Git & Session Diff
    if (pathname === '/api/git-diff' && (req.method === 'GET' || req.method === 'POST')) {
      const collection = parsedUrl.searchParams.get('collection') || 'writing';
      const slug = parsedUrl.searchParams.get('slug');
      if (!slug) return sendJson(res, 400, { error: 'Missing slug parameter' });
      
      const relPath = path.join('portfolio', 'content', collection, `${slug}.md`);
      
      // Get git diff against HEAD
      const proc = spawn('git', ['diff', 'HEAD', '--', relPath], { cwd: ROOT_DIR });
      let diffOutput = '';
      proc.stdout.on('data', d => { diffOutput += d.toString('utf8'); });
      proc.on('close', () => {
        sendJson(res, 200, {
          relPath,
          diff: diffOutput,
          hasChanges: diffOutput.trim().length > 0
        });
      });
      return;
    }

    // Default: Serve the Writer Studio SPA
    if (pathname === '/' || pathname === '/index.html') {
      return sendHtml(res, 200, getWriterAppHtml());
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Client-Side Single Page Application (HTML/CSS/JS)
// ---------------------------------------------------------------------------

function getWriterAppHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fieldwork Writer & Copywriting Studio</title>
  <style>
    :root {
      --bg: #090d16;
      --bg-panel: #0d1322;
      --bg-card: #131b2e;
      --surface: #17223b;
      --surface-hover: #1f2d4d;
      --border: #233152;
      --border-focus: #3b82f6;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-faint: #64748b;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --accent-ink: #60a5fa;
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.15);
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.15);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.15);
      --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-ui);
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Bar */
    header.app-header {
      height: 54px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      gap: 1rem;
      flex-shrink: 0;
      z-index: 30;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo-badge {
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: -0.02em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .logo-badge .spark {
      color: var(--accent);
      font-size: 1.1rem;
    }
    .ml-status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: var(--surface);
      color: var(--green);
      border: 1px solid var(--border);
    }
    .ml-status .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
    }

    .post-nav {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex: 1;
      max-width: 480px;
    }
    .post-select {
      background: var(--bg-card);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
      width: 100%;
      outline: none;
    }
    .post-select:focus { border-color: var(--border-focus); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stats-pill {
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      background: var(--surface);
      border-radius: 4px;
      white-space: nowrap;
    }
    .save-status {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }
    .save-status.unsaved { color: var(--amber); }
    .save-status.saving { color: var(--accent); }
    .save-status.saved { color: var(--green); }

    button.btn {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.35rem 0.75rem;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    button.btn:hover { background: var(--surface-hover); border-color: var(--accent); }
    button.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    button.btn-primary:hover { background: var(--accent-hover); }
    button.btn-success { background: var(--green); color: #fff; border-color: var(--green); }
    button.btn-sm { padding: 0.2rem 0.5rem; font-size: 0.75rem; }

    /* Main Workspace Split Layout */
    .workspace {
      display: grid;
      grid-template-columns: 1fr 1fr;
      flex: 1;
      height: calc(100vh - 54px);
      overflow: hidden;
    }

    /* Left Pane: Editor & AI Ribbons */
    .editor-pane {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border);
      background: var(--bg-panel);
      height: 100%;
      min-height: 0;
      min-width: 0;
      position: relative;
    }

    /* AI Tools Action Bar */
    .ai-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .ai-btn-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Editor Text Area Container */
    .editor-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    textarea#raw-editor {
      flex: 1;
      width: 100%;
      height: 100%;
      background: var(--bg-panel);
      color: #e2e8f0;
      font-family: var(--font-mono);
      font-size: 0.92rem;
      line-height: 1.6;
      padding: 1.25rem 1.5rem;
      border: none;
      resize: none;
      outline: none;
      white-space: pre-wrap;
      word-break: break-word;
      tab-size: 2;
    }

    /* Inline Suggestion Diff Card */
    .suggestion-card {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--accent);
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.2);
      padding: 1rem;
      z-index: 20;
      display: none;
      animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .sug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      font-size: 0.8rem;
    }
    .sug-title {
      font-weight: 600;
      color: var(--accent-ink);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .sug-body {
      font-family: var(--font-ui);
      font-size: 0.9rem;
      line-height: 1.5;
      background: var(--bg-panel);
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border);
      margin-bottom: 0.75rem;
      max-height: 180px;
      overflow-y: auto;
    }
    .sug-del {
      background: var(--red-bg);
      color: #fca5a5;
      text-decoration: line-through;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }
    .sug-ins {
      background: var(--green-bg);
      color: #86efac;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-weight: 500;
    }
    .sug-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Review & Headlines Modal / Drawer */
    .drawer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(4px);
      z-index: 25;
      display: none;
      flex-direction: column;
      padding: 1.5rem;
    }
    .drawer-content {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .drawer-header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface);
    }
    .drawer-title { font-weight: 600; font-size: 0.95rem; }
    .drawer-body {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .critique-card {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.88rem;
      line-height: 1.5;
    }
    .critique-card.warning { border-left: 3px solid var(--amber); }
    .critique-card.error { border-left: 3px solid var(--red); }
    .critique-card.success { border-left: 3px solid var(--green); }
    .headline-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.6rem 0.85rem;
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .headline-item:hover { border-color: var(--accent); }

    /* Right Pane: Live Rendered Preview */
    .preview-pane {
      display: flex;
      flex-direction: column;
      background: var(--bg);
      height: 100%;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }
    .preview-toolbar {
      height: 40px;
      flex-shrink: 0;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
    }
    .device-switcher {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .device-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .device-btn.active {
      background: var(--surface);
      color: var(--text);
      border-color: var(--border);
    }
    .preview-frame-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: stretch;
      background: #000;
      overflow: hidden;
      min-height: 0;
      padding: 0;
      transition: all 0.2s ease;
    }
    .preview-frame-container.mobile {
      padding: 1.5rem;
    }
    .preview-frame-container.mobile iframe {
      width: 375px;
      height: 667px;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      border: 2px solid var(--border);
    }
    .preview-frame-container.tablet {
      padding: 1.5rem;
    }
    .preview-frame-container.tablet iframe {
      width: 768px;
      height: 100%;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      border: 2px solid var(--border);
    }
    iframe#preview-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: #faf9f6;
    }

    /* Diff View Container */
    .diff-view-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
      overflow: hidden;
      min-height: 0;
      height: calc(100% - 40px);
    }
    .diff-header {
      padding: 0.6rem 1rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      flex-shrink: 0;
    }
    .diff-body {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      overflow-x: auto;
      min-height: 0;
      max-height: 100%;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--text-muted);
    }
    .diff-body::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .diff-body::-webkit-scrollbar-track {
      background: var(--bg-panel);
    }
    .diff-body::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }
    .diff-body::-webkit-scrollbar-thumb:hover {
      background: var(--text-faint);
    }
    .diff-line-add {
      background: rgba(34, 197, 94, 0.15);
      color: #86efac;
      display: block;
      padding: 0 0.5rem;
      border-left: 3px solid #22c55e;
    }
    .diff-line-del {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      display: block;
      padding: 0 0.5rem;
      border-left: 3px solid #ef4444;
      text-decoration: line-through;
    }
    .diff-line-hunk {
      color: var(--accent-ink);
      font-weight: 600;
      background: var(--surface);
      display: block;
      padding: 0.2rem 0.5rem;
      margin: 0.4rem 0 0.2rem 0;
      border-radius: 4px;
    }
    .diff-line-ctx {
      display: block;
      padding: 0 0.5rem;
      color: #cbd5e1;
    }
    .mode-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      border-radius: 4px;
      padding: 0.2rem 0.6rem;
      font-size: 0.78rem;
      cursor: pointer;
      font-weight: 500;
    }
    .mode-btn.active {
      background: var(--accent);
      color: #fff;
    }

    /* Loading Spinner */
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Top Header Navigation -->
  <header class="app-header">
    <div class="brand-section">
      <div class="logo-badge">
        <span class="spark">✦</span> Fieldwork Writer
      </div>
      <div class="ml-status" title="Running local fine-tuned LoRA on Apple Silicon Metal">
        <span class="dot"></span> Gemma 4 Metal
      </div>
    </div>

    <div class="post-nav">
      <select id="post-select" class="post-select">
        <option value="">Loading posts...</option>
      </select>
    </div>

    <div class="header-actions">
      <span id="word-stats" class="stats-pill">0 words · 0 min</span>
      <span id="save-status" class="save-status saved">✓ Saved</span>
      <button id="save-btn" class="btn btn-primary" title="Save file to disk (Cmd+S)">
        💾 Save
      </button>
      <button id="theme-btn" class="btn btn-sm" title="Toggle dark/light preview">
        🌓 Theme
      </button>
    </div>
  </header>

  <!-- Workspace 2-Pane Split -->
  <div class="workspace">
    
    <!-- Left Pane: Editor -->
    <div class="editor-pane">
      
      <!-- AI & Linter Ribbon -->
      <div class="ai-toolbar">
        <div class="ai-btn-group">
          <button id="ai-edit-btn" class="btn btn-sm btn-primary" title="Rewrite selection with local Gemma 4 (Cmd+K)">
            ✨ Voice Edit Selection
          </button>
          <button id="ai-review-btn" class="btn btn-sm" title="Perform full draft voice & rubric critique">
            🔍 Full Review
          </button>
          <button id="ai-headline-btn" class="btn btn-sm" title="Generate thesis-driven headline variations">
            💡 Headlines
          </button>
        </div>
        <div class="ai-btn-group">
          <button id="lint-btn" class="btn btn-sm" title="Instant regex check for em-dashes and AI tells">
            ⚡ Quick Lint
          </button>
        </div>
      </div>

      <!-- Main Editor Container -->
      <div class="editor-container">
        <textarea id="raw-editor" spellcheck="false" placeholder="Select a post to start editing..."></textarea>
        
        <!-- Inline Suggestion Diff Card -->
        <div id="suggestion-card" class="suggestion-card">
          <div class="sug-header">
            <span class="sug-title">✨ Local Gemma 4 Suggestion</span>
            <span id="sug-intent" style="color: var(--text-faint); font-size: 0.75rem;">Voice Rewrite</span>
          </div>
          <div id="sug-diff-view" class="sug-body"></div>
          <div class="sug-actions">
            <button id="sug-reject-btn" class="btn btn-sm">✕ Dismiss (Esc)</button>
            <button id="sug-accept-btn" class="btn btn-sm btn-success">✓ Accept & Replace (Cmd+Enter)</button>
          </div>
        </div>

        <!-- Full Review / Headlines Drawer -->
        <div id="drawer-overlay" class="drawer-overlay">
          <div class="drawer-content">
            <div class="drawer-header">
              <span id="drawer-title" class="drawer-title">Voice Review</span>
              <button id="drawer-close-btn" class="btn btn-sm">✕ Close</button>
            </div>
            <div id="drawer-body" class="drawer-body"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Pane: Live Site Preview & Diff Viewer -->
    <div class="preview-pane">
      <div class="preview-toolbar">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button id="mode-preview-btn" class="mode-btn active">👁️ Live Preview</button>
          <button id="mode-rich-diff-btn" class="mode-btn">✨ Rich Diff</button>
          <button id="mode-diff-btn" class="mode-btn">📑 Git Diff</button>
        </div>
        <div id="device-switcher" class="device-switcher">
          <button class="device-btn active" data-device="desktop">💻 Desktop</button>
          <button class="device-btn" data-device="tablet">📱 Tablet</button>
          <button class="device-btn" data-device="mobile">📱 Mobile</button>
        </div>
      </div>
      <div id="frame-container" class="preview-frame-container">
        <iframe id="preview-frame" title="Live Article Preview"></iframe>
      </div>
      <div id="diff-view-container" class="diff-view-container" style="display: none;">
        <div class="diff-header">
          <span id="diff-stats-badge" style="font-weight: 600; color: var(--accent-ink);">Git Diff vs HEAD</span>
          <div style="display: flex; gap: 0.4rem;">
            <button id="diff-refresh-btn" class="btn btn-sm">🔄 Refresh Diff</button>
            <button id="diff-copy-btn" class="btn btn-sm">📋 Copy Diff</button>
          </div>
        </div>
        <div id="diff-body" class="diff-body">Select a post to view git diff...</div>
      </div>
    </div>

  </div>

  <script>
    // -----------------------------------------------------------------------
    // State & DOM Elements
    // -----------------------------------------------------------------------
    let currentPost = null;
    let originalRawMarkdown = '';
    let isDirty = false;
    let previewTheme = 'light';
    let activeSuggestion = null;
    let renderDebounceTimer = null;
    let activeViewMode = 'preview'; // 'preview' | 'rich-diff' | 'diff'
    let lastFetchedDiff = '';

    const postSelect = document.getElementById('post-select');
    const rawEditor = document.getElementById('raw-editor');
    const previewFrame = document.getElementById('preview-frame');
    const frameContainer = document.getElementById('frame-container');
    const diffViewContainer = document.getElementById('diff-view-container');
    const diffStatsBadge = document.getElementById('diff-stats-badge');
    const diffBody = document.getElementById('diff-body');
    const diffRefreshBtn = document.getElementById('diff-refresh-btn');
    const diffCopyBtn = document.getElementById('diff-copy-btn');
    const modePreviewBtn = document.getElementById('mode-preview-btn');
    const modeRichDiffBtn = document.getElementById('mode-rich-diff-btn');
    const modeDiffBtn = document.getElementById('mode-diff-btn');
    const deviceSwitcher = document.getElementById('device-switcher');
    const saveBtn = document.getElementById('save-btn');
    const saveStatus = document.getElementById('save-status');
    const wordStats = document.getElementById('word-stats');
    const themeBtn = document.getElementById('theme-btn');
    const aiEditBtn = document.getElementById('ai-edit-btn');
    const aiReviewBtn = document.getElementById('ai-review-btn');
    const aiHeadlineBtn = document.getElementById('ai-headline-btn');
    const lintBtn = document.getElementById('lint-btn');
    const suggestionCard = document.getElementById('suggestion-card');
    const sugDiffView = document.getElementById('sug-diff-view');
    const sugAcceptBtn = document.getElementById('sug-accept-btn');
    const sugRejectBtn = document.getElementById('sug-reject-btn');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerBody = document.getElementById('drawer-body');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    // -----------------------------------------------------------------------
    // Initialization & Data Loading
    // -----------------------------------------------------------------------
    function syncUrlParams() {
      if (!currentPost) return;
      const url = new URL(window.location.href);
      url.searchParams.set('collection', currentPost.collection);
      url.searchParams.set('slug', currentPost.slug);
      if (activeViewMode && activeViewMode !== 'preview') {
        url.searchParams.set('mode', activeViewMode);
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    async function loadPosts() {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        postSelect.innerHTML = '';
        
        const urlParams = new URLSearchParams(window.location.search);
        const targetSlug = (urlParams.get('slug') || urlParams.get('post') || urlParams.get('article') || urlParams.get('id') || '').trim().toLowerCase();
        const targetCollection = (urlParams.get('collection') || '').trim().toLowerCase();
        const targetMode = (urlParams.get('mode') || '').trim().toLowerCase();

        let selectedIndex = -1;

        // 1. Exact match on collection + slug
        if (targetSlug && targetCollection) {
          selectedIndex = data.posts.findIndex(p => 
            p.collection.toLowerCase() === targetCollection && 
            p.slug.toLowerCase() === targetSlug
          );
        }

        // 2. Exact match on slug across any collection
        if (selectedIndex === -1 && targetSlug) {
          selectedIndex = data.posts.findIndex(p => p.slug.toLowerCase() === targetSlug);
        }

        // 3. Partial substring match on slug
        if (selectedIndex === -1 && targetSlug) {
          selectedIndex = data.posts.findIndex(p => p.slug.toLowerCase().includes(targetSlug));
        }

        // 4. Default: Prefer the slop post if no target requested
        if (selectedIndex === -1 && !targetSlug) {
          selectedIndex = data.posts.findIndex(p => p.slug.includes('slop'));
        }

        // 5. Fallback: First item in list
        if (selectedIndex === -1 && data.posts.length > 0) {
          selectedIndex = 0;
        }

        data.posts.forEach((p, idx) => {
          const opt = document.createElement('option');
          opt.value = JSON.stringify({ collection: p.collection, slug: p.slug });
          opt.textContent = \`[\${p.collection}] \${p.title} (\${p.wordCount}w)\`;
          if (idx === selectedIndex) {
            opt.selected = true;
          }
          postSelect.appendChild(opt);
        });

        if (targetMode && ['preview', 'rich-diff', 'diff'].includes(targetMode)) {
          activeViewMode = targetMode;
          modePreviewBtn.classList.toggle('active', targetMode === 'preview');
          modeRichDiffBtn.classList.toggle('active', targetMode === 'rich-diff');
          modeDiffBtn.classList.toggle('active', targetMode === 'diff');
          if (targetMode === 'diff') {
            frameContainer.style.display = 'none';
            deviceSwitcher.style.display = 'none';
            diffViewContainer.style.display = 'flex';
          } else {
            frameContainer.style.display = 'flex';
            deviceSwitcher.style.display = 'flex';
            diffViewContainer.style.display = 'none';
          }
        }

        if (postSelect.value) {
          loadSelectedPost();
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
      }
    }

    async function loadSelectedPost() {
      if (!postSelect.value) return;
      const { collection, slug } = JSON.parse(postSelect.value);
      
      try {
        const res = await fetch(\`/api/post?collection=\${collection}&slug=\${slug}\`);
        const data = await res.json();
        currentPost = data;
        originalRawMarkdown = data.rawMarkdown;
        rawEditor.value = data.rawMarkdown;
        isDirty = false;
        updateSaveStatus('saved');
        updateStats();
        syncUrlParams();

        if (activeViewMode === 'rich-diff') {
          triggerRichDiffPreview();
        } else if (activeViewMode === 'diff') {
          renderGitDiff();
        } else {
          triggerLivePreview();
        }
      } catch (err) {
        console.error('Failed to load post content:', err);
      }
    }

    // -----------------------------------------------------------------------
    // Live Preview & Rich Diff Rendering (Debounced)
    // -----------------------------------------------------------------------
    function triggerLivePreview() {
      clearTimeout(renderDebounceTimer);
      renderDebounceTimer = setTimeout(async () => {
        if (!currentPost) return;
        try {
          const res = await fetch('/api/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rawMarkdown: rawEditor.value,
              collection: currentPost.collection,
              slug: currentPost.slug,
              theme: previewTheme
            })
          });
          const html = await res.text();
          previewFrame.srcdoc = html;
        } catch (err) {
          console.error('Preview render error:', err);
        }
      }, 30);
    }

    let richDiffDebounceTimer = null;
    function triggerRichDiffPreview() {
      clearTimeout(richDiffDebounceTimer);
      richDiffDebounceTimer = setTimeout(async () => {
        if (!currentPost) return;
        try {
          const res = await fetch('/api/render-rich-diff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rawMarkdown: rawEditor.value,
              collection: currentPost.collection,
              slug: currentPost.slug,
              theme: previewTheme
            })
          });
          const html = await res.text();
          previewFrame.srcdoc = html;
        } catch (err) {
          console.error('Rich diff render error:', err);
        }
      }, 30);
    }

    // -----------------------------------------------------------------------
    // Stats & Save Management
    // -----------------------------------------------------------------------
    function updateStats() {
      const text = rawEditor.value;
      const body = text.replace(/^---[\\s\\S]*?---\\n*/, '');
      const words = body.trim().split(/\\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.ceil(words / 225));
      wordStats.textContent = \`\${words.toLocaleString()} words · \${mins} min\`;
    }

    function updateSaveStatus(status) {
      if (status === 'saved') {
        saveStatus.className = 'save-status saved';
        saveStatus.textContent = '✓ Saved';
        isDirty = false;
      } else if (status === 'unsaved') {
        saveStatus.className = 'save-status unsaved';
        saveStatus.textContent = '● Unsaved changes';
        isDirty = true;
      } else if (status === 'saving') {
        saveStatus.className = 'save-status saving';
        saveStatus.innerHTML = '<span class="spinner"></span> Saving...';
      }
    }

    async function saveCurrentPost() {
      if (!currentPost) return;
      updateSaveStatus('saving');
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: currentPost.collection,
            slug: currentPost.slug,
            rawMarkdown: rawEditor.value
          })
        });
        const data = await res.json();
        if (data.success) {
          originalRawMarkdown = rawEditor.value;
          updateSaveStatus('saved');
        } else {
          alert('Save failed: ' + (data.error || 'Unknown error'));
          updateSaveStatus('unsaved');
        }
      } catch (err) {
        console.error('Save error:', err);
        alert('Save failed: ' + err.message);
        updateSaveStatus('unsaved');
      }
    }

    // -----------------------------------------------------------------------
    // AI Voice Operations
    // -----------------------------------------------------------------------
    async function handleVoiceEditSelection() {
      const start = rawEditor.selectionStart;
      const end = rawEditor.selectionEnd;
      const selectedText = rawEditor.value.slice(start, end).trim();

      if (!selectedText) {
        alert('Please select a sentence, paragraph, or phrase in the editor first.');
        rawEditor.focus();
        return;
      }

      aiEditBtn.disabled = true;
      aiEditBtn.innerHTML = '<span class="spinner"></span> Thinking...';

      try {
        const res = await fetch('/api/voice/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: selectedText })
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        activeSuggestion = {
          start,
          end,
          original: selectedText,
          replacement: data.suggestion
        };

        showSuggestionDiff(selectedText, data.suggestion);
      } catch (err) {
        console.error('Voice edit failed:', err);
        alert('Voice edit failed: ' + err.message);
      } finally {
        aiEditBtn.disabled = false;
        aiEditBtn.innerHTML = '✨ Voice Edit Selection';
      }
    }

    function showSuggestionDiff(original, replacement) {
      sugDiffView.innerHTML = \`
        <div style="margin-bottom: 0.4rem;"><strong style="color: var(--text-faint); font-size: 0.75rem;">ORIGINAL:</strong><br><span class="sug-del">\${escapeHtml(original)}</span></div>
        <div><strong style="color: var(--text-faint); font-size: 0.75rem;">SUGGESTION:</strong><br><span class="sug-ins">\${escapeHtml(replacement)}</span></div>
      \`;
      suggestionCard.style.display = 'block';
    }

    function acceptSuggestion() {
      if (!activeSuggestion) return;
      const { start, end, replacement } = activeSuggestion;
      const text = rawEditor.value;
      rawEditor.value = text.slice(0, start) + replacement + text.slice(end);
      
      suggestionCard.style.display = 'none';
      activeSuggestion = null;
      updateSaveStatus('unsaved');
      updateStats();
      triggerLivePreview();
      rawEditor.focus();
      rawEditor.setSelectionRange(start, start + replacement.length);
    }

    function rejectSuggestion() {
      suggestionCard.style.display = 'none';
      activeSuggestion = null;
      rawEditor.focus();
    }

    async function handleFullVoiceReview() {
      aiReviewBtn.disabled = true;
      aiReviewBtn.innerHTML = '<span class="spinner"></span> Reviewing...';

      try {
        const res = await fetch('/api/voice/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawMarkdown: rawEditor.value })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        drawerTitle.textContent = 'Voice & Rubric Review Findings';
        drawerBody.innerHTML = \`
          <div class="critique-card" style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.82rem;">\${escapeHtml(data.reviewText)}</div>
        \`;
        drawerOverlay.style.display = 'flex';
      } catch (err) {
        console.error('Review failed:', err);
        alert('Review failed: ' + err.message);
      } finally {
        aiReviewBtn.disabled = false;
        aiReviewBtn.innerHTML = '🔍 Full Review';
      }
    }

    async function handleHeadlineGenerator() {
      aiHeadlineBtn.disabled = true;
      aiHeadlineBtn.innerHTML = '<span class="spinner"></span> Generating...';

      try {
        const text = rawEditor.value;
        const titleMatch = text.match(/title:\\s*"?([^"\\n]+)"?/);
        const topic = titleMatch ? titleMatch[1] : (currentPost?.title || 'Portfolio Note');

        const res = await fetch('/api/voice/headline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        drawerTitle.textContent = 'Thesis-Driven Headline Ideas';
        drawerBody.innerHTML = '';

        data.headlines.forEach(hl => {
          const div = document.createElement('div');
          div.className = 'headline-item';
          div.innerHTML = \`
            <span>\${escapeHtml(hl)}</span>
            <button class="btn btn-sm btn-primary">Apply as Title</button>
          \`;
          div.querySelector('button').addEventListener('click', () => {
            applyHeadline(hl);
            drawerOverlay.style.display = 'none';
          });
          drawerBody.appendChild(div);
        });

        drawerOverlay.style.display = 'flex';
      } catch (err) {
        console.error('Headlines failed:', err);
        alert('Headline generator failed: ' + err.message);
      } finally {
        aiHeadlineBtn.disabled = false;
        aiHeadlineBtn.innerHTML = '💡 Headlines';
      }
    }

    function applyHeadline(newTitle) {
      let text = rawEditor.value;
      if (text.includes('title:')) {
        text = text.replace(/title:\\s*("?[^"\\n]+"?)?/, \`title: "\${newTitle}"\`);
      }
      rawEditor.value = text;
      updateSaveStatus('unsaved');
      triggerLivePreview();
    }

    function handleQuickLint() {
      const text = rawEditor.value;
      const issues = [];

      // Em-dash check
      const emDashCount = (text.match(/—/g) || []).length;
      if (emDashCount > 0) {
        issues.push({
          type: 'error',
          title: \`Found \${emDashCount} em-dash(es) (—)\`,
          desc: 'Ryan\\'s voice rules strictly forbid em-dashes. Use a colon (:), parentheses, or split into two sentences.'
        });
      }

      // Hype words
      const hypeList = ['delighted to share', 'pleased to announce', 'game-changer', 'game changing', 'seamlessly', 'revolutionary', 'unlock', 'delve', 'testament', 'beacon', 'robust solution'];
      hypeList.forEach(w => {
        const regex = new RegExp(\`\\\\b\${w}\\\\b\`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          issues.push({
            type: 'warning',
            title: \`Banned AI Hype Phrase: "\${w}" (\${matches.length}x)\`,
            desc: 'Replace marketing hype with concrete facts, mechanisms, and measured outcomes.'
          });
        }
      });

      // Passive voice tell
      const passiveMatches = text.match(/\\b(was|were|been)\\s+(deployed|built|shipped|implemented)\\s+by\\b/gi);
      if (passiveMatches) {
        issues.push({
          type: 'warning',
          title: \`Passive Voice for Own Work: \${passiveMatches.join(', ')}\`,
          desc: 'Use active first-person phrasing: "I deployed...", "We shipped...".'
        });
      }

      drawerTitle.textContent = \`Quick Voice Lint (\${issues.length} issue\${issues.length === 1 ? '' : 's'})\`;
      drawerBody.innerHTML = '';

      if (issues.length === 0) {
        drawerBody.innerHTML = '<div class="critique-card success">✓ Clean pass! No em-dashes, stock AI phrases, or obvious passive tells detected.</div>';
      } else {
        issues.forEach(iss => {
          const card = document.createElement('div');
          card.className = \`critique-card \${iss.type}\`;
          card.innerHTML = \`<strong>\${escapeHtml(iss.title)}</strong><p style="margin-top:0.25rem; color:var(--text-muted);">\${escapeHtml(iss.desc)}</p>\`;
          drawerBody.appendChild(card);
        });
      }

      drawerOverlay.style.display = 'flex';
    }

    // -----------------------------------------------------------------------
    // Event Listeners & Keyboard Shortcuts
    // -----------------------------------------------------------------------
    postSelect.addEventListener('change', loadSelectedPost);

    rawEditor.addEventListener('input', () => {
      updateSaveStatus('unsaved');
      updateStats();
      if (activeViewMode === 'rich-diff') {
        triggerRichDiffPreview();
      } else if (activeViewMode === 'preview') {
        triggerLivePreview();
      }
    });

    saveBtn.addEventListener('click', saveCurrentPost);

    themeBtn.addEventListener('click', () => {
      previewTheme = previewTheme === 'light' ? 'dark' : 'light';
      previewFrame.contentWindow.postMessage({ type: 'set-theme', theme: previewTheme }, '*');
    });

    aiEditBtn.addEventListener('click', handleVoiceEditSelection);
    aiReviewBtn.addEventListener('click', handleFullVoiceReview);
    aiHeadlineBtn.addEventListener('click', handleHeadlineGenerator);
    lintBtn.addEventListener('click', handleQuickLint);
    sugAcceptBtn.addEventListener('click', acceptSuggestion);
    sugRejectBtn.addEventListener('click', rejectSuggestion);
    drawerCloseBtn.addEventListener('click', () => { drawerOverlay.style.display = 'none'; });

    // Device switchers
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dev = btn.dataset.device;
        frameContainer.className = 'preview-frame-container ' + dev;
      });
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentPost();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleVoiceEditSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (activeSuggestion) {
          e.preventDefault();
          acceptSuggestion();
        }
      }
      if (e.key === 'Escape') {
        if (activeSuggestion) {
          rejectSuggestion();
        }
        if (drawerOverlay.style.display === 'flex') {
          drawerOverlay.style.display = 'none';
        }
      }
    });

    // Handle Tab in textarea
    rawEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = rawEditor.selectionStart;
        const end = rawEditor.selectionEnd;
        rawEditor.value = rawEditor.value.substring(0, start) + '  ' + rawEditor.value.substring(end);
        rawEditor.selectionStart = rawEditor.selectionEnd = start + 2;
        updateSaveStatus('unsaved');
        triggerLivePreview();
      }
    });

    // Jump to line from iframe click
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'jump-to-line') {
        const line = e.data.line;
        const lines = rawEditor.value.split('\\n');
        let charIndex = 0;
        for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
          charIndex += lines[i].length + 1;
        }
        rawEditor.focus();
        rawEditor.setSelectionRange(charIndex, charIndex + (lines[line - 1] || '').length);
      }
    });

    // -----------------------------------------------------------------------
    // Diff Rendering & Mode Switching
    // -----------------------------------------------------------------------
    async function renderGitDiff() {
      if (!currentPost) return;
      diffBody.innerHTML = '<span class="spinner"></span> Loading git diff...';
      try {
        const res = await fetch(\`/api/git-diff?collection=\${currentPost.collection}&slug=\${currentPost.slug}\`);
        const data = await res.json();
        lastFetchedDiff = data.diff || '';

        if (!data.hasChanges || !lastFetchedDiff.trim()) {
          diffStatsBadge.textContent = 'Git Status: Clean (0 diffs)';
          diffBody.innerHTML = '<div class="critique-card success" style="margin-top: 1rem;">✓ Working tree matches git HEAD for this file (no uncommitted diffs).</div>';
          return;
        }

        const lines = lastFetchedDiff.split('\\n');
        let adds = 0;
        let dels = 0;
        const formatted = lines.map(line => {
          if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) {
            return \`<span class="diff-line-hunk">\${escapeHtml(line)}</span>\`;
          } else if (line.startsWith('@@')) {
            return \`<span class="diff-line-hunk">\${escapeHtml(line)}</span>\`;
          } else if (line.startsWith('+')) {
            adds += 1;
            return \`<span class="diff-line-add">\${escapeHtml(line)}</span>\`;
          } else if (line.startsWith('-')) {
            dels += 1;
            return \`<span class="diff-line-del">\${escapeHtml(line)}</span>\`;
          } else {
            return \`<span class="diff-line-ctx">\${escapeHtml(line)}</span>\`;
          }
        }).join('');

        diffStatsBadge.textContent = \`Git Diff: +\${adds} / -\${dels} lines modified\`;
        diffBody.innerHTML = formatted;
      } catch (err) {
        console.error('Git diff error:', err);
        diffBody.innerHTML = \`<div class="critique-card error">Failed to load git diff: \${escapeHtml(err.message)}</div>\`;
      }
    }

    function setViewMode(mode) {
      activeViewMode = mode;
      modePreviewBtn.classList.toggle('active', mode === 'preview');
      modeRichDiffBtn.classList.toggle('active', mode === 'rich-diff');
      modeDiffBtn.classList.toggle('active', mode === 'diff');
      syncUrlParams();

      if (mode === 'preview') {
        frameContainer.style.display = 'flex';
        deviceSwitcher.style.display = 'flex';
        diffViewContainer.style.display = 'none';
        triggerLivePreview();
      } else if (mode === 'rich-diff') {
        frameContainer.style.display = 'flex';
        deviceSwitcher.style.display = 'flex';
        diffViewContainer.style.display = 'none';
        triggerRichDiffPreview();
      } else {
        frameContainer.style.display = 'none';
        deviceSwitcher.style.display = 'none';
        diffViewContainer.style.display = 'flex';
        renderGitDiff();
      }
    }

    modePreviewBtn.addEventListener('click', () => setViewMode('preview'));
    modeRichDiffBtn.addEventListener('click', () => setViewMode('rich-diff'));
    modeDiffBtn.addEventListener('click', () => setViewMode('diff'));
    diffRefreshBtn.addEventListener('click', renderGitDiff);
    diffCopyBtn.addEventListener('click', () => {
      if (!lastFetchedDiff) return alert('No diff to copy.');
      navigator.clipboard.writeText(lastFetchedDiff).then(() => {
        const orig = diffCopyBtn.textContent;
        diffCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => { diffCopyBtn.textContent = orig; }, 1500);
      });
    });

    window.addEventListener('popstate', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetSlug = (urlParams.get('slug') || urlParams.get('post') || urlParams.get('article') || '').trim().toLowerCase();
      const targetCollection = (urlParams.get('collection') || '').trim().toLowerCase();
      const targetMode = (urlParams.get('mode') || 'preview').trim().toLowerCase();

      if (targetSlug) {
        for (let i = 0; i < postSelect.options.length; i++) {
          try {
            const val = JSON.parse(postSelect.options[i].value);
            if (val.slug.toLowerCase() === targetSlug && (!targetCollection || val.collection.toLowerCase() === targetCollection)) {
              if (postSelect.selectedIndex !== i) {
                postSelect.selectedIndex = i;
                loadSelectedPost();
              }
              break;
            }
          } catch {}
        }
      }

      if (targetMode && targetMode !== activeViewMode && ['preview', 'rich-diff', 'diff'].includes(targetMode)) {
        setViewMode(targetMode);
      }
    });

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Start
    loadPosts();
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Server Start
// ---------------------------------------------------------------------------

server.listen(PORT, () => {
  console.log(`\n[Fieldwork Writer] Copywriting & Live Preview Studio running at:`);
  console.log(`  -> http://localhost:${PORT}/\n`);
  console.log(`[Fieldwork Writer] Watching content at: ${CONTENT_DIR}`);
});
