import assert from 'node:assert/strict';
import test from 'node:test';
import type { CareerVibePlanResponse } from './astrologyApiCore';
import { createCareerVibePlanCacheService } from './careerVibePlanSyncCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function createPayload(dateKey: string): CareerVibePlanResponse {
  return {
    dateKey,
    cached: false,
    schemaVersion: 'career-vibe-plan-v1',
    tier: 'free',
    narrativeSource: 'llm',
    narrativeStatus: 'ready',
    narrativeFailureCode: null,
    model: 'gpt-4o-mini',
    promptVersion: 'v1',
    generatedAt: `${dateKey}T08:00:00.000Z`,
    staleAfter: `${dateKey}T23:59:59.000Z`,
    modeLabel: 'Execution Mode',
    metrics: {
      energy: 70,
      focus: 71,
      luck: 72,
      opportunity: 72,
      aiSynergy: 73,
    },
    plan: {
      headline: 'Focused delivery',
      summary: 'Use the day for a bounded work plan.',
      primaryAction: 'Close one meaningful deliverable.',
      bestFor: ['Deep work'],
      avoid: ['Skipping review'],
      peakWindow: '10-12 PM',
      focusStrategy: 'Keep the first block protected.',
      communicationStrategy: 'Batch messages after the main block.',
      aiWorkStrategy: 'Use AI for draft structure.',
      riskGuardrail: 'Keep one review checkpoint.',
    },
    explanation: {
      drivers: [],
      cautions: [],
      metricNotes: [],
    },
    sources: {
      dailyTransitDateKey: dateKey,
      aiSynergyDateKey: null,
      dailyVibeAlgorithmVersion: 'daily-vibe-v2',
      aiSynergyAlgorithmVersion: null,
    },
  };
}

function createHarness(options: {
  cached?: CareerVibePlanResponse | null;
  fetchImpl?: (options?: { refresh?: boolean }) => Promise<CareerVibePlanResponse>;
}) {
  const calls: string[] = [];
  let cached = options.cached ?? null;
  const savedPayloads: CareerVibePlanResponse[] = [];

  const service = createCareerVibePlanCacheService({
    ensureAuthSession: async () => ({ user: { id: 'user-1' } }),
    fetchCareerVibePlan: options.fetchImpl ?? (async () => createPayload('2026-04-14')),
    loadCareerVibePlanForUser: async () => cached,
    saveCareerVibePlanForUser: async (_userId, payload) => {
      calls.push('save');
      cached = payload;
      savedPayloads.push(payload);
    },
    clearCareerVibePlanForUser: async () => {
      calls.push('clear');
      cached = null;
    },
    ApiError: FakeApiError as never,
  });

  return {
    calls,
    savedPayloads,
    service,
  };
}

test('career vibe plan cache sync stores fresh payload on success', async () => {
  const fresh = createPayload('2026-04-15');
  const harness = createHarness({
    fetchImpl: async (options) => {
      assert.equal(options?.refresh, true);
      return fresh;
    },
  });

  const result = await harness.service.syncCareerVibePlanCache({ refresh: true });

  assert.equal(result.status, 'synced');
  assert.equal(result.payload, fresh);
  assert.equal(result.snapshot.source, 'live');
  assert.deepEqual(harness.savedPayloads, [fresh]);
});

test('career vibe plan cache sync falls back to saved payload on transient failure', async () => {
  const cached = createPayload('2026-04-13');
  const harness = createHarness({
    cached,
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });

  const result = await harness.service.syncCareerVibePlanCache();

  assert.equal(result.status, 'cached');
  assert.equal(result.payload, cached);
  assert.equal(result.snapshot.source, 'cache');
  assert.match(result.snapshot.errorText ?? '', /saved Career Vibe/);
});

test('career vibe plan cache sync clears stale user cache on auth and profile errors', async () => {
  const unauthorized = createHarness({
    cached: createPayload('2026-04-13'),
    fetchImpl: async () => {
      throw new FakeApiError(401, 'unauthorized', {});
    },
  });
  const unauthorizedResult = await unauthorized.service.syncCareerVibePlanCache();
  assert.equal(unauthorizedResult.status, 'failed');
  assert.equal(unauthorizedResult.snapshot.payload, null);
  assert.ok(unauthorized.calls.includes('clear'));

  const profileMissing = createHarness({
    cached: createPayload('2026-04-13'),
    fetchImpl: async () => {
      throw new FakeApiError(404, 'profile missing', {});
    },
  });
  const profileResult = await profileMissing.service.syncCareerVibePlanCache();
  assert.equal(profileResult.status, 'failed');
  assert.equal(profileResult.snapshot.errorText, 'Complete your birth profile first, then open Career Vibe again.');
  assert.ok(profileMissing.calls.includes('clear'));
});
