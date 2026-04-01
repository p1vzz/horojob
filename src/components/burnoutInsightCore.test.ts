import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BURNOUT_INSIGHT_TILE_COPY,
  FROZEN_BURNOUT_SNAPSHOT,
  clampBurnoutInsightValue,
  toBurnoutInsightMetricRows,
} from './burnoutInsightCore';

test('burnout insight core clamps metric values into score bounds', () => {
  assert.equal(clampBurnoutInsightValue(-3), 0);
  assert.equal(clampBurnoutInsightValue(46.7), 47);
  assert.equal(clampBurnoutInsightValue(120), 100);
});

test('burnout insight core normalizes metric rows for progress widths', () => {
  const rows = toBurnoutInsightMetricRows([
    { label: 'Saturn Load', value: 46.7, color: '#FF6B6B' },
    { label: 'Recovery Buffer', value: 120, color: '#F8D0A0' },
  ]);

  assert.deepEqual(rows, [
    { label: 'Saturn Load', value: 47, width: '47%', color: '#FF6B6B' },
    { label: 'Recovery Buffer', value: 100, width: '100%', color: '#F8D0A0' },
  ]);
});

test('burnout insight core keeps frozen snapshot and copy stable', () => {
  assert.equal(BURNOUT_INSIGHT_TILE_COPY.badge, 'Burnout Radar');
  assert.equal(FROZEN_BURNOUT_SNAPSHOT.algorithmVersion, 'burnout-risk-v1');
  assert.equal(FROZEN_BURNOUT_SNAPSHOT.reasons.length, 3);
  assert.equal(FROZEN_BURNOUT_SNAPSHOT.components[0]?.label, 'Saturn Load');
});
