import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeDiscoverRoleShortlistEntries,
  parseDiscoverRoleShortlistByUser,
  removeDiscoverRoleShortlistEntry,
  selectDiscoverRoleShortlistEntriesForSync,
  upsertDiscoverRoleShortlistEntry,
  type DiscoverRoleShortlistEntry,
} from './discoverRoleShortlistStorageCore';

function entry(slug: string, savedAt: string): DiscoverRoleShortlistEntry {
  return {
    slug,
    role: slug,
    domain: 'Data & Technology',
    scoreLabel: '88%',
    scoreValue: 88,
    tags: ['analysis'],
    market: null,
    detail: {
      whyFit: {
        summary: 'Strong analytical match.',
        bullets: ['Pattern recognition matters.'],
        topTraits: ['Analytical'],
      },
      realityCheck: {
        summary: 'Expect structured problem-solving.',
        tasks: ['Translate ambiguous problems into clear deliverables.'],
        workContext: ['Cross-functional work.'],
        toolThemes: ['Analytics tooling'],
      },
      entryBarrier: {
        level: 'moderate',
        label: 'Moderate Entry Barrier',
        summary: 'Adjacent proof usually helps.',
        signals: ['Portfolio or shipped work helps.'],
      },
      transitionMap: [
        {
          lane: 'best_match',
          label: 'Best Match',
          summary: 'The cleanest adjacent move from your fit profile.',
          role: {
            slug: 'operations-manager',
            title: 'Operations Manager',
            domain: 'Data & Technology',
            fitScore: 80,
            fitLabel: '80% fit',
            barrier: {
              level: 'moderate',
              label: 'Moderate Entry Barrier',
            },
          },
        },
      ],
      bestAlternative: {
        headline: 'Lower-friction alternative',
        summary: 'Operations Manager may be the stronger immediate bet.',
        reasons: ['Entry friction is lower than the current role.'],
        role: {
          slug: 'operations-manager',
          title: 'Operations Manager',
          domain: 'Data & Technology',
          fitScore: 80,
          fitLabel: '80% fit',
          barrier: {
            level: 'moderate',
            label: 'Moderate Entry Barrier',
          },
        },
      },
    },
    savedAt,
  };
}

test('discover role shortlist parser keeps valid rows sorted per user', () => {
  const parsed = parseDiscoverRoleShortlistByUser(JSON.stringify({
    userA: [
      entry('older', '2026-04-21T00:00:00.000Z'),
      { slug: '', role: 'Broken', savedAt: '2026-04-22T00:00:00.000Z' },
      entry('newer', '2026-04-22T00:00:00.000Z'),
    ],
  }));

  assert.deepEqual(parsed.userA?.map((item) => item.slug), ['newer', 'older']);
  assert.equal(parsed.userA?.[0]?.detail?.whyFit.topTraits[0], 'Analytical');
  assert.equal(parsed.userA?.[0]?.detail?.bestAlternative?.role.slug, 'operations-manager');
});

test('discover role shortlist upsert replaces existing role and remove deletes by slug', () => {
  const existing = [entry('product-manager', '2026-04-20T00:00:00.000Z')];
  const upserted = upsertDiscoverRoleShortlistEntry(
    existing,
    {
      slug: 'product-manager',
      role: 'Product Manager',
      domain: 'Product & Strategy',
      scoreLabel: '91%',
      scoreValue: 91,
      tags: ['strategy', 'execution', 'leadership', 'analytics', 'growth', 'roadmap', 'extra'],
      market: null,
      detail: entry('product-manager', '2026-04-22T00:00:00.000Z').detail,
    },
    '2026-04-22T00:00:00.000Z',
  );

  assert.equal(upserted.length, 1);
  assert.equal(upserted[0]?.role, 'Product Manager');
  assert.deepEqual(upserted[0]?.tags, ['strategy', 'execution', 'leadership', 'analytics', 'growth', 'roadmap']);
  assert.equal(upserted[0]?.detail?.entryBarrier.level, 'moderate');
  assert.equal(upserted[0]?.detail?.transitionMap[0]?.lane, 'best_match');
  assert.deepEqual(removeDiscoverRoleShortlistEntry(upserted, 'product-manager'), []);
});

test('discover role shortlist merge keeps newest entry per slug', () => {
  const merged = mergeDiscoverRoleShortlistEntries([
    entry('product-manager', '2026-04-20T00:00:00.000Z'),
    {
      ...entry('product-manager', '2026-04-22T00:00:00.000Z'),
      role: 'Product Manager',
    },
    entry('ux-researcher', '2026-04-21T00:00:00.000Z'),
  ]);

  assert.deepEqual(merged.map((item) => item.slug), ['product-manager', 'ux-researcher']);
  assert.equal(merged[0]?.role, 'Product Manager');
});

test('discover role shortlist sync selects only missing or newer local entries', () => {
  const remote = [entry('product-manager', '2026-04-20T00:00:00.000Z')];
  const local = [
    {
      ...entry('product-manager', '2026-04-21T00:00:00.000Z'),
      role: 'Product Manager',
    },
    entry('ux-researcher', '2026-04-22T00:00:00.000Z'),
  ];

  assert.deepEqual(
    selectDiscoverRoleShortlistEntriesForSync(local, remote).map((item) => item.slug),
    ['ux-researcher', 'product-manager'],
  );
});
