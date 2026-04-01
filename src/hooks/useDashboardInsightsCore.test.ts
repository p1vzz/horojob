import assert from 'node:assert/strict';
import test from 'node:test';
import { createBurnoutPlan, createLunarPlan } from '../services/dashboardInsightSnapshots.test-helpers';
import {
  createDefaultDashboardInsightsState,
  resolveDashboardInsightsState,
  shouldFetchDashboardInsights,
} from './useDashboardInsightsCore';

test('dashboard insights core keeps frozen defaults for non-premium plans', () => {
  assert.equal(shouldFetchDashboardInsights('free'), false);
  assert.equal(shouldFetchDashboardInsights('premium'), true);

  const state = createDefaultDashboardInsightsState();
  assert.equal(state.burnout.source, 'preview');
  assert.equal(state.lunar.source, 'preview');
  assert.equal(state.burnout.snapshot.algorithmVersion, 'burnout-risk-v1');
  assert.equal(state.lunar.snapshot.algorithmVersion, 'lunar-productivity-risk-v1');
  assert.equal(state.burnout.isHydrating, false);
  assert.equal(state.lunar.lastSyncedAt, null);
});

test('dashboard insights core maps premium results into live snapshots', () => {
  const state = resolveDashboardInsightsState({
    plan: 'premium',
    burnoutResult: { status: 'fulfilled', value: createBurnoutPlan() },
    lunarResult: { status: 'fulfilled', value: createLunarPlan() },
    burnoutLastSyncedAt: '2026-03-31T08:45:00.000Z',
    lunarLastSyncedAt: '2026-03-31T08:46:00.000Z',
    referenceDate: new Date('2026-03-31T10:00:00.000Z'),
  });

  assert.equal(state.burnout.source, 'live');
  assert.equal(state.lunar.source, 'live');
  assert.equal(state.burnout.snapshot.score, 85);
  assert.equal(state.lunar.snapshot.score, 78);
  assert.equal(state.burnout.snapshot.dateLabel, 'Today');
  assert.equal(state.lunar.snapshot.dateLabel, 'Tomorrow');
  assert.equal(state.burnout.lastSyncedAt, '2026-03-31T08:45:00.000Z');
  assert.equal(state.lunar.lastSyncedAt, '2026-03-31T08:46:00.000Z');
});

test('dashboard insights core falls back per-card when premium fetch fails', () => {
  const state = resolveDashboardInsightsState({
    plan: 'premium',
    burnoutResult: { status: 'rejected', reason: new Error('burnout failed') },
    lunarResult: { status: 'fulfilled', value: createLunarPlan() },
    burnoutLastSyncedAt: '2026-03-30T18:00:00.000Z',
    referenceDate: new Date('2026-03-31T10:00:00.000Z'),
  });

  assert.equal(state.burnout.source, 'fallback');
  assert.equal(state.lunar.source, 'live');
  assert.equal(state.burnout.snapshot.headline, 'System Strain Detected');
  assert.equal(state.lunar.snapshot.headline, 'Lunar Focus Window Shifting');
  assert.equal(state.burnout.lastSyncedAt, '2026-03-30T18:00:00.000Z');
});
