import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { createAuthSessionManager } from './authSessionCore';
import { createFetchWithTimeout } from './fetchWithTimeout';
import { pushTokenSyncStorageKeyForUser } from './pushNotificationsCore';

export { ApiError } from './authSessionCore';

const authFetch = createFetchWithTimeout(fetch);

const authSessionManager = createAuthSessionManager({
  apiBaseUrl: API_BASE_URL,
  fetchFn: authFetch,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  clearUserStateForUser: async (userId: string) => {
    await Promise.all([
      clearMorningBriefingForUser(userId),
      clearMorningBriefingSetupStateForUser(userId),
      clearMorningBriefingWidgetVariantForUser(userId),
      clearInterviewStrategyStateForUser(userId),
      AsyncStorage.removeItem(pushTokenSyncStorageKeyForUser(userId)),
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
