import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNotificationsApi,
  INTERVIEW_STRATEGY_PLAN_TIMEOUT_MS,
  INTERVIEW_STRATEGY_REFRESH_TIMEOUT_MS,
  INTERVIEW_STRATEGY_SETTINGS_TIMEOUT_MS,
} from './notificationsApiCore';

type TestRequestInit = RequestInit & {
  timeoutMs?: number;
};

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

test('notifications api posts lunar insight acknowledge payload to the expected endpoint', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(
        JSON.stringify({
          acknowledged: true,
          reason: null,
          dateKey: '2026-04-10',
          impactDirection: 'supportive',
          timingStatus: 'cancelled',
        }),
        { status: 200 },
      );
    },
    parseJsonBody: async () => ({
      acknowledged: true,
      reason: null,
      dateKey: '2026-04-10',
      impactDirection: 'supportive',
      timingStatus: 'cancelled',
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.markLunarProductivitySeen({ dateKey: '2026-04-10' });

  assert.equal(payload.acknowledged, true);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(call.path, '/api/notifications/lunar-productivity-seen');
  assert.equal(call.init?.method, 'POST');
  assert.equal((call.init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(String(call.init?.body)), { dateKey: '2026-04-10' });
});

test('notifications api posts burnout insight acknowledge payload to the expected endpoint', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(
        JSON.stringify({
          acknowledged: true,
          reason: null,
          dateKey: '2026-04-10',
          timingStatus: 'cancelled',
        }),
        { status: 200 },
      );
    },
    parseJsonBody: async () => ({
      acknowledged: true,
      reason: null,
      dateKey: '2026-04-10',
      timingStatus: 'cancelled',
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.markBurnoutSeen({ dateKey: '2026-04-10' });

  assert.equal(payload.acknowledged, true);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(call.path, '/api/notifications/burnout-seen');
  assert.equal(call.init?.method, 'POST');
  assert.equal((call.init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(String(call.init?.body)), { dateKey: '2026-04-10' });
});

test('notifications api builds interview strategy refresh query', async () => {
  const calls: string[] = [];
  const timeouts: Array<number | undefined> = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path, init) => {
      calls.push(path);
      timeouts.push(init?.timeoutMs);
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
  assert.deepEqual(timeouts, [INTERVIEW_STRATEGY_PLAN_TIMEOUT_MS, INTERVIEW_STRATEGY_REFRESH_TIMEOUT_MS]);
});

test('notifications api can save fixed interview strategy settings with minimal payload', async () => {
  const calls: Array<{ path: string; init?: TestRequestInit }> = [];
  const api = createNotificationsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ settings: { enabled: true } }), { status: 200 });
    },
    parseJsonBody: async () => ({ settings: { enabled: true } }),
    ApiError: FakeApiError as never,
  });

  await api.upsertInterviewStrategySettings({
    enabled: true,
    timezoneIana: 'Europe/Warsaw',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/notifications/interview-strategy-settings');
  assert.equal(calls[0].init?.method, 'PUT');
  assert.equal(calls[0].init?.timeoutMs, INTERVIEW_STRATEGY_SETTINGS_TIMEOUT_MS);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    enabled: true,
    timezoneIana: 'Europe/Warsaw',
  });
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
