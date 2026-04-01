import { API_BASE_URL } from '../config/api';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '../utils/authSessionStorage';
import {
  clearMorningBriefingForUser,
  clearMorningBriefingSetupStateForUser,
  clearMorningBriefingWidgetVariantForUser,
} from '../utils/morningBriefingStorage';
import { clearInterviewStrategyStateForUser } from '../utils/interviewStrategyStorage';
import { clearMorningBriefingWidget } from './morningBriefingWidgetBridge';
import { clearPushTokenSyncMarkerForUser } from './pushNotifications';
import { createAuthSessionManager } from './authSessionCore';

export { ApiError } from './authSessionCore';

const authSessionManager = createAuthSessionManager({
  apiBaseUrl: API_BASE_URL,
  fetchFn: fetch,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  clearUserStateForUser: async (userId: string) => {
    await Promise.all([
      clearMorningBriefingForUser(userId),
      clearMorningBriefingSetupStateForUser(userId),
      clearMorningBriefingWidgetVariantForUser(userId),
      clearInterviewStrategyStateForUser(userId),
      clearPushTokenSyncMarkerForUser(userId),
    ]);
  },
  clearGlobalState: async () => {
    await clearMorningBriefingWidget();
  },
  isDev: __DEV__,
});

export const ensureAuthSession = authSessionManager.ensureAuthSession;
export const updateCurrentSessionUser = authSessionManager.updateCurrentSessionUser;
export const clearSessionAndLogout = authSessionManager.clearSessionAndLogout;
export const authorizedFetch = authSessionManager.authorizedFetch;
