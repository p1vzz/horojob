import type { OnboardingData } from '../utils/onboardingStorage';
import type { NatalChartCache } from '../utils/natalChartStorage';

type SessionLike = {
  user: {
    id: string;
  };
};

export type NatalChartSyncResult =
  | { status: 'synced'; userId: string; payload: unknown }
  | { status: 'cached'; userId: string; payload: unknown; errorText: string }
  | { status: 'failed'; userId: string | null; errorText: string };

export type NatalChartSyncDeps = {
  ensureAuthSession: () => Promise<SessionLike>;
  fetchNatalChart: (input?: OnboardingData) => Promise<unknown>;
  loadOnboardingForUser: (userId: string) => Promise<OnboardingData | null>;
  loadNatalChartCacheForUser: (userId: string) => Promise<NatalChartCache | null>;
  saveNatalChartCacheForUser: (userId: string, payload: unknown) => Promise<void>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

function apiStatus(error: unknown, ApiError: NatalChartSyncDeps['ApiError']) {
  if (!(error instanceof ApiError)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

function payloadError(error: unknown) {
  const payload = (error as { payload?: unknown })?.payload;
  if (payload && typeof payload === 'object') {
    const message = (payload as Record<string, unknown>).error;
    if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  }
  return null;
}

export function isNatalChartMissingError(error: unknown, ApiError: NatalChartSyncDeps['ApiError']) {
  const status = apiStatus(error, ApiError);
  if (status !== 404) return false;
  return (payloadError(error) ?? '').toLowerCase().includes('natal chart not found');
}

function shouldRetryWithLocalOnboarding(error: unknown, ApiError: NatalChartSyncDeps['ApiError']) {
  const status = apiStatus(error, ApiError);
  return status === 400 || status === 404;
}

export function resolveNatalChartSyncErrorMessage(error: unknown, ApiError: NatalChartSyncDeps['ApiError']) {
  const status = apiStatus(error, ApiError);
  if (status === 401) return 'Sign in again to prepare your chart.';
  if (status === 404) return 'Complete your birth profile to prepare your career map.';

  const apiMessage = payloadError(error);
  if (apiMessage) return apiMessage;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Unable to prepare your chart right now.';
}

export function createNatalChartSyncService(deps: NatalChartSyncDeps) {
  const fetchNatalChartWithFallback = async (userId: string) => {
    try {
      return await deps.fetchNatalChart();
    } catch (error) {
      if (!shouldRetryWithLocalOnboarding(error, deps.ApiError)) {
        throw error;
      }

      const onboarding = await deps.loadOnboardingForUser(userId);
      if (!onboarding) {
        throw error;
      }

      return deps.fetchNatalChart(onboarding);
    }
  };

  const syncNatalChartCache = async (): Promise<NatalChartSyncResult> => {
    let userId: string | null = null;
    let cached: NatalChartCache | null = null;

    try {
      const session = await deps.ensureAuthSession();
      userId = session.user.id;
      cached = await deps.loadNatalChartCacheForUser(userId);

      const payload = await fetchNatalChartWithFallback(userId);
      await deps.saveNatalChartCacheForUser(userId, payload);

      return {
        status: 'synced',
        userId,
        payload,
      };
    } catch (error) {
      const errorText = resolveNatalChartSyncErrorMessage(error, deps.ApiError);
      if (userId && cached?.payload) {
        return {
          status: 'cached',
          userId,
          payload: cached.payload,
          errorText,
        };
      }

      return {
        status: 'failed',
        userId,
        errorText,
      };
    }
  };

  return {
    syncNatalChartCache,
  };
}
