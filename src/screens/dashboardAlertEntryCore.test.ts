import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDashboardAlertPushAnalyticsProperties,
  normalizeDashboardAlertNotificationType,
  resolveDashboardAlertFocus,
  resolveDashboardAlertScrollY,
} from './dashboardAlertEntryCore';

test('dashboard alert entry core maps supported push payload types to card targets', () => {
  assert.equal(resolveDashboardAlertFocus('burnout_alert'), 'burnout');
  assert.equal(resolveDashboardAlertFocus('lunar_productivity_alert'), 'lunar');
  assert.equal(resolveDashboardAlertFocus('unknown'), null);
  assert.equal(resolveDashboardAlertFocus(null), null);
});

test('dashboard alert entry core resolves safe scroll offsets', () => {
  assert.equal(resolveDashboardAlertScrollY(120, 20), 100);
  assert.equal(resolveDashboardAlertScrollY(8, 20), 0);
  assert.equal(resolveDashboardAlertScrollY(null), null);
  assert.equal(resolveDashboardAlertScrollY(Number.NaN), null);
});

test('dashboard alert entry core normalizes push analytics context', () => {
  assert.equal(normalizeDashboardAlertNotificationType('burnout_alert'), 'burnout_alert');
  assert.equal(normalizeDashboardAlertNotificationType('  '), null);
  assert.equal(normalizeDashboardAlertNotificationType(null), null);

  assert.deepEqual(
    buildDashboardAlertPushAnalyticsProperties({
      focus: 'burnout',
      alertFocusKey: 3,
      notificationType: 'burnout_alert',
      outcome: 'focused',
    }),
    {
      source: 'push',
      alertFocus: 'burnout',
      alertFocusKey: 3,
      notificationType: 'burnout_alert',
      outcome: 'focused',
      reason: null,
    }
  );

  assert.deepEqual(
    buildDashboardAlertPushAnalyticsProperties({
      focus: 'lunar',
      alertFocusKey: Number.NaN,
      notificationType: null,
      outcome: 'hidden',
      reason: 'threshold_not_confirmed',
    }),
    {
      source: 'push',
      alertFocus: 'lunar',
      alertFocusKey: null,
      notificationType: null,
      outcome: 'hidden',
      reason: 'threshold_not_confirmed',
    }
  );
});
