import type { CareerVibePlanResponse } from './astrologyApi';

type SessionLike = {
  user: {
    id: string;
  };
};

export type CareerVibePlanSourceMode = 'live' | 'cache' | 'empty';

export type CareerVibePlanSnapshot = {
  userId: string | null;
  payload: CareerVibePlanResponse | null;
  source: CareerVibePlanSourceMode;
  errorText: string | null;
};

export type CareerVibePlanCacheResult =
  | { status: 'synced'; snapshot: CareerVibePlanSnapshot; payload: CareerVibePlanResponse }
  | { status: 'cached'; snapshot: CareerVibePlanSnapshot; payload: CareerVibePlanResponse }
  | { status: 'failed'; snapshot: CareerVibePlanSnapshot };

export type CareerVibePlanCacheDeps = {
  ensureAuthSession: () => Promise<SessionLike>;
  fetchCareerVibePlan: (options?: { refresh?: boolean }) => Promise<CareerVibePlanResponse>;
  loadCareerVibePlanForUser: (userId: string) => Promise<CareerVibePlanResponse | null>;
  saveCareerVibePlanForUser: (userId: string, payload: CareerVibePlanResponse) => Promise<void>;
  clearCareerVibePlanForUser: (userId: string) => Promise<void>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

function apiStatus(error: unknown, ApiError: CareerVibePlanCacheDeps['ApiError']) {
  if (!(error instanceof ApiError)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export function resolveCareerVibePlanCacheErrorMessage(error: unknown, ApiError: CareerVibePlanCacheDeps['ApiError']) {
  const status = apiStatus(error, ApiError);
  if (status === 401) return 'Sign in again to refresh Career Vibe.';
  if (status === 404) return 'Complete your birth profile first, then open Career Vibe again.';

  const payload = (error as { payload?: unknown })?.payload;
  if (payload && typeof payload === 'object') {
    const message = (payload as Record<string, unknown>).error;
    if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Career Vibe is unavailable right now.';
}

export function createCareerVibePlanCacheService(deps: CareerVibePlanCacheDeps) {
  const getCachedPlanForCurrentUser = async (): Promise<CareerVibePlanSnapshot> => {
    try {
      const session = await deps.ensureAuthSession();
      const payload = await deps.loadCareerVibePlanForUser(session.user.id);
      return {
        userId: session.user.id,
        payload,
        source: payload ? 'cache' : 'empty',
        errorText: null,
      };
    } catch (error) {
      return {
        userId: null,
        payload: null,
        source: 'empty',
        errorText: resolveCareerVibePlanCacheErrorMessage(error, deps.ApiError),
      };
    }
  };

  const syncCareerVibePlanCache = async (options?: { refresh?: boolean }): Promise<CareerVibePlanCacheResult> => {
    let userId: string | null = null;
    let cached: CareerVibePlanResponse | null = null;

    try {
      const session = await deps.ensureAuthSession();
      userId = session.user.id;
      cached = await deps.loadCareerVibePlanForUser(userId);

      const payload = await deps.fetchCareerVibePlan({ refresh: options?.refresh });
      await deps.saveCareerVibePlanForUser(userId, payload);

      return {
        status: 'synced',
        payload,
        snapshot: {
          userId,
          payload,
          source: 'live',
          errorText: null,
        },
      };
    } catch (error) {
      const status = apiStatus(error, deps.ApiError);

      if (userId && (status === 401 || status === 404)) {
        await deps.clearCareerVibePlanForUser(userId);
        cached = null;
      }

      if (cached && status !== 401 && status !== 404) {
        const snapshot = {
          userId,
          payload: cached,
          source: 'cache' as const,
          errorText: 'Showing saved Career Vibe. Fresh plan did not sync.',
        };
        return {
          status: 'cached',
          payload: cached,
          snapshot,
        };
      }

      return {
        status: 'failed',
        snapshot: {
          userId,
          payload: null,
          source: 'empty',
          errorText: resolveCareerVibePlanCacheErrorMessage(error, deps.ApiError),
        },
      };
    }
  };

  return {
    getCachedPlanForCurrentUser,
    syncCareerVibePlanCache,
  };
}
