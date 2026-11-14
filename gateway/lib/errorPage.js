// gateway/lib/errorPage.js
//
// Minimal, self-contained HTML shell for gateway-generated error responses
// (404 fallback, unconfigured/unbuilt private demos). Mirrors the dark,
// minimal visual style of lib/auth.js's loginPageHtml — same fonts, colors,
// and card layout — so an unbranded plain-text response is never what a
// visitor sees, even before the portfolio build's own 404.html exists.

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a minimal, self-contained HTML error page.
 *
 * @param {object} options
 * @param {string} options.title - Page title and heading.
 * @param {string} options.message - One-sentence, plain explanation.
 * @returns {string} Full HTML document.
 */
export function errorPageHtml({ title, message }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:light dark;--bg:#faf9f6;--surface:#ffffff;--ink:#111827;--muted:#4b5563;--line:#e5e7eb;--accent:#3b82f6;--accent-ink:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#030712;--surface:#111827;--ink:#f9fafb;--muted:#9ca3af;--line:#1f2937;--accent:#60a5fa;--accent-ink:#93c5fd}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:var(--bg);color:var(--ink)}
.card{max-width:400px;width:100%;padding:2.25rem;border:1px solid var(--line);border-radius:12px;background:var(--surface);text-align:center}
h1{font-size:1.3rem;letter-spacing:-.02em;margin-bottom:.65rem;color:var(--ink)}
p{font-size:.92rem;color:var(--muted);margin-bottom:1.25rem;line-height:1.55}
a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 .5rem;color:var(--accent-ink);font-size:.92rem;text-decoration:none}
a:hover{text-decoration:underline}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
</style>
</head>
<body>
<main class="card">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(message)}</p>
<a href="/">&larr; Back to Fieldwork</a>
</main>
</body>
</html>`;
}
