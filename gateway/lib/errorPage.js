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
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#e0e0e0}
.card{max-width:380px;width:100%;padding:2.5rem;border:1px solid #222;border-radius:12px;background:#111;text-align:center}
h1{font-size:1.2rem;margin-bottom:.75rem;color:#fff}
p{font-size:.9rem;color:#aaa;margin-bottom:1.5rem;line-height:1.5}
a{color:#4a9eff;font-size:.9rem;text-decoration:none}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="card">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(message)}</p>
<a href="/">&larr; Ryan Baumann</a>
</div>
</body>
</html>`;
}
