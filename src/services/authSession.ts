import { API_BASE_URL } from '../config/api';
import { SHOULD_ALLOW_DEVELOPMENT_OVERRIDES } from '../config/appEnvironment';
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
import { clearCareerVibePlanForUser } from '../utils/careerVibePlanStorage';
import { clearJobScanHistoryForUser } from '../utils/jobScanHistoryStorage';
import { clearLastJobScanForUser } from '../utils/jobScanStorage';
import { clearSessionJobScansForUser } from '../utils/jobScanSessionCache';
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
      clearCareerVibePlanForUser(userId),
      clearInterviewStrategyStateForUser(userId),
      clearLastJobScanForUser(userId),
      clearJobScanHistoryForUser(userId),
      AsyncStorage.removeItem(pushTokenSyncStorageKeyForUser(userId)),
    ]);
    clearSessionJobScansForUser(userId);
  },
  clearGlobalState: async () => {
    await clearMorningBriefingWidget();
  },
  isDev: SHOULD_ALLOW_DEVELOPMENT_OVERRIDES,
});

export const ensureAuthSession = authSessionManager.ensureAuthSession;
export const updateCurrentSessionUser = authSessionManager.updateCurrentSessionUser;
export const clearSessionAndLogout = authSessionManager.clearSessionAndLogout;
export const authorizedFetch = authSessionManager.authorizedFetch;
