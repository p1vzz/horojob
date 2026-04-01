import { ApiError, authorizedFetch } from './authSession';
import { parseJsonBody } from './httpJson';
import { createNotificationsApi } from './notificationsApiCore';

export * from './notificationsApiCore';

const notificationsApi = createNotificationsApi({
  authorizedFetch,
  parseJsonBody,
  ApiError,
});

export const upsertPushNotificationToken = notificationsApi.upsertPushNotificationToken;
export const upsertBurnoutSettings = notificationsApi.upsertBurnoutSettings;
export const fetchBurnoutPlan = notificationsApi.fetchBurnoutPlan;
export const upsertLunarProductivitySettings = notificationsApi.upsertLunarProductivitySettings;
export const fetchLunarProductivityPlan = notificationsApi.fetchLunarProductivityPlan;
export const upsertInterviewStrategySettings = notificationsApi.upsertInterviewStrategySettings;
export const fetchInterviewStrategyPlan = notificationsApi.fetchInterviewStrategyPlan;
