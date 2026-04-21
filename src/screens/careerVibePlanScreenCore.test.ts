import assert from 'node:assert/strict';
import test from 'node:test';
import type { CareerVibePlanResponse } from '../services/astrologyApi';
import {
  buildCareerVibeMetricRows,
  formatCareerVibePlanHeaderSubtitle,
  formatCareerVibePlanInlineError,
  formatCareerVibePlanMeta,
  normalizeCareerVibeList,
  resolveCareerVibePlanErrorMessage,
} from './careerVibePlanScreenCore';

const plan: CareerVibePlanResponse = {
  dateKey: '2026-04-14',
  cached: true,
  schemaVersion: 'career-vibe-plan-v1',
  tier: 'premium',
  narrativeSource: 'llm',
  narrativeStatus: 'ready',
  narrativeFailureCode: null,
  model: 'gpt-4o-mini',
  promptVersion: 'v1',
  generatedAt: '2026-04-14T08:30:00.000Z',
  staleAfter: '2026-04-15T00:00:00.000Z',
  modeLabel: 'Execution Mode',
  metrics: {
    energy: 102,
    focus: 77,
    luck: 63,
    opportunity: 63,
    aiSynergy: -4,
  },
  plan: {
    headline: 'Close the important loop',
    summary: 'Use the day for one focused delivery loop, then close with review.',
    primaryAction: 'Finish one meaningful deliverable before opening a second workstream.',
    bestFor: ['Deep work'],
    avoid: ['Skipping review'],
    peakWindow: '10-12 PM',
    focusStrategy: 'Use a protected block for the hardest output.',
    communicationStrategy: 'Batch outbound messages after the main block.',
    aiWorkStrategy: 'Use AI for structure and review prompts.',
    riskGuardrail: 'Keep one approval checkpoint.',
  },
  explanation: {
    drivers: [],
    cautions: [],
    metricNotes: [],
  },
  sources: {
    dailyTransitDateKey: '2026-04-14',
    aiSynergyDateKey: '2026-04-14',
    dailyVibeAlgorithmVersion: 'daily-vibe-v2',
    aiSynergyAlgorithmVersion: 'ai-synergy-v2',
  },
};

test('career vibe plan screen core clamps and labels metric rows', () => {
  const rows = buildCareerVibeMetricRows(plan.metrics);

  assert.deepEqual(
    rows.map((row) => [row.label, row.value]),
    [
      ['Energy', 100],
      ['Focus', 77],
      ['Opportunity', 63],
      ['AI Fit', 0],
    ],
  );
});

test('career vibe plan screen core formats meta from cache and narrative source', () => {
  const meta = formatCareerVibePlanMeta(plan);

  assert.match(meta, /Cached/);
  assert.match(meta, /Ready/);
  assert.match(meta, /Apr 14/);
  assert.match(formatCareerVibePlanHeaderSubtitle(plan, 'cache', true), /Saved on device/);
  assert.equal(formatCareerVibePlanHeaderSubtitle(plan, 'cache', false), "Today's saved work plan");
  assert.equal(formatCareerVibePlanHeaderSubtitle(plan, 'live', false), "Today's work plan");
  assert.equal(
    formatCareerVibePlanHeaderSubtitle({ ...plan, narrativeSource: null, narrativeStatus: 'failed', plan: null }, 'live', false),
    "Today's work plan is unavailable",
  );
});

test('career vibe plan screen core normalizes empty lists and API errors', () => {
  assert.deepEqual(normalizeCareerVibeList([' ', 'Deep work'], 'Fallback'), ['Deep work']);
  assert.deepEqual(normalizeCareerVibeList([], 'Fallback'), ['Fallback']);

  assert.equal(
    resolveCareerVibePlanErrorMessage({ status: 404 }),
    'Complete your birth profile first, then open Career Vibe again.',
  );
  assert.equal(
    resolveCareerVibePlanErrorMessage({ status: 502, payload: { error: 'Unable to build career vibe plan' } }),
    'Unable to build career vibe plan',
  );
  assert.equal(formatCareerVibePlanInlineError('Fresh plan did not sync.', 'cache', true), 'Fresh plan did not sync.');
  assert.equal(
    formatCareerVibePlanInlineError('Fresh plan did not sync.', 'cache', false),
    "Showing your saved plan while today's update is unavailable.",
  );
});
