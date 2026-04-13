import assert from 'node:assert/strict';
import test from 'node:test';
import { createBurnoutPlan, createLunarPlan } from '../services/dashboardInsightSnapshots.test-helpers';
import {
  createDefaultDashboardInsightsState,
  createUnavailableDashboardInsightsState,
  resolveDashboardInsightsState,
  shouldAcknowledgeBurnoutCard,
  shouldAcknowledgeLunarCard,
  shouldDisplayBurnoutCard,
  shouldDisplayLunarCard,
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

test('dashboard insights core exposes unavailable state without preview source', () => {
  const state = createUnavailableDashboardInsightsState();

  assert.equal(state.burnout.source, 'fallback');
  assert.equal(state.lunar.source, 'fallback');
  assert.equal(state.burnout.isHydrating, false);
  assert.equal(state.lunar.isHydrating, false);
  assert.equal(state.burnout.lastSyncedAt, null);
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
  assert.equal(state.lunar.snapshot.score, 84);
  assert.equal(state.lunar.snapshot.directionLabel, 'Disruptive Window');
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
  assert.equal(state.burnout.snapshot.headline, 'Reduce Load Before It Spikes');
  assert.equal(state.lunar.snapshot.headline, 'Protect Your Focus Window');
  assert.equal(state.burnout.lastSyncedAt, '2026-03-30T18:00:00.000Z');
});

test('dashboard insights core acknowledges burnout only for enabled in-threshold unseen timing', () => {
  const visiblePlan = createBurnoutPlan();
  const belowThresholdPlan = createBurnoutPlan({
    risk: {
      algorithmVersion: 'burnout-risk-v1',
      score: 42,
      severity: 'none',
      components: {
        saturnLoad: 20,
        moonLoad: 10,
        workloadMismatch: 5,
        tagPressure: 4,
        recoveryBuffer: 34,
      },
      signals: {
        saturnHardCount: 0,
        moonHardCount: 0,
        saturnMoonHard: 0,
        riskTagContextSwitch: 12,
        riskTagRushBias: 8,
        positiveAspectStrength: 34,
        momentum: {
          energy: 42,
          focus: 45,
        },
        saturn: {
          house: null,
          retrograde: false,
        },
        moon: {
          house: null,
        },
      },
    },
  });

  assert.equal(shouldDisplayBurnoutCard(visiblePlan), true);
  assert.equal(shouldDisplayBurnoutCard(belowThresholdPlan), false);
  assert.equal(shouldAcknowledgeBurnoutCard(visiblePlan), true);
  assert.equal(
    shouldAcknowledgeBurnoutCard(
      createBurnoutPlan({
        settings: {
          enabled: false,
          timezoneIana: 'Europe/Warsaw',
          workdayStartMinute: 540,
          workdayEndMinute: 1080,
          quietHoursStartMinute: 1290,
          quietHoursEndMinute: 480,
          updatedAt: null,
          source: 'saved',
        },
      })
    ),
    false
  );
  assert.equal(shouldAcknowledgeBurnoutCard(belowThresholdPlan), false);
  assert.equal(
    shouldAcknowledgeBurnoutCard(
      createBurnoutPlan({
        timing: {
          algorithmVersion: 'burnout-timing-v1',
          nextPlannedAt: null,
          status: 'sent',
          scheduledDateKey: '2026-03-31',
          scheduledSeverity: 'critical',
        },
      })
    ),
    false
  );
});

test('dashboard insights core displays and acknowledges lunar only inside action range', () => {
  const visiblePlan = createLunarPlan();
  const middlePlan = createLunarPlan({
    risk: {
      algorithmVersion: 'lunar-productivity-risk-v1',
      score: 52,
      severity: 'none',
      impactDirection: null,
      components: {
        moonPhaseLoad: 18,
        emotionalTide: 16,
        focusResonance: 15,
        circadianAlignment: 13,
        recoveryBuffer: 35,
      },
      signals: {
        moonPhase: 'waxing_gibbous',
        illuminationPercent: 68,
        moonHouse: 6,
        hardAspectCount: 1,
        supportiveAspectStrength: 15,
        momentum: {
          energy: 44,
          focus: 42,
        },
      },
    },
  });

  assert.equal(shouldDisplayLunarCard(visiblePlan), true);
  assert.equal(shouldAcknowledgeLunarCard(visiblePlan), true);
  assert.equal(shouldDisplayLunarCard(middlePlan), false);
  assert.equal(shouldAcknowledgeLunarCard(middlePlan), false);
});
