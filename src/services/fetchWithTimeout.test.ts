import assert from 'node:assert/strict';
import test from 'node:test';
import { createFetchWithTimeout, FetchTimeoutError } from './fetchWithTimeout';

test('fetch with timeout rejects hung requests with FetchTimeoutError', async () => {
  const fetchWithTimeout = createFetchWithTimeout(
    (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }),
    10
  );

  await assert.rejects(
    () => fetchWithTimeout('http://example.com'),
    (error: unknown) => error instanceof FetchTimeoutError && error.timeoutMs === 10
  );
});

test('fetch with timeout forwards successful responses before timeout', async () => {
  const response = new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
  const fetchWithTimeout = createFetchWithTimeout(async () => response, 10);

  const result = await fetchWithTimeout('http://example.com');

  assert.equal(result, response);
});

test('fetch with timeout honors per-request timeout override and strips it from fetch init', async () => {
  let forwardedTimeout: unknown = 'unset';
  const fetchWithTimeout = createFetchWithTimeout(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        forwardedTimeout = (init as RequestInit & { timeoutMs?: number }).timeoutMs;
        init?.signal?.addEventListener(
          'abort',
          () => {
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      }),
    50
  );

  await assert.rejects(
    () => fetchWithTimeout('http://example.com', { timeoutMs: 5 }),
    (error: unknown) => error instanceof FetchTimeoutError && error.timeoutMs === 5
  );
  assert.equal(forwardedTimeout, undefined);
});
