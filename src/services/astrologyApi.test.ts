import assert from 'node:assert/strict';
import test from 'node:test';
import { createAstrologyApi } from './astrologyApiCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('astrology api returns null for missing birth profile (404)', async () => {
  const api = createAstrologyApi({
    authorizedFetch: async () => new Response(JSON.stringify({ error: 'not_found' }), { status: 404 }),
    parseJsonBody: async () => ({ error: 'not_found' }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.fetchBirthProfile();
  assert.equal(payload, null);
});

test('astrology api career insights builds default and custom query', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchCareerInsights();
  await api.fetchCareerInsights({ tier: 'premium', regenerate: true });

  assert.deepEqual(paths, [
    '/api/astrology/career-insights?tier=free&regenerate=false',
    '/api/astrology/career-insights?tier=premium&regenerate=true',
  ]);
});

test('astrology api morning briefing query defaults to refresh=false', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchMorningBriefing();
  await api.fetchMorningBriefing({ refresh: true });

  assert.deepEqual(paths, [
    '/api/astrology/morning-briefing?refresh=false',
    '/api/astrology/morning-briefing?refresh=true',
  ]);
});

test('astrology api career vibe plan query defaults to refresh=false', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchCareerVibePlan();
  await api.fetchCareerVibePlan({ refresh: true });

  assert.deepEqual(paths, [
    '/api/astrology/career-vibe-plan?refresh=false',
    '/api/astrology/career-vibe-plan?refresh=true',
  ]);
});

test('astrology api natal chart sends POST body and surfaces backend error message', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const successApi = createAstrologyApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ chart: {} }), { status: 200 });
    },
    parseJsonBody: async () => ({ chart: {} }),
    ApiError: FakeApiError as never,
  });

  await successApi.fetchNatalChart({
    name: 'Alex',
    birthDate: '2000-01-01',
    birthTime: '08:00',
    unknownTime: false,
    city: 'Warsaw',
    latitude: 52.2297,
    longitude: 21.0122,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/astrology/natal-chart');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal((calls[0].init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.city, 'Warsaw');

  const failApi = createAstrologyApi({
    authorizedFetch: async () => new Response(JSON.stringify({ error: 'invalid profile' }), { status: 422 }),
    parseJsonBody: async () => ({ error: 'invalid profile' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => failApi.fetchNatalChart(),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 422);
      assert.equal(error.message, 'invalid profile');
      assert.deepEqual(error.payload, { error: 'invalid profile' });
      return true;
    },
  );
});

test('astrology api discover roles trims query and applies defaults', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchDiscoverRoles({ query: '  data scientist  ' });

  assert.equal(paths.length, 1);
  const url = new URL(`https://example.com${paths[0]}`);
  assert.equal(url.pathname, '/api/astrology/discover-roles');
  assert.equal(url.searchParams.get('query'), 'data scientist');
  assert.equal(url.searchParams.get('limit'), '5');
  assert.equal(url.searchParams.get('searchLimit'), '20');
  assert.equal(url.searchParams.get('refresh'), 'false');
  assert.equal(url.searchParams.get('deferSearchScores'), 'false');
  assert.equal(url.searchParams.get('scoreSlug'), null);
});

test('astrology api discover roles can defer search scores and request one score slug', async () => {
  const paths: string[] = [];
  const api = createAstrologyApi({
    authorizedFetch: async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  await api.fetchDiscoverRoles({
    query: 'teacher',
    deferSearchScores: true,
    scoreSlug: 'elementary-school-teacher',
  });

  assert.equal(paths.length, 1);
  const url = new URL(`https://example.com${paths[0]}`);
  assert.equal(url.searchParams.get('deferSearchScores'), 'true');
  assert.equal(url.searchParams.get('scoreSlug'), 'elementary-school-teacher');
});
