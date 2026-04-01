import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
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
    { label: 'Phase Load', value: 41.6, color: '#F5F7FF' },
    { label: 'Recovery Buffer', value: 120, color: '#AFC2F3' },
  ]);

  assert.deepEqual(rows, [
    { label: 'Phase Load', value: 42, width: '42%', color: '#F5F7FF' },
    { label: 'Recovery Buffer', value: 100, width: '100%', color: '#AFC2F3' },
  ]);
});

test('lunar productivity insight core keeps the frozen snapshot stable', () => {
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.algorithmVersion, 'lunar-productivity-risk-v1');
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.reasons.length, 3);
  assert.equal(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT.components[0]?.label, 'Phase Load');
});
