import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthSession } from '../utils/authSessionStorage';
import { createAuthSessionManager } from './authSessionCore';

type FetchCall = {
  input: string;
  init?: RequestInit;
};

function createBaseSession(nowMs: number): AuthSession {
  return {
    user: {
      id: 'u-1',
      kind: 'anonymous',
      appleLinked: false,
      email: null,
      displayName: null,
      createdAt: new Date(nowMs - 1000).toISOString(),
      subscriptionTier: 'free',
    },
    accessToken: 'access-old',
    refreshToken: 'refresh-old',
    accessExpiresAt: new Date(nowMs + 60_000).toISOString(),
    refreshExpiresAt: new Date(nowMs + 120_000).toISOString(),
  };
}

test('auth session manager reuses valid stored session without network', async () => {
  const nowMs = Date.parse('2026-03-30T10:00:00.000Z');
  const fetchCalls: FetchCall[] = [];
  const loadedSession = createBaseSession(nowMs);

  const manager = createAuthSessionManager({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    fetchFn: async (input, init) => {
      fetchCalls.push({ input, init });
      return new Response('{}', { status: 200 });
    },
    loadAuthSession: async () => loadedSession,
    saveAuthSession: async () => {},
    clearAuthSession: async () => {},
    clearUserStateForUser: async () => {},
    clearGlobalState: async () => {},
  });

  const session = await manager.ensureAuthSession();
  assert.equal(session.accessToken, 'access-old');
  assert.equal(fetchCalls.length, 0);
});

test('auth session manager refreshes expired access token', async () => {
  const nowMs = Date.parse('2026-03-30T10:00:00.000Z');
  const fetchCalls: FetchCall[] = [];
  const savedSessions: AuthSession[] = [];
  const loadedSession = {
    ...createBaseSession(nowMs),
    accessExpiresAt: new Date(nowMs - 10_000).toISOString(),
    refreshExpiresAt: new Date(nowMs + 120_000).toISOString(),
  };

  const manager = createAuthSessionManager({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    fetchFn: async (input, init) => {
      fetchCalls.push({ input, init });
      if (input === 'https://api.example.com/api/auth/refresh') {
        return new Response(
          JSON.stringify({
            user: loadedSession.user,
            session: {
              accessToken: 'access-new',
              refreshToken: 'refresh-new',
              accessExpiresAt: new Date(nowMs + 300_000).toISOString(),
              refreshExpiresAt: new Date(nowMs + 600_000).toISOString(),
            },
          }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected URL ${input}`);
    },
    loadAuthSession: async () => loadedSession,
    saveAuthSession: async (session) => {
      savedSessions.push(session);
    },
    clearAuthSession: async () => {},
    clearUserStateForUser: async () => {},
    clearGlobalState: async () => {},
  });

  const session = await manager.ensureAuthSession();
  assert.equal(session.accessToken, 'access-new');
  assert.equal(savedSessions.length, 1);
  assert.equal(savedSessions[0].refreshToken, 'refresh-new');
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].input, 'https://api.example.com/api/auth/refresh');
});

test('auth session manager falls back to anonymous when refresh fails', async () => {
  const nowMs = Date.parse('2026-03-30T10:00:00.000Z');
  const fetchCalls: string[] = [];
  const loadedSession = {
    ...createBaseSession(nowMs),
    accessExpiresAt: new Date(nowMs - 10_000).toISOString(),
    refreshExpiresAt: new Date(nowMs + 120_000).toISOString(),
  };

  const manager = createAuthSessionManager({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    fetchFn: async (input) => {
      fetchCalls.push(input);
      if (input === 'https://api.example.com/api/auth/refresh') {
        return new Response(JSON.stringify({ error: 'refresh_failed' }), { status: 500 });
      }
      if (input === 'https://api.example.com/api/auth/anonymous') {
        return new Response(
          JSON.stringify({
            user: loadedSession.user,
            session: {
              accessToken: 'access-anon',
              refreshToken: 'refresh-anon',
              accessExpiresAt: new Date(nowMs + 300_000).toISOString(),
              refreshExpiresAt: new Date(nowMs + 600_000).toISOString(),
            },
          }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected URL ${input}`);
    },
    loadAuthSession: async () => loadedSession,
    saveAuthSession: async () => {},
    clearAuthSession: async () => {},
    clearUserStateForUser: async () => {},
    clearGlobalState: async () => {},
  });

  const session = await manager.ensureAuthSession();
  assert.equal(session.accessToken, 'access-anon');
  assert.deepEqual(fetchCalls, [
    'https://api.example.com/api/auth/refresh',
    'https://api.example.com/api/auth/anonymous',
  ]);
});

test('authorizedFetch retries once after 401 using refreshed token', async () => {
  const nowMs = Date.parse('2026-03-30T10:00:00.000Z');
  const calls: FetchCall[] = [];
  const loadedSession = createBaseSession(nowMs);

  const manager = createAuthSessionManager({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    fetchFn: async (input, init) => {
      calls.push({ input, init });
      if (input === 'https://api.example.com/api/jobs/preflight') {
        const authHeader = new Headers(init?.headers).get('Authorization');
        if (authHeader === 'Bearer access-old') {
          return new Response('unauthorized', { status: 401 });
        }
        if (authHeader === 'Bearer access-new') {
          return new Response('ok', { status: 200 });
        }
      }
      if (input === 'https://api.example.com/api/auth/refresh') {
        return new Response(
          JSON.stringify({
            user: loadedSession.user,
            session: {
              accessToken: 'access-new',
              refreshToken: 'refresh-new',
              accessExpiresAt: new Date(nowMs + 300_000).toISOString(),
              refreshExpiresAt: new Date(nowMs + 600_000).toISOString(),
            },
          }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected URL ${input}`);
    },
    loadAuthSession: async () => loadedSession,
    saveAuthSession: async () => {},
    clearAuthSession: async () => {},
    clearUserStateForUser: async () => {},
    clearGlobalState: async () => {},
  });

  const response = await manager.authorizedFetch('/api/jobs/preflight', { method: 'GET' });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].input, 'https://api.example.com/api/jobs/preflight');
  assert.equal(calls[1].input, 'https://api.example.com/api/auth/refresh');
  assert.equal(calls[2].input, 'https://api.example.com/api/jobs/preflight');
});

test('clearSessionAndLogout clears local state and sends logout request', async () => {
  const nowMs = Date.parse('2026-03-30T10:00:00.000Z');
  const calls: FetchCall[] = [];
  let clearAuthCalls = 0;
  const clearedUsers: string[] = [];
  let clearGlobalCalls = 0;
  const loadedSession = createBaseSession(nowMs);

  const manager = createAuthSessionManager({
    apiBaseUrl: 'https://api.example.com',
    now: () => nowMs,
    fetchFn: async (input, init) => {
      calls.push({ input, init });
      return new Response('{}', { status: 200 });
    },
    loadAuthSession: async () => loadedSession,
    saveAuthSession: async () => {},
    clearAuthSession: async () => {
      clearAuthCalls += 1;
    },
    clearUserStateForUser: async (userId) => {
      clearedUsers.push(userId);
    },
    clearGlobalState: async () => {
      clearGlobalCalls += 1;
    },
  });

  await manager.clearSessionAndLogout();

  assert.equal(clearAuthCalls, 1);
  assert.deepEqual(clearedUsers, ['u-1']);
  assert.equal(clearGlobalCalls, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, 'https://api.example.com/api/auth/logout');
  assert.equal(new Headers(calls[0].init?.headers).get('Authorization'), 'Bearer access-old');
});
