import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installAnalytics } from '../../demos/shared/analytics.mjs';

function withBrowser({ hostname = 'ryanbaumann.dev', search = '' }, run) {
  const appended = [];
  globalThis.window = {
    location: {
      hostname,
      origin: `https://${hostname}`,
      pathname: '/aqi-map/',
      search,
    },
  };
  globalThis.document = {
    readyState: 'complete',
    referrer: `https://${hostname}/demos/?private=value`,
    createElement: () => ({}),
    head: { appendChild: (node) => appended.push(node) },
  };
  try {
    run({ appended });
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
}

test('hosted demo analytics stays off outside the canonical host', () => {
  withBrowser({ hostname: 'localhost' }, ({ appended }) => {
    installAnalytics('G-TEST123');
    assert.deepEqual(appended, []);
    assert.equal(window.dataLayer, undefined);
  });
});

test('hosted demo analytics sends only sanitized page-view context', () => {
  withBrowser({ search: '?utm_source=Newsletter&utm_campaign=Launch&activity_id=private&utm_content=not%20allowed' }, ({ appended }) => {
    installAnalytics('G-TEST123');
    assert.equal(appended.length, 1);
    assert.equal(appended[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123');

    const calls = window.dataLayer.map((args) => [...args]);
    const pageView = calls.find(([scope, name]) => scope === 'event' && name === 'page_view');
    assert.deepEqual(pageView[2], {
      page_location: 'https://ryanbaumann.dev/aqi-map/',
      page_referrer: 'https://ryanbaumann.dev/demos/',
      campaign_source: 'newsletter',
      campaign_name: 'launch',
    });
    assert.doesNotMatch(JSON.stringify(calls), /activity_id|private|not allowed/);
  });
});
