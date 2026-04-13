import assert from 'node:assert/strict';
import test from 'node:test';
import { createBurnoutPlan, createLunarPlan } from './dashboardInsightSnapshots.test-helpers';
import {
  formatDashboardInsightDateLabel,
  formatDashboardInsightSyncLabel,
  toBurnoutInsightSnapshotFromPlan,
  toLunarProductivityInsightSnapshotFromPlan,
} from './dashboardInsightSnapshots';

test('dashboard insight snapshot formats date labels against reference day', () => {
  const referenceDate = new Date('2026-03-31T10:00:00.000Z');

  assert.equal(formatDashboardInsightDateLabel('2026-03-31', referenceDate), 'Today');
  assert.equal(formatDashboardInsightDateLabel('2026-04-01', referenceDate), 'Tomorrow');
  assert.equal(formatDashboardInsightDateLabel('2026-03-30', referenceDate), 'Yesterday');
  assert.equal(formatDashboardInsightDateLabel('2026-04-05', referenceDate), 'Apr 5');
  assert.equal(formatDashboardInsightDateLabel('invalid', referenceDate), 'Today');
});

test('dashboard insight snapshot formats sync labels for same-day and older refreshes', () => {
  const referenceDate = new Date('2026-03-31T10:00:00.000Z');

  assert.match(formatDashboardInsightSyncLabel('2026-03-31T08:45:00.000Z', referenceDate) ?? '', /^Updated /);
  assert.match(
    formatDashboardInsightSyncLabel('2026-03-30T20:15:00.000Z', referenceDate) ?? '',
    /^Updated Yesterday /
  );
  assert.equal(formatDashboardInsightSyncLabel('invalid', referenceDate), null);
});

test('dashboard insight snapshot maps burnout plan into dashboard card snapshot', () => {
  const snapshot = toBurnoutInsightSnapshotFromPlan(createBurnoutPlan(), new Date('2026-03-31T10:00:00.000Z'));

  assert.equal(snapshot.severityLabel, 'Critical');
  assert.equal(snapshot.dateLabel, 'Today');
  assert.equal(snapshot.pressureHint, 'Critical strain today: reduce commitments before starting another deep-work block.');
  assert.equal(snapshot.headline, 'Reduce Load Before It Spikes');
  assert.equal(snapshot.components[2]?.label, 'Workload Friction');
  assert.equal(snapshot.components[2]?.value, 18);
  assert.equal(snapshot.reasons.length, 3);
  assert.match(snapshot.summary, /Close the most important item/i);
  assert.match(snapshot.reasons[0], /avoid adding new commitments/i);
});

test('dashboard insight snapshot maps lunar plan into dashboard card snapshot', () => {
  const snapshot = toLunarProductivityInsightSnapshotFromPlan(createLunarPlan(), new Date('2026-03-31T10:00:00.000Z'));

  assert.equal(snapshot.severityLabel, 'High');
  assert.equal(snapshot.directionLabel, 'Disruptive Window');
  assert.equal(snapshot.directionTone, 'disruptive');
  assert.equal(snapshot.pressureHint, 'High lunar pressure today means your focus needs protection.');
  assert.equal(snapshot.dateLabel, 'Tomorrow');
  assert.equal(snapshot.headline, 'Protect Your Focus Window');
  assert.equal(snapshot.components[2]?.label, 'Focus Drag');
  assert.equal(snapshot.components[2]?.value, 28);
  assert.equal(snapshot.reasons[0], 'Attention is more likely to break under switching, so avoid opening multiple threads at once.');
  assert.match(snapshot.summary, /priority task early/i);
});

test('dashboard insight snapshot maps supportive lunar plans into positive direction copy', () => {
  const snapshot = toLunarProductivityInsightSnapshotFromPlan(
    createLunarPlan({
      risk: {
        algorithmVersion: 'lunar-productivity-risk-v1',
        score: 22,
        severity: 'none',
        impactDirection: 'supportive',
        components: {
          moonPhaseLoad: 12,
          emotionalTide: 9,
          focusResonance: 10,
          circadianAlignment: 11,
          recoveryBuffer: 34,
        },
        signals: {
          moonPhase: 'waxing_gibbous',
          illuminationPercent: 68,
          moonHouse: 6,
          hardAspectCount: 1.2,
          supportiveAspectStrength: 26,
          momentum: {
            energy: 39,
            focus: 31,
          },
        },
      },
    }),
    new Date('2026-03-31T10:00:00.000Z')
  );

  assert.equal(snapshot.directionLabel, 'Supportive Window');
  assert.equal(snapshot.directionTone, 'supportive');
  assert.equal(snapshot.pressureHint, 'Low lunar pressure today means cleaner focus is available.');
  assert.equal(snapshot.headline, 'Use Your Best Focus Window');
  assert.match(snapshot.summary, /best thinking/i);
  assert.match(snapshot.reasons[0], /Single-task work should hold better than usual/i);
});
