import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNatalChartSyncService,
  isNatalChartMissingError,
} from './natalChartSyncCore';
import type { OnboardingData } from '../utils/onboardingStorage';

class TestApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const onboarding: OnboardingData = {
  name: 'Ada',
  birthDate: '1991-02-03',
  birthTime: '09:15',
  unknownTime: false,
  city: 'Warsaw',
  latitude: 52.23,
  longitude: 21.01,
  country: 'PL',
  admin1: null,
};

function createService(options?: {
  cached?: unknown;
  onboarding?: OnboardingData | null;
  fetchNatalChart?: (input?: OnboardingData) => Promise<unknown>;
}) {
  let cached: unknown | null = options?.cached ?? null;
  const fetchInputs: Array<OnboardingData | undefined> = [];
  const service = createNatalChartSyncService({
    ensureAuthSession: async () => ({ user: { id: 'user-1' } }),
    fetchNatalChart: async (input?: OnboardingData) => {
      fetchInputs.push(input);
      if (options?.fetchNatalChart) return options.fetchNatalChart(input);
      return { chart: { houses: [] } };
    },
    loadOnboardingForUser: async () => options?.onboarding ?? onboarding,
    loadNatalChartCacheForUser: async () => (
      cached ? { payload: cached, savedAt: '2026-04-14T10:00:00.000Z' } : null
    ),
    saveNatalChartCacheForUser: async (_userId, payload) => {
      cached = payload;
    },
    ApiError: TestApiError,
  });

  return {
    service,
    getCached: () => cached,
    fetchInputs,
  };
}

test('natal chart sync stores payload fetched from backend', async () => {
  const { service, getCached, fetchInputs } = createService({
    fetchNatalChart: async () => ({ chart: { ascendant: 'Gemini' } }),
  });

  const result = await service.syncNatalChartCache();

  assert.equal(result.status, 'synced');
  assert.deepEqual(getCached(), { chart: { ascendant: 'Gemini' } });
  assert.deepEqual(fetchInputs, [undefined]);
});

test('natal chart sync retries with local onboarding when stored profile is missing remotely', async () => {
  const { service, getCached, fetchInputs } = createService({
    fetchNatalChart: async (input?: OnboardingData) => {
      if (!input) {
        throw new TestApiError(404, 'Missing profile', {
          error: 'Birth profile not found. Submit onboarding details first.',
        });
      }
      return { chart: { city: input.city } };
    },
  });

  const result = await service.syncNatalChartCache();

  assert.equal(result.status, 'synced');
  assert.deepEqual(getCached(), { chart: { city: 'Warsaw' } });
  assert.equal(fetchInputs.length, 2);
  assert.equal(fetchInputs[0], undefined);
  assert.deepEqual(fetchInputs[1], onboarding);
});

test('natal chart sync falls back to local cache when backend generation fails', async () => {
  const { service } = createService({
    cached: { chart: { cached: true } },
    fetchNatalChart: async () => {
      throw new TestApiError(502, 'Provider failed', { error: 'Unable to generate natal chart' });
    },
  });

  const result = await service.syncNatalChartCache();

  assert.equal(result.status, 'cached');
  assert.deepEqual(result.payload, { chart: { cached: true } });
});

test('natal chart sync detects discover roles missing chart errors', () => {
  assert.equal(
    isNatalChartMissingError(
      new TestApiError(404, 'Missing chart', { error: 'Natal chart not found. Generate chart first.' }),
      TestApiError,
    ),
    true,
  );
  assert.equal(
    isNatalChartMissingError(
      new TestApiError(404, 'Missing profile', { error: 'Birth profile not found. Complete onboarding first.' }),
      TestApiError,
    ),
    false,
  );
});
