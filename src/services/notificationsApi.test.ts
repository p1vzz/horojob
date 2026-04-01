import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotificationsApi } from './notificationsApiCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('notifications api uses expected endpoint/method for lunar settings', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ settings: { enabled: true } }), { status: 200 });
    },
    parseJsonBody: async () => ({ settings: { enabled: true } }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.upsertLunarProductivitySettings({
    enabled: true,
    timezoneIana: 'Europe/Warsaw',
    workdayStartMinute: 540,
    workdayEndMinute: 1080,
    quietHoursStartMinute: 1290,
    quietHoursEndMinute: 480,
  });

  assert.equal(payload.settings.enabled, true);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(call.path, '/api/notifications/lunar-productivity-settings');
  assert.equal(call.init?.method, 'PUT');
  assert.equal((call.init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  const body = JSON.parse(String(call.init?.body));
  assert.equal(body.enabled, true);
  assert.equal(body.timezoneIana, 'Europe/Warsaw');
});

test('notifications api builds interview strategy refresh query', async () => {
  const calls: string[] = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path) => {
      calls.push(path);
      return new Response(
        JSON.stringify({
          enabled: true,
          settings: {},
          plan: { slots: [] },
        }),
        { status: 200 },
      );
    },
    parseJsonBody: async () => ({
      enabled: true,
      settings: {},
      plan: { slots: [] },
    }),
    ApiError: FakeApiError as never,
  });

  await api.fetchInterviewStrategyPlan();
  await api.fetchInterviewStrategyPlan({ refresh: true });

  assert.deepEqual(calls, [
    '/api/notifications/interview-strategy-plan?refresh=false',
    '/api/notifications/interview-strategy-plan?refresh=true',
  ]);
});

test('notifications api throws ApiError with payload on failed burnout plan', async () => {
  const api = createNotificationsApi({
    authorizedFetch: async () => new Response(JSON.stringify({ code: 'premium_required' }), { status: 403 }),
    parseJsonBody: async () => ({ code: 'premium_required' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.fetchBurnoutPlan(),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 403);
      assert.equal(error.message, 'Failed to fetch burnout plan');
      assert.deepEqual(error.payload, { code: 'premium_required' });
      return true;
    },
  );
});
