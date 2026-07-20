export function expectedPublicAppNames(apps, rootAppCompatibilityName = '') {
  const rootApps = apps.filter((app) => app.path === '/');
  if (rootAppCompatibilityName && rootApps.length !== 1) {
    throw new Error(`ROOT_APP_COMPAT_NAME requires exactly one public root app, found ${rootApps.length}`);
  }

  return apps
    .map((app) => (rootAppCompatibilityName && app.path === '/' ? rootAppCompatibilityName : app.name))
    .sort();
}
