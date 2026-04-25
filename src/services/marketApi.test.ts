import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MARKET_OCCUPATION_INSIGHT_TIMEOUT_MS,
  createMarketApi,
  parseOccupationInsightResponse,
} from './marketApiCore';

type MarketRequestInit = RequestInit & {
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

const samplePayload = {
  query: {
    keyword: 'software developer',
    location: 'US',
  },
  occupation: {
    onetCode: '15-1252.00',
    socCode: '151252',
    title: 'Software Developers',
    description: 'Develop software.',
    matchConfidence: 'high',
  },
  salary: {
    currency: 'USD',
    period: 'annual',
    min: 103000,
    max: 161480,
    median: 133080,
    year: '2024',
    confidence: 'high',
    basis: 'market_estimate',
  },
  outlook: {
    growthLabel: 'Rapid Growth',
    projectedOpenings: 140100,
    projectionYears: '2023-2033',
    demandLabel: 'high',
  },
  skills: [
    {
      name: 'Programming',
      category: 'skill',
      sourceProvider: 'careeronestop',
    },
  ],
  labels: {
    marketScore: 'strong market',
    salaryVisibility: 'market_estimate',
  },
  sources: [
    {
      provider: 'careeronestop',
      label: 'CareerOneStop',
      url: 'https://www.careeronestop.org/',
      retrievedAt: '2026-04-22T00:00:00.000Z',
      attributionText: 'CareerOneStop citation.',
      logoRequired: true,
    },
  ],
};

test('market api sends occupation insight query with auth transport timeout', async () => {
  const calls: Array<{ path: string; init?: MarketRequestInit }> = [];
  const api = createMarketApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify(samplePayload), { status: 200 });
    },
    parseJsonBody: async () => samplePayload,
    ApiError: FakeApiError as never,
  });

  const response = await api.fetchOccupationInsight({
    keyword: 'software developer',
    refresh: true,
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].path,
    '/api/market/occupation-insight?keyword=software+developer&location=US&refresh=true',
  );
  assert.equal(calls[0].init?.timeoutMs, MARKET_OCCUPATION_INSIGHT_TIMEOUT_MS);
  assert.equal(response.occupation.title, 'Software Developers');
  assert.equal(response.salary?.median, 133080);
  assert.equal(response.sources[0]?.logoRequired, true);
});

test('market api throws ApiError on provider failure', async () => {
  const api = createMarketApi({
    authorizedFetch: async () => new Response(JSON.stringify({ code: 'market_no_match' }), { status: 404 }),
    parseJsonBody: async () => ({ code: 'market_no_match' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.fetchOccupationInsight({ keyword: 'unknown role' }),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, 'Failed to fetch market occupation insight');
      assert.deepEqual(error.payload, { code: 'market_no_match' });
      return true;
    },
  );
});

test('market parser normalizes sparse provider payloads into safe defaults', () => {
  const parsed = parseOccupationInsightResponse({
    query: {
      keyword: 'product manager',
    },
    occupation: {
      title: 'Product Managers',
      matchConfidence: 'unexpected',
    },
    salary: {
      median: 'not a number',
      confidence: 'unexpected',
    },
    outlook: {
      demandLabel: 'unexpected',
    },
    skills: [
      { name: 'Roadmapping', category: 'skill' },
      { name: 123 },
    ],
    labels: {},
    sources: [
      {
        provider: 'onet',
        label: 'O*NET OnLine',
        logoRequired: false,
      },
    ],
  });

  assert.equal(parsed.query.location, 'US');
  assert.equal(parsed.occupation.matchConfidence, 'low');
  assert.equal(parsed.salary?.median, null);
  assert.equal(parsed.salary?.confidence, 'low');
  assert.equal(parsed.outlook.demandLabel, 'unknown');
  assert.equal(parsed.labels.marketScore, 'limited data');
  assert.deepEqual(parsed.skills, [
    {
      name: 'Roadmapping',
      category: 'skill',
      sourceProvider: 'careeronestop',
    },
  ]);
  assert.equal(parsed.sources[0]?.provider, 'onet');
});
