import { ApiError, ensureAuthSession } from './authSession';
import { fetchMorningBriefing } from './astrologyApi';
import {
  clearMorningBriefingForUser,
  loadMorningBriefingForUser,
  loadMorningBriefingSetupStateForUser,
  loadMorningBriefingWidgetVariantForUser,
  saveMorningBriefingForUser,
  saveMorningBriefingSetupStateForUser,
  saveMorningBriefingWidgetVariantForUser,
} from '../utils/morningBriefingStorage';
import {
  clearMorningBriefingWidget,
  setMorningBriefingWidgetLocked,
  setMorningBriefingWidgetProfileMissing,
  syncMorningBriefingWidget,
} from './morningBriefingWidgetBridge';
import { createMorningBriefingSyncService } from './morningBriefingSyncCore';

export * from './morningBriefingSyncCore';

const morningBriefingSyncService = createMorningBriefingSyncService({
  ensureAuthSession,
  fetchMorningBriefing,
  loadMorningBriefingForUser,
  loadMorningBriefingSetupStateForUser,
  loadMorningBriefingWidgetVariantForUser,
  saveMorningBriefingForUser,
  saveMorningBriefingSetupStateForUser,
  saveMorningBriefingWidgetVariantForUser,
  clearMorningBriefingForUser,
  clearMorningBriefingWidget,
  setMorningBriefingWidgetLocked,
  setMorningBriefingWidgetProfileMissing,
  syncMorningBriefingWidget,
  ApiError,
});

export const getMorningBriefingSnapshotForCurrentUser = morningBriefingSyncService.getMorningBriefingSnapshotForCurrentUser;
export const setMorningBriefingSetupStateForCurrentUser = morningBriefingSyncService.setMorningBriefingSetupStateForCurrentUser;
export const setMorningBriefingWidgetVariantForCurrentUser =
  morningBriefingSyncService.setMorningBriefingWidgetVariantForCurrentUser;
export const syncMorningBriefingCache = morningBriefingSyncService.syncMorningBriefingCache;
