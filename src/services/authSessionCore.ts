import type { AuthSession, AuthUser } from '../utils/authSessionStorage';
import type { TimeoutRequestInit } from './fetchWithTimeout';

type SessionApiPayload = {
  user: AuthUser;
  session: {
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
  };
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type AuthSessionCoreDeps = {
  apiBaseUrl: string;
  fetchFn: (input: string, init?: TimeoutRequestInit) => Promise<Response>;
  loadAuthSession: () => Promise<AuthSession | null>;
  saveAuthSession: (session: AuthSession) => Promise<void>;
  clearAuthSession: () => Promise<void>;
  clearUserStateForUser: (userId: string) => Promise<void>;
  clearGlobalState: () => Promise<void>;
  isDev?: boolean;
  now?: () => number;
  tokenRefreshBufferMs?: number;
};

function parseResponseAsJsonOrRaw(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function createAuthSessionManager(deps: AuthSessionCoreDeps) {
  const now = deps.now ?? Date.now;
  const tokenRefreshBufferMs = deps.tokenRefreshBufferMs ?? 15_000;

  let inMemorySession: AuthSession | null = null;
  let ensurePromise: Promise<AuthSession> | null = null;

  const normalizeSubscriptionTier = (input: unknown): 'free' | 'premium' => {
    if (deps.isDev) return 'premium';
    return input === 'premium' ? 'premium' : 'free';
  };

  const normalizeAuthSession = (session: AuthSession): AuthSession => ({
    ...session,
    user: {
      ...session.user,
      subscriptionTier: normalizeSubscriptionTier(session.user.subscriptionTier),
    },
  });

  const toAuthSession = (payload: SessionApiPayload): AuthSession =>
    normalizeAuthSession({
      user: payload.user,
      accessToken: payload.session.accessToken,
      refreshToken: payload.session.refreshToken,
      accessExpiresAt: payload.session.accessExpiresAt,
      refreshExpiresAt: payload.session.refreshExpiresAt,
    });

  const isTokenValid = (iso: string, bufferMs: number) => {
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return false;
    return ts > now() + bufferMs;
  };

  const parseResponseJson = async (response: Response) => {
    const text = await response.text();
    return parseResponseAsJsonOrRaw(text);
  };

  const createAnonymousSessionRequest = async () => {
    const response = await deps.fetchFn(`${deps.apiBaseUrl}/api/auth/anonymous`, {
      method: 'POST',
    });
    const payload = await parseResponseJson(response);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to create anonymous session', payload);
    }
    return toAuthSession(payload as SessionApiPayload);
  };

  const refreshSessionRequest = async (refreshToken: string) => {
    const response = await deps.fetchFn(`${deps.apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseResponseJson(response);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to refresh session', payload);
    }
    return toAuthSession(payload as SessionApiPayload);
  };

  const resolveSession = async (): Promise<AuthSession> => {
    const loaded = inMemorySession ?? (await deps.loadAuthSession());
    const current = loaded ? normalizeAuthSession(loaded) : null;
    if (current && isTokenValid(current.accessExpiresAt, tokenRefreshBufferMs)) {
      inMemorySession = current;
      return current;
    }

    if (current && isTokenValid(current.refreshExpiresAt, tokenRefreshBufferMs)) {
      try {
        const refreshed = await refreshSessionRequest(current.refreshToken);
        await deps.saveAuthSession(refreshed);
        inMemorySession = refreshed;
        return refreshed;
      } catch {
        // fall through to anonymous session
      }
    }

    const anonymous = await createAnonymousSessionRequest();
    await deps.saveAuthSession(anonymous);
    inMemorySession = anonymous;
    return anonymous;
  };

  const ensureAuthSession = async (): Promise<AuthSession> => {
    if (!ensurePromise) {
      ensurePromise = resolveSession().finally(() => {
        ensurePromise = null;
      });
    }
    return ensurePromise;
  };

  const updateCurrentSessionUser = async (user: AuthUser) => {
    const loaded = inMemorySession ?? (await deps.loadAuthSession());
    if (!loaded) return null;

    const nextSession = normalizeAuthSession({
      ...loaded,
      user: {
        ...loaded.user,
        ...user,
        subscriptionTier: normalizeSubscriptionTier(user.subscriptionTier),
      },
    });

    inMemorySession = nextSession;
    await deps.saveAuthSession(nextSession);
    return nextSession;
  };

  const clearSessionAndLogout = async () => {
    const loaded = inMemorySession ?? (await deps.loadAuthSession());
    const session = loaded ? normalizeAuthSession(loaded) : null;
    inMemorySession = null;
    await deps.clearAuthSession();
    if (session?.user.id) {
      await deps.clearUserStateForUser(session.user.id);
    }
    await deps.clearGlobalState();

    if (!session) return;

    try {
      await deps.fetchFn(`${deps.apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // no-op for offline logout
    }
  };

  const forceRefreshSession = async () => {
    const loaded = inMemorySession ?? (await deps.loadAuthSession());
    const current = loaded ? normalizeAuthSession(loaded) : null;
    if (!current || !isTokenValid(current.refreshExpiresAt, tokenRefreshBufferMs)) {
      const anonymous = await createAnonymousSessionRequest();
      await deps.saveAuthSession(anonymous);
      inMemorySession = anonymous;
      return anonymous;
    }

    try {
      const refreshed = await refreshSessionRequest(current.refreshToken);
      await deps.saveAuthSession(refreshed);
      inMemorySession = refreshed;
      return refreshed;
    } catch {
      const anonymous = await createAnonymousSessionRequest();
      await deps.saveAuthSession(anonymous);
      inMemorySession = anonymous;
      return anonymous;
    }
  };

  const authorizedFetch = async (path: string, init: TimeoutRequestInit = {}) => {
    const session = await ensureAuthSession();
    const headers = new Headers(init.headers ?? {});
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    const firstResponse = await deps.fetchFn(`${deps.apiBaseUrl}${path}`, {
      ...init,
      headers,
    });

    if (firstResponse.status !== 401) {
      return firstResponse;
    }

    const refreshedSession = await forceRefreshSession();
    const retryHeaders = new Headers(init.headers ?? {});
    retryHeaders.set('Authorization', `Bearer ${refreshedSession.accessToken}`);
    return deps.fetchFn(`${deps.apiBaseUrl}${path}`, {
      ...init,
      headers: retryHeaders,
    });
  };

  return {
    ensureAuthSession,
    updateCurrentSessionUser,
    clearSessionAndLogout,
    authorizedFetch,
  };
}
