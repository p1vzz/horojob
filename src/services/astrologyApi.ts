import { ApiError, authorizedFetch } from './authSession';
import { parseJsonBody } from './httpJson';
import { createAstrologyApi } from './astrologyApiCore';

export * from './astrologyApiCore';

const astrologyApi = createAstrologyApi({
  authorizedFetch,
  parseJsonBody,
  ApiError,
});

export const fetchBirthProfile = astrologyApi.fetchBirthProfile;
export const upsertBirthProfile = astrologyApi.upsertBirthProfile;
export const fetchNatalChart = astrologyApi.fetchNatalChart;
export const fetchCareerInsights = astrologyApi.fetchCareerInsights;
export const fetchMarketCareerContext = astrologyApi.fetchMarketCareerContext;
export const fetchDailyTransit = astrologyApi.fetchDailyTransit;
export const fetchMorningBriefing = astrologyApi.fetchMorningBriefing;
export const fetchCareerVibePlan = astrologyApi.fetchCareerVibePlan;
export const fetchFullNatalCareerAnalysis = astrologyApi.fetchFullNatalCareerAnalysis;
export const fetchFullNatalCareerAnalysisProgress = astrologyApi.fetchFullNatalCareerAnalysisProgress;
export const fetchCachedFullNatalCareerAnalysis = astrologyApi.fetchCachedFullNatalCareerAnalysis;
export const fetchAiSynergyHistory = astrologyApi.fetchAiSynergyHistory;
export const fetchDiscoverRoles = astrologyApi.fetchDiscoverRoles;
export const fetchDiscoverRoleCurrentJob = astrologyApi.fetchDiscoverRoleCurrentJob;
export const upsertDiscoverRoleCurrentJob = astrologyApi.upsertDiscoverRoleCurrentJob;
export const deleteDiscoverRoleCurrentJob = astrologyApi.deleteDiscoverRoleCurrentJob;
export const fetchDiscoverRoleShortlist = astrologyApi.fetchDiscoverRoleShortlist;
export const upsertDiscoverRoleShortlistEntry = astrologyApi.upsertDiscoverRoleShortlistEntry;
export const deleteDiscoverRoleShortlistEntry = astrologyApi.deleteDiscoverRoleShortlistEntry;
