export const SERVER_SECRET_PATTERNS = [
  ['OAuth client secret value', /client_secret["']?\s*[:=]\s*["'][^"'\\\s]{12,}/i],
  ['PEM private key block', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['Stripe-style live secret key', /\bsk_live_[0-9A-Za-z]{16,}\b/],
  ['GitHub personal access token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['AWS access key ID', /\bAKIA[0-9A-Z]{16}\b/],
  ['AI provider secret key', /\bsk-(?:proj|ant)-[A-Za-z0-9_-]{20,}\b/],
  ['Resend API key', /\bre_[A-Za-z0-9]{24,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Mapbox secret token', /\bsk\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
  ['Personal webmail address in served asset', /[A-Za-z0-9._%+-]+@gmail\.com\b/i],
  ['Local machine home path', /\/(?:Users|home)\/(?!(?:you|user|username|runner|ubuntu|node|app|dev|example)\b)[A-Za-z0-9._-]+\//],
];

export function findServerSecretMarker(text) {
  return SERVER_SECRET_PATTERNS.find(([, pattern]) => pattern.test(text));
}

export function expectedPublicAppNames(apps, rootAppCompatibilityName = '') {
  const rootApps = apps.filter((app) => app.path === '/');
  if (rootAppCompatibilityName && rootApps.length !== 1) {
    throw new Error(`ROOT_APP_COMPAT_NAME requires exactly one public root app, found ${rootApps.length}`);
  }

  return apps
    .map((app) => (rootAppCompatibilityName && app.path === '/' ? rootAppCompatibilityName : app.name))
    .sort();
}
