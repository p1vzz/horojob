import assert from 'node:assert/strict';
import test from 'node:test';
import { createBurnoutPlan, createLunarPlan } from './dashboardInsightSnapshots.test-helpers';
import {
  formatDashboardInsightDateLabel,
  formatDashboardInsightSourceLabel,
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

test('dashboard insight snapshot formats source labels for runtime badges', () => {
  assert.equal(formatDashboardInsightSourceLabel('live'), 'LIVE');
  assert.equal(formatDashboardInsightSourceLabel('preview'), 'PREVIEW');
  assert.equal(formatDashboardInsightSourceLabel('fallback'), 'FALLBACK');
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
  assert.equal(snapshot.headline, 'System Strain Detected');
  assert.equal(snapshot.components[2]?.label, 'Mismatch');
  assert.equal(snapshot.components[2]?.value, 18);
  assert.equal(snapshot.reasons.length, 3);
});

test('dashboard insight snapshot maps lunar plan into dashboard card snapshot', () => {
  const snapshot = toLunarProductivityInsightSnapshotFromPlan(createLunarPlan(), new Date('2026-03-31T10:00:00.000Z'));

  assert.equal(snapshot.severityLabel, 'High');
  assert.equal(snapshot.dateLabel, 'Tomorrow');
  assert.equal(snapshot.headline, 'Lunar Focus Window Shifting');
  assert.equal(snapshot.components[2]?.label, 'Focus Resonance');
  assert.equal(snapshot.components[2]?.value, 28);
  assert.equal(snapshot.reasons[0], 'Phase load is 42 during the waxing gibbous cycle.');
});
