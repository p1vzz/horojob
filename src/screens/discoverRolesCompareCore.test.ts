import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDiscoverRoleCompareRows,
  normalizeDiscoverRoleCompareSelection,
  toggleDiscoverRoleCompareSelection,
} from './discoverRolesCompareCore';
import type { DiscoverRoleShortlistEntry } from '../utils/discoverRoleShortlistStorage';

function entry(slug: string, role: string): DiscoverRoleShortlistEntry {
  return {
    slug,
    role,
    domain: 'Product & Strategy',
    scoreLabel: '88%',
    scoreValue: 88,
    tags: ['strategy'],
    market: {
      query: { keyword: role, location: 'US' },
      occupation: {
        onetCode: null,
        socCode: null,
        title: role,
        description: null,
        matchConfidence: 'high',
      },
      salary: {
        currency: 'USD',
        period: 'annual',
        min: 110_000,
        max: 150_000,
        median: 130_000,
        year: '2024',
        confidence: 'high',
        basis: 'market_estimate',
      },
      outlook: {
        growthLabel: 'Bright outlook',
        projectedOpenings: 15_000,
        projectionYears: '2023-2033',
        demandLabel: 'high',
      },
      skills: [],
      labels: {
        marketScore: 'strong market',
        salaryVisibility: 'market_estimate',
      },
      sources: [],
    },
    detail: {
      whyFit: {
        summary: `${role} fits your profile.`,
        bullets: [`${role} uses strategy strengths.`],
        topTraits: ['Strategic'],
      },
      realityCheck: {
        summary: `${role} requires tradeoff-heavy execution.`,
        tasks: ['Align multiple stakeholders.'],
        workContext: ['Cross-functional work'],
        toolThemes: ['Planning tools'],
      },
      entryBarrier: {
        level: slug.includes('coordinator') ? 'accessible' : 'moderate',
        label: slug.includes('coordinator') ? 'Lower Entry Barrier' : 'Moderate Entry Barrier',
        summary: `${role} has a bounded entry ramp.`,
        signals: ['Evidence of ownership helps.'],
      },
      transitionMap: [
        {
          lane: 'best_match',
          label: 'Best Match',
          summary: `${role} is the cleanest adjacent move.`,
          role: {
            slug,
            title: role,
            domain: 'Product & Strategy',
            fitScore: 88,
            fitLabel: '88% fit',
            barrier: {
              level: slug.includes('coordinator') ? 'accessible' : 'moderate',
              label: slug.includes('coordinator') ? 'Lower Entry Barrier' : 'Moderate Entry Barrier',
            },
          },
        },
      ],
      bestAlternative: {
        headline: 'Lower-friction alternative',
        summary: `${role} may be easier to convert right now.`,
        reasons: ['It is easier to explain to hiring teams.'],
        role: {
          slug,
          title: role,
          domain: 'Product & Strategy',
          fitScore: 88,
          fitLabel: '88% fit',
          barrier: {
            level: slug.includes('coordinator') ? 'accessible' : 'moderate',
            label: slug.includes('coordinator') ? 'Lower Entry Barrier' : 'Moderate Entry Barrier',
          },
        },
      },
    },
    savedAt: '2026-04-24T00:00:00.000Z',
  };
}

test('toggle compare selection adds, removes, and rotates to keep only two roles', () => {
  assert.deepEqual(toggleDiscoverRoleCompareSelection([], 'a'), ['a']);
  assert.deepEqual(toggleDiscoverRoleCompareSelection(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleDiscoverRoleCompareSelection(['a', 'b'], 'c'), ['b', 'c']);
  assert.deepEqual(toggleDiscoverRoleCompareSelection(['a', 'b'], 'a'), ['b']);
});

test('normalize compare selection drops removed roles and duplicates', () => {
  assert.deepEqual(
    normalizeDiscoverRoleCompareSelection(['a', 'a', 'b', 'c'], ['b', 'c']),
    ['b', 'c'],
  );
});

test('build compare rows turns shortlist snapshots into compact compare cells', () => {
  const left = entry('product-manager', 'Product Manager');
  const right = entry('project-coordinator', 'Project Coordinator');

  const rows = buildDiscoverRoleCompareRows(left, right);

  assert.deepEqual(rows.map((row) => row.key), [
    'fit',
    'market',
    'entry_barrier',
    'reality',
    'transition',
  ]);
  assert.equal(rows[0]?.left.title, '88%');
  assert.match(rows[1]?.left.subtitle ?? '', /\$110k-\$150k/);
  assert.equal(rows[2]?.right.title, 'Lower Entry Barrier');
  assert.equal(rows[4]?.left.title, 'Best Match');
});
