import assert from 'node:assert/strict';
import test from 'node:test';
import { createCitiesApi } from './citiesApiCore';

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('cities api ignores too-short queries without network call', async () => {
  const calls: string[] = [];
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    fetchFn: async (input) => {
      calls.push(input);
      return new Response('{}', { status: 200 });
    },
    parseJsonBody: async () => ({}),
    ApiError: FakeApiError as never,
  });

  const result = await api.searchCities(' a ');
  assert.deepEqual(result, []);
  assert.deepEqual(calls, []);
});

test('cities api builds query params and clamps options', async () => {
  const calls: string[] = [];
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    fetchFn: async (input) => {
      calls.push(input);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
    parseJsonBody: async () => ({ items: [] }),
    ApiError: FakeApiError as never,
  });

  await api.searchCities('  Warsaw  ', { count: 99, language: '  pl  ' });

  assert.equal(calls.length, 1);
  const url = new URL(calls[0]);
  assert.equal(url.pathname, '/api/cities/search');
  assert.equal(url.searchParams.get('query'), 'Warsaw');
  assert.equal(url.searchParams.get('count'), '20');
  assert.equal(url.searchParams.get('language'), 'pl');
});

test('cities api normalizes invalid items and generates fallback id/label', async () => {
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          items: [
            null,
            { id: 123, name: 'Warsaw', latitude: 52.1, longitude: 21.0, country: 'PL' },
            { id: 'krk', name: 'Krakow', label: '', latitude: 'bad', admin1: 'Malopolskie' },
            { id: 'broken', label: 'No name' },
          ],
        }),
        { status: 200 },
      ),
    parseJsonBody: async () => ({
      items: [
        null,
        { id: 123, name: 'Warsaw', latitude: 52.1, longitude: 21.0, country: 'PL' },
        { id: 'krk', name: 'Krakow', label: '', latitude: 'bad', admin1: 'Malopolskie' },
        { id: 'broken', label: 'No name' },
      ],
    }),
    ApiError: FakeApiError as never,
  });

  const result = await api.searchCities('warsaw');
  assert.deepEqual(result, [
    {
      id: 'Warsaw-1',
      name: 'Warsaw',
      label: 'Warsaw',
      latitude: 52.1,
      longitude: 21,
      country: 'PL',
      admin1: null,
    },
    {
      id: 'krk',
      name: 'Krakow',
      label: 'Krakow',
      latitude: null,
      longitude: null,
      country: null,
      admin1: 'Malopolskie',
    },
  ]);
});

test('cities api serves cached results within ttl without extra fetch', async () => {
  let nowMs = 1000;
  let fetchCount = 0;
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    cacheTtlMs: 5000,
    fetchFn: async () => {
      fetchCount += 1;
      return new Response(JSON.stringify({ items: [{ id: 'waw', name: 'Warsaw', label: 'Warsaw' }] }), { status: 200 });
    },
    parseJsonBody: async () => ({ items: [{ id: 'waw', name: 'Warsaw', label: 'Warsaw' }] }),
    ApiError: FakeApiError as never,
  });

  const first = await api.searchCities('warsaw');
  nowMs = 2000;
  const second = await api.searchCities('warsaw');

  assert.equal(fetchCount, 1);
  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.notEqual(first, second);
});

test('cities api expires cache after ttl', async () => {
  let nowMs = 0;
  let callNo = 0;
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    cacheTtlMs: 100,
    fetchFn: async () => {
      callNo += 1;
      return new Response(JSON.stringify({ items: [{ id: `id-${callNo}`, name: 'Warsaw', label: 'Warsaw' }] }), { status: 200 });
    },
    parseJsonBody: async () => ({ items: [{ id: `id-${callNo}`, name: 'Warsaw', label: 'Warsaw' }] }),
    ApiError: FakeApiError as never,
  });

  const first = await api.searchCities('warsaw');
  nowMs = 150;
  const second = await api.searchCities('warsaw');

  assert.equal(first[0].id, 'id-1');
  assert.equal(second[0].id, 'id-2');
  assert.equal(callNo, 2);
});

test('cities api throws ApiError on failed search', async () => {
  const api = createCitiesApi({
    apiBaseUrl: 'https://api.example.com',
    fetchFn: async () => new Response(JSON.stringify({ code: 'rate_limited' }), { status: 429 }),
    parseJsonBody: async () => ({ code: 'rate_limited' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.searchCities('warsaw'),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 429);
      assert.equal(error.message, 'Failed to search cities');
      assert.deepEqual(error.payload, { code: 'rate_limited' });
      return true;
    },
  );
});
