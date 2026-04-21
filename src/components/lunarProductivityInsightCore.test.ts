import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
  LUNAR_PRODUCTIVITY_TILE_COPY,
  clampLunarProductivityValue,
  toLunarProductivityMetricRows,
} from './lunarProductivityInsightCore';

test('lunar productivity insight core clamps metric values into score bounds', () => {
  assert.equal(clampLunarProductivityValue(-4), 0);
  assert.equal(clampLunarProductivityValue(41.6), 42);
  assert.equal(clampLunarProductivityValue(120), 100);
});

test('lunar productivity insight core normalizes metric rows for progress widths', () => {
  const rows = toLunarProductivityMetricRows([
    { label: 'Rhythm Pressure', value: 41.6, color: '#F5F7FF' },
    { label: 'Recovery Capacity', value: 120, color: '#AFC2F3' },
  ]);

  assert.deepEqual(rows, [
    { label: 'Rhythm Pressure', value: 42, width: '42%', color: '#F5F7FF' },
    { label: 'Recovery Capacity', value: 100, width: '100%', color: '#AFC2F3' },
  ]);
});

test('lunar productivity insight core keeps the frozen snapshot stable', () => {
  assert.equal(LUNAR_PRODUCTIVITY_TILE_COPY.unavailableHeadline, 'Could not update lunar guidance');
  assert.equal(LUNAR_PRODUCTIVITY_TILE_COPY.unavailableAction, 'Try Again');
  assert.equal(LUNAR_PRODUCTIVITY_TILE_COPY.unavailableSummary.includes('84'), false);
  assert.equal(LUNAR_PRODUCTIVITY_TILE_COPY.unavailableSummary.toLowerCase().includes('disruptive'), false);
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.algorithmVersion, 'lunar-productivity-risk-v1');
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.reasons.length, 3);
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.components[0]?.label, 'Rhythm Pressure');
  assert.equal(
    FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.pressureHint,
    'High lunar pressure today means your focus needs protection.'
  );
});
