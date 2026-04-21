import { ApiError, ensureAuthSession } from './authSession';
import { fetchNatalChart } from './astrologyApi';
import { loadOnboardingForUser } from '../utils/onboardingStorage';
import {
  loadNatalChartCacheForUser,
  saveNatalChartCacheForUser,
} from '../utils/natalChartStorage';
import { createNatalChartSyncService } from './natalChartSyncCore';

export * from './natalChartSyncCore';

const natalChartSyncService = createNatalChartSyncService({
  ensureAuthSession,
  fetchNatalChart,
  loadOnboardingForUser,
  loadNatalChartCacheForUser,
  saveNatalChartCacheForUser,
  ApiError,
});

export const syncNatalChartCache = natalChartSyncService.syncNatalChartCache;
