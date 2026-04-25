import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeDiscoverRoleMarketEntries,
  removeDiscoverRoleMarketEntry,
  upsertDiscoverRoleMarketEntry,
} from './discoverRolesMarketCore';
import type { DiscoverRoleShortlistEntry } from '../utils/discoverRoleShortlistStorage';

function entry(slug: string, role: string, scoreLabel = '88%'): DiscoverRoleShortlistEntry {
  return {
    slug,
    role,
    domain: 'Product & Strategy',
    scoreLabel,
    scoreValue: Number.parseInt(scoreLabel, 10),
    tags: ['strategy'],
    market: null,
    detail: null,
    savedAt: `2026-04-25T00:00:0${slug.length}.000Z`,
  };
}

test('mergeDiscoverRoleMarketEntries dedupes by slug and keeps first order', () => {
  const merged = mergeDiscoverRoleMarketEntries([
    entry('product-manager', 'Product Manager', '88%'),
    entry('operations-manager', 'Operations Manager', '84%'),
    entry('product-manager', 'Product Manager', '91%'),
  ]);

  assert.deepEqual(
    merged.map((item) => [item.slug, item.scoreLabel]),
    [
      ['product-manager', '91%'],
      ['operations-manager', '84%'],
    ],
  );
});

test('upsertDiscoverRoleMarketEntry prepends new roles when requested and updates existing roles in place', () => {
  const current = [entry('product-manager', 'Product Manager'), entry('operations-manager', 'Operations Manager')];

  const prepended = upsertDiscoverRoleMarketEntry(current, entry('data-analyst', 'Data Analyst'), {
    prependNew: true,
  });
  assert.deepEqual(prepended.map((item) => item.slug), ['data-analyst', 'product-manager', 'operations-manager']);

  const updated = upsertDiscoverRoleMarketEntry(prepended, entry('product-manager', 'Product Manager', '93%'));
  assert.deepEqual(updated.map((item) => [item.slug, item.scoreLabel]), [
    ['data-analyst', '88%'],
    ['product-manager', '93%'],
    ['operations-manager', '88%'],
  ]);
});

test('removeDiscoverRoleMarketEntry drops only the requested role', () => {
  const remaining = removeDiscoverRoleMarketEntry(
    [entry('product-manager', 'Product Manager'), entry('operations-manager', 'Operations Manager')],
    'product-manager',
  );

  assert.deepEqual(remaining.map((item) => item.slug), ['operations-manager']);
});
