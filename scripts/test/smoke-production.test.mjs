import assert from 'node:assert/strict';
import test from 'node:test';

import { expectedPublicAppNames } from '../lib/production-smoke.mjs';

const apps = [
  { name: 'fieldwork', path: '/' },
  { name: 'demo', path: '/demo/' },
];

test('production smoke expects the checked-out root app by default', () => {
  assert.deepEqual(expectedPublicAppNames(apps), ['demo', 'fieldwork']);
});

test('production smoke can verify a legacy root app during a parallel-service cutover', () => {
  assert.deepEqual(expectedPublicAppNames(apps, 'portfolio'), ['demo', 'portfolio']);
});

test('production smoke rejects an ambiguous compatibility override', () => {
  assert.throws(
    () => expectedPublicAppNames([{ name: 'demo', path: '/demo/' }], 'portfolio'),
    /requires exactly one public root app/,
  );
});
