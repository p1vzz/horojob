import type { InterviewStrategyPlanResponse, InterviewStrategySettingsResponse } from './notificationsApiCore';
import type { NatalChartSyncResult } from './natalChartSyncCore';

export type InterviewStrategyPlanSyncResult = {
  payload: InterviewStrategyPlanResponse;
  autoEnabled: boolean;
};

export type InterviewStrategyPlanSyncDeps = {
  fetchInterviewStrategyPlan: (options?: { refresh?: boolean }) => Promise<InterviewStrategyPlanResponse>;
  upsertInterviewStrategySettings: (input: { enabled: boolean; timezoneIana: string }) => Promise<InterviewStrategySettingsResponse>;
  syncNatalChartCache: () => Promise<NatalChartSyncResult>;
  resolveTimezoneIana: () => string;
};

export async function ensureInterviewStrategyPlanReady(
  deps: InterviewStrategyPlanSyncDeps,
  options?: { autoEnable?: boolean }
): Promise<InterviewStrategyPlanSyncResult> {
  const initialPayload = await deps.fetchInterviewStrategyPlan({ refresh: false });
  const shouldAutoEnable = options?.autoEnable === true && initialPayload.settings.source === 'default';

  if (!shouldAutoEnable) {
    return {
      payload: initialPayload,
      autoEnabled: false,
    };
  }

  const syncResult = await deps.syncNatalChartCache();
  if (syncResult.status !== 'synced') {
    throw new Error(syncResult.errorText);
  }

  await deps.upsertInterviewStrategySettings({
    enabled: true,
    timezoneIana: deps.resolveTimezoneIana(),
  });

  return {
    payload: await deps.fetchInterviewStrategyPlan({ refresh: false }),
    autoEnabled: true,
  };
}
