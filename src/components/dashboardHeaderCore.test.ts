import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DASHBOARD_ZODIAC_SIGNS,
  buildDashboardMiniPositions,
  resolveDashboardGreeting,
} from './dashboardHeaderCore';

test('dashboard header core resolves greeting by hour bucket', () => {
  assert.equal(resolveDashboardGreeting(0), 'Good Morning');
  assert.equal(resolveDashboardGreeting(11), 'Good Morning');
  assert.equal(resolveDashboardGreeting(12), 'Good Afternoon');
  assert.equal(resolveDashboardGreeting(17), 'Good Afternoon');
  assert.equal(resolveDashboardGreeting(18), 'Good Evening');
  assert.equal(resolveDashboardGreeting(23), 'Good Evening');
});

test('dashboard header core builds zodiac ring positions', () => {
  const positions = buildDashboardMiniPositions();
  assert.equal(positions.length, DASHBOARD_ZODIAC_SIGNS.length);
  assert.deepEqual(positions[0], { s: '\u2648\uFE0E', x: 14, y: 0 });
  assert.deepEqual(positions[3], { s: '\u264B\uFE0E', x: 0, y: 14 });
  assert.deepEqual(positions[6], { s: '\u264E\uFE0E', x: -14, y: 0 });
  assert.deepEqual(positions[9], { s: '\u2651\uFE0E', x: 0, y: -14 });
});
