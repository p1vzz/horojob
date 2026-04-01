import assert from 'node:assert/strict';
import test from 'node:test';
import { parseJsonBody } from './httpJson';

test('parseJsonBody parses valid JSON response', async () => {
  const response = new Response(JSON.stringify({ ok: true, value: 42 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed = await parseJsonBody(response);
  assert.deepEqual(parsed, { ok: true, value: 42 });
});

test('parseJsonBody returns raw text for non-JSON payload', async () => {
  const response = new Response('not-json-payload', {
    status: 500,
    headers: { 'Content-Type': 'text/plain' },
  });

  const parsed = await parseJsonBody(response);
  assert.deepEqual(parsed, { raw: 'not-json-payload' });
});
