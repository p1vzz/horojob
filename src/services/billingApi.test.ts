import assert from 'node:assert/strict';
import test from 'node:test';
import { createBillingApi } from './billingApiCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('billing api fetch subscription uses expected endpoint', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const api = createBillingApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ subscription: { tier: 'premium' } }), { status: 200 });
    },
    parseJsonBody: async () => ({ subscription: { tier: 'premium' } }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchBillingSubscription();
  assert.equal((payload.subscription as { tier: string }).tier, 'premium');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/billing/subscription');
  assert.equal(calls[0].init, undefined);
});

test('billing api sync uses POST method', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const api = createBillingApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ subscription: { tier: 'free' } }), { status: 200 });
    },
    parseJsonBody: async () => ({ subscription: { tier: 'free' } }),
    ApiError: FakeApiError as never,
  });

  await api.syncRevenueCatSubscription();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/billing/revenuecat/sync');
  assert.equal(calls[0].init?.method, 'POST');
});

test('billing api throws ApiError on non-2xx response', async () => {
  const api = createBillingApi({
    authorizedFetch: async () => new Response(JSON.stringify({ code: 'unauthorized' }), { status: 401 }),
    parseJsonBody: async () => ({ code: 'unauthorized' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.fetchBillingSubscription(),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 401);
      assert.equal(error.message, 'Failed to fetch subscription');
      assert.deepEqual(error.payload, { code: 'unauthorized' });
      return true;
    },
  );
});
