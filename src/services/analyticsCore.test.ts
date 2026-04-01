import assert from 'node:assert/strict';
import test from 'node:test';
import { createAnalyticsService } from './analyticsCore';

test('analytics core logs event in dev mode', () => {
  const calls: Array<{ scope: string; name: string; properties: unknown }> = [];
  const service = createAnalyticsService({
    isDev: true,
    logger: (scope, name, properties) => {
      calls.push({ scope, name, properties });
    },
  });

  service.trackAnalyticsEvent('open_screen', { source: 'settings' });
  assert.deepEqual(calls, [
    {
      scope: '[analytics:event]',
      name: 'open_screen',
      properties: { source: 'settings' },
    },
  ]);
});

test('analytics core does not log event in production mode', () => {
  const calls: Array<{ scope: string; name: string; properties: unknown }> = [];
  const service = createAnalyticsService({
    isDev: false,
    logger: (scope, name, properties) => {
      calls.push({ scope, name, properties });
    },
  });

  service.trackAnalyticsEvent('open_screen', { source: 'settings' });
  assert.deepEqual(calls, []);
});
