import { resolveDeviceTimezoneIana } from '../utils/timezone';
import { syncNatalChartCache } from './natalChartSync';
import {
  fetchInterviewStrategyPlan,
  upsertInterviewStrategySettings,
} from './notificationsApi';
import { ensureInterviewStrategyPlanReady } from './interviewStrategyPlanSyncCore';

export * from './interviewStrategyPlanSyncCore';

export const syncInterviewStrategyPlan = (options?: { autoEnable?: boolean }) =>
  ensureInterviewStrategyPlanReady(
    {
      fetchInterviewStrategyPlan,
      upsertInterviewStrategySettings,
      syncNatalChartCache,
      resolveTimezoneIana: resolveDeviceTimezoneIana,
    },
    options
  );
