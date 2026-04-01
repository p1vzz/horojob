import assert from 'node:assert/strict';
import test from 'node:test';
import type { MorningBriefingSetupState } from '../utils/morningBriefingStorage';
import type { MorningBriefingResponse } from './astrologyApi';
import { createMorningBriefingSyncService } from './morningBriefingSyncCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function createPayload(dateKey: string): MorningBriefingResponse {
  return {
    dateKey,
  } as unknown as MorningBriefingResponse;
}

type ServiceHarnessOptions = {
  subscriptionTier: 'free' | 'premium';
  setupState: MorningBriefingSetupState | null;
  payload: MorningBriefingResponse | null;
  fetchImpl?: (options?: { refresh?: boolean }) => Promise<MorningBriefingResponse>;
};

function createServiceHarness(options: ServiceHarnessOptions) {
  const calls: string[] = [];
  const savedSetupStates: MorningBriefingSetupState[] = [];
  const savedPayloads: MorningBriefingResponse[] = [];
  const savedVariants: string[] = [];

  const service = createMorningBriefingSyncService({
    ensureAuthSession: async () => ({
      user: {
        id: 'user-1',
        subscriptionTier: options.subscriptionTier,
      },
    }),
    fetchMorningBriefing:
      options.fetchImpl ??
      (async () => {
        return createPayload('2026-03-30');
      }),
    loadMorningBriefingForUser: async () => options.payload,
    loadMorningBriefingSetupStateForUser: async () => options.setupState,
    loadMorningBriefingWidgetVariantForUser: async () => 'medium_vibe',
    saveMorningBriefingForUser: async (_userId, payload) => {
      calls.push('savePayload');
      savedPayloads.push(payload);
    },
    saveMorningBriefingSetupStateForUser: async (_userId, state) => {
      calls.push(`saveSetup:${state}`);
      savedSetupStates.push(state);
    },
    saveMorningBriefingWidgetVariantForUser: async (_userId, variantId) => {
      calls.push('saveVariant');
      savedVariants.push(variantId);
    },
    clearMorningBriefingForUser: async () => {
      calls.push('clearPayload');
    },
    clearMorningBriefingWidget: async () => {
      calls.push('clearWidget');
    },
    setMorningBriefingWidgetLocked: async () => {
      calls.push('setLocked');
    },
    setMorningBriefingWidgetProfileMissing: async () => {
      calls.push('setProfileMissing');
    },
    syncMorningBriefingWidget: async () => {
      calls.push('syncWidget');
    },
    ApiError: FakeApiError as never,
  });

  return {
    service,
    calls,
    savedSetupStates,
    savedPayloads,
    savedVariants,
  };
}

test('morning briefing sync returns premium_required for free plan', async () => {
  const harness = createServiceHarness({
    subscriptionTier: 'free',
    setupState: null,
    payload: createPayload('2026-03-29'),
    fetchImpl: async () => {
      throw new Error('must not fetch for free plan');
    },
  });

  const result = await harness.service.syncMorningBriefingCache();
  assert.equal(result.status, 'premium_required');
  assert.equal(result.snapshot.setupState, 'not_eligible');
  assert.equal(result.snapshot.payload, null);
  assert.ok(harness.calls.includes('setLocked'));
  assert.ok(harness.calls.includes('clearPayload'));
});

test('morning briefing sync stores payload and updates setup state on success', async () => {
  const payload = createPayload('2026-03-30');
  const harness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'prompt_dismissed',
    payload: null,
    fetchImpl: async (options) => {
      assert.equal(options?.refresh, true);
      return payload;
    },
  });

  const result = await harness.service.syncMorningBriefingCache({ refresh: true });
  assert.equal(result.status, 'synced');
  assert.equal(result.payload, payload);
  assert.equal(result.snapshot.setupState, 'eligible_not_prompted');
  assert.equal(result.snapshot.payload, payload);
  assert.ok(harness.calls.includes('savePayload'));
  assert.ok(harness.calls.includes('syncWidget'));
  assert.ok(harness.calls.includes('saveSetup:eligible_not_prompted'));
  assert.deepEqual(harness.savedVariants, ['medium_vibe']);
});

test('morning briefing sync keeps enabled and pin_requested states on success', async () => {
  const enabledHarness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'enabled',
    payload: null,
    fetchImpl: async () => createPayload('2026-03-30'),
  });
  const enabledResult = await enabledHarness.service.syncMorningBriefingCache();
  assert.equal(enabledResult.status, 'synced');
  assert.equal(enabledResult.snapshot.setupState, 'enabled');
  assert.equal(enabledHarness.calls.includes('saveSetup:eligible_not_prompted'), false);

  const pinHarness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'pin_requested',
    payload: null,
    fetchImpl: async () => createPayload('2026-03-30'),
  });
  const pinResult = await pinHarness.service.syncMorningBriefingCache();
  assert.equal(pinResult.status, 'synced');
  assert.equal(pinResult.snapshot.setupState, 'pin_requested');
  assert.equal(pinHarness.calls.includes('saveSetup:eligible_not_prompted'), false);
});

test('morning briefing sync handles 403 as premium_required', async () => {
  const harness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'enabled',
    payload: createPayload('2026-03-29'),
    fetchImpl: async () => {
      throw new FakeApiError(403, 'premium required', {});
    },
  });

  const result = await harness.service.syncMorningBriefingCache();
  assert.equal(result.status, 'premium_required');
  assert.equal(result.snapshot.setupState, 'not_eligible');
  assert.equal(result.snapshot.payload, null);
  assert.ok(harness.calls.includes('setLocked'));
  assert.ok(harness.calls.includes('clearPayload'));
});

test('morning briefing sync handles 404 as profile_missing', async () => {
  const harness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'eligible_not_prompted',
    payload: null,
    fetchImpl: async () => {
      throw new FakeApiError(404, 'profile missing', {});
    },
  });

  const result = await harness.service.syncMorningBriefingCache();
  assert.equal(result.status, 'profile_missing');
  assert.ok(harness.calls.includes('setProfileMissing'));
});

test('morning briefing sync handles 401 as unauthorized and clears widget', async () => {
  const harness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'enabled',
    payload: createPayload('2026-03-29'),
    fetchImpl: async () => {
      throw new FakeApiError(401, 'unauthorized', {});
    },
  });

  const result = await harness.service.syncMorningBriefingCache();
  assert.equal(result.status, 'unauthorized');
  assert.equal(result.snapshot.payload, null);
  assert.ok(harness.calls.includes('clearPayload'));
  assert.ok(harness.calls.includes('clearWidget'));
});

test('morning briefing sync returns failed for non-api errors', async () => {
  const harness = createServiceHarness({
    subscriptionTier: 'premium',
    setupState: 'enabled',
    payload: createPayload('2026-03-29'),
    fetchImpl: async () => {
      throw new Error('network down');
    },
  });

  const result = await harness.service.syncMorningBriefingCache();
  assert.equal(result.status, 'failed');
});
