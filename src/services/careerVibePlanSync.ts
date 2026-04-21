import { ApiError, ensureAuthSession } from './authSession';
import { fetchCareerVibePlan } from './astrologyApi';
import {
  clearCareerVibePlanForUser,
  loadCareerVibePlanForUser,
  saveCareerVibePlanForUser,
} from '../utils/careerVibePlanStorage';
import { createCareerVibePlanCacheService } from './careerVibePlanSyncCore';

export * from './careerVibePlanSyncCore';

const careerVibePlanCacheService = createCareerVibePlanCacheService({
  ensureAuthSession,
  fetchCareerVibePlan,
  loadCareerVibePlanForUser,
  saveCareerVibePlanForUser,
  clearCareerVibePlanForUser,
  ApiError,
});

export const getCachedCareerVibePlanForCurrentUser = careerVibePlanCacheService.getCachedPlanForCurrentUser;
export const syncCareerVibePlanCache = careerVibePlanCacheService.syncCareerVibePlanCache;
