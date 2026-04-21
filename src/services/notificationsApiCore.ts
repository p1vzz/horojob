import type {
  InterviewStrategyPlan,
  InterviewStrategyPreferences,
} from '../types/interviewStrategy';

export type PushTokenPlatform = 'ios' | 'android' | 'web';
export type BurnoutSeverity = 'none' | 'warn' | 'high' | 'critical';
export type LunarProductivitySeverity = 'none' | 'warn' | 'high' | 'critical';
export type LunarProductivityImpactDirection = 'supportive' | 'disruptive';

export type BurnoutSettings = {
  enabled: boolean;
  timezoneIana: string;
  workdayStartMinute: number;
  workdayEndMinute: number;
  quietHoursStartMinute: number;
  quietHoursEndMinute: number;
  updatedAt: string | null;
  source: 'default' | 'saved';
};

export type LunarProductivitySettings = {
  enabled: boolean;
  timezoneIana: string;
  workdayStartMinute: number;
  workdayEndMinute: number;
  quietHoursStartMinute: number;
  quietHoursEndMinute: number;
  updatedAt: string | null;
  source: 'default' | 'saved';
};

export type BurnoutPlanResponse = {
  dateKey: string;
  enabled: boolean;
  settings: BurnoutSettings;
  risk: {
    algorithmVersion: string;
    score: number;
    severity: BurnoutSeverity;
    components: {
      saturnLoad: number;
      moonLoad: number;
      workloadMismatch: number;
      tagPressure: number;
      recoveryBuffer: number;
    };
    signals: {
      saturnHardCount: number;
      moonHardCount: number;
      saturnMoonHard: number;
      riskTagContextSwitch: number;
      riskTagRushBias: number;
      positiveAspectStrength: number;
      momentum: {
        energy: number;
        focus: number;
      };
      saturn: {
        house: number | null;
        retrograde: boolean;
      };
      moon: {
        house: number | null;
      };
    };
  };
  timing: {
    algorithmVersion: string;
    nextPlannedAt: string | null;
    status: 'planned' | 'sent' | 'failed' | 'skipped' | 'cancelled' | 'not_scheduled';
    scheduledDateKey: string | null;
    scheduledSeverity: Exclude<BurnoutSeverity, 'none'> | null;
  };
};

export type LunarProductivityPlanResponse = {
  dateKey: string;
  enabled: boolean;
  settings: LunarProductivitySettings;
  risk: {
    algorithmVersion: string;
    score: number;
    severity: LunarProductivitySeverity;
    impactDirection: LunarProductivityImpactDirection | null;
    components: {
      moonPhaseLoad: number;
      emotionalTide: number;
      focusResonance: number;
      circadianAlignment: number;
      recoveryBuffer: number;
    };
    signals: {
      moonPhase:
        | 'new_moon'
        | 'waxing_crescent'
        | 'first_quarter'
        | 'waxing_gibbous'
        | 'full_moon'
        | 'waning_gibbous'
        | 'last_quarter'
        | 'waning_crescent';
      illuminationPercent: number;
      moonHouse: number | null;
      hardAspectCount: number;
      supportiveAspectStrength: number;
      momentum: {
        energy: number;
        focus: number;
      };
    };
  };
  timing: {
    algorithmVersion: string;
    nextPlannedAt: string | null;
    status: 'planned' | 'sent' | 'failed' | 'skipped' | 'cancelled' | 'not_scheduled';
    scheduledDateKey: string | null;
    scheduledSeverity: Exclude<LunarProductivitySeverity, 'none'> | null;
  };
};

export type LunarProductivitySeenResponse = {
  acknowledged: boolean;
  reason: 'already_sent' | 'outside_display_range' | 'date_mismatch' | null;
  dateKey: string;
  impactDirection: LunarProductivityImpactDirection | null;
  timingStatus: LunarProductivityPlanResponse['timing']['status'];
};

export type BurnoutSeenResponse = {
  acknowledged: boolean;
  reason: 'already_sent' | 'below_threshold' | 'date_mismatch' | null;
  dateKey: string;
  timingStatus: BurnoutPlanResponse['timing']['status'];
};

export type PushTokenResponse = {
  token: {
    platform: PushTokenPlatform;
    active: boolean;
    updatedAt: string;
    lastSeenAt: string;
  };
};

export type BurnoutSettingsResponse = {
  settings: BurnoutSettings;
};

export type LunarProductivitySettingsResponse = {
  settings: LunarProductivitySettings;
};

export type InterviewStrategySettings = InterviewStrategyPreferences & {
  enabled: boolean;
  timezoneIana: string;
  autoFillConfirmedAt: string | null;
  autoFillStartAt: string | null;
  filledUntilDateKey: string | null;
  lastGeneratedAt: string | null;
  updatedAt: string | null;
  source: 'default' | 'saved';
};

export type InterviewStrategyPlanResponse = {
  enabled: boolean;
  settings: InterviewStrategySettings;
  plan: InterviewStrategyPlan & {
    filledUntilDateKey: string | null;
  };
};

export type InterviewStrategySettingsResponse = {
  settings: InterviewStrategySettings;
};

type NotificationsRequestInit = RequestInit & {
  timeoutMs?: number;
};

export const INTERVIEW_STRATEGY_SETTINGS_TIMEOUT_MS = 15_000;
export const INTERVIEW_STRATEGY_PLAN_TIMEOUT_MS = 90_000;
export const INTERVIEW_STRATEGY_REFRESH_TIMEOUT_MS = 90_000;

export type NotificationsApiDeps = {
  authorizedFetch: (path: string, init?: NotificationsRequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

export function createNotificationsApi(deps: NotificationsApiDeps) {
  const upsertPushNotificationToken = async (input: {
    token: string;
    platform: PushTokenPlatform;
    appVersion?: string | null;
  }) => {
    const response = await deps.authorizedFetch('/api/notifications/push-token', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: input.token,
        platform: input.platform,
        appVersion: input.appVersion ?? null,
      }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to upsert push token', payload);
    }
    return payload as PushTokenResponse;
  };

  const upsertBurnoutSettings = async (input: {
    enabled: boolean;
    timezoneIana: string;
    workdayStartMinute: number;
    workdayEndMinute: number;
    quietHoursStartMinute: number;
    quietHoursEndMinute: number;
  }) => {
    const response = await deps.authorizedFetch('/api/notifications/burnout-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to save burnout settings', payload);
    }
    return payload as BurnoutSettingsResponse;
  };

  const fetchBurnoutPlan = async () => {
    const response = await deps.authorizedFetch('/api/notifications/burnout-plan');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch burnout plan', payload);
    }
    return payload as BurnoutPlanResponse;
  };

  const markBurnoutSeen = async (input: { dateKey: string }) => {
    const response = await deps.authorizedFetch('/api/notifications/burnout-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to acknowledge burnout insight', payload);
    }
    return payload as BurnoutSeenResponse;
  };

  const upsertLunarProductivitySettings = async (input: {
    enabled: boolean;
    timezoneIana: string;
    workdayStartMinute: number;
    workdayEndMinute: number;
    quietHoursStartMinute: number;
    quietHoursEndMinute: number;
  }) => {
    const response = await deps.authorizedFetch('/api/notifications/lunar-productivity-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to save lunar productivity settings', payload);
    }
    return payload as LunarProductivitySettingsResponse;
  };

  const fetchLunarProductivityPlan = async () => {
    const response = await deps.authorizedFetch('/api/notifications/lunar-productivity-plan');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch lunar productivity plan', payload);
    }
    return payload as LunarProductivityPlanResponse;
  };

  const markLunarProductivitySeen = async (input: { dateKey: string }) => {
    const response = await deps.authorizedFetch('/api/notifications/lunar-productivity-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to acknowledge lunar productivity insight', payload);
    }
    return payload as LunarProductivitySeenResponse;
  };

  const upsertInterviewStrategySettings = async (input: {
    enabled: boolean;
    timezoneIana: string;
    slotDurationMinutes?: 30 | 45 | 60;
    allowedWeekdays?: number[];
    workdayStartMinute?: number;
    workdayEndMinute?: number;
    quietHoursStartMinute?: number;
    quietHoursEndMinute?: number;
    slotsPerWeek?: number;
  }) => {
    const response = await deps.authorizedFetch('/api/notifications/interview-strategy-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      timeoutMs: INTERVIEW_STRATEGY_SETTINGS_TIMEOUT_MS,
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to save interview strategy settings', payload);
    }
    return payload as InterviewStrategySettingsResponse;
  };

  const fetchInterviewStrategyPlan = async (options?: { refresh?: boolean }) => {
    const query = new URLSearchParams({
      refresh: options?.refresh ? 'true' : 'false',
    });
    const response = await deps.authorizedFetch(`/api/notifications/interview-strategy-plan?${query.toString()}`, {
      timeoutMs: options?.refresh ? INTERVIEW_STRATEGY_REFRESH_TIMEOUT_MS : INTERVIEW_STRATEGY_PLAN_TIMEOUT_MS,
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch interview strategy plan', payload);
    }
    return payload as InterviewStrategyPlanResponse;
  };

  return {
    upsertPushNotificationToken,
    upsertBurnoutSettings,
    fetchBurnoutPlan,
    markBurnoutSeen,
    upsertLunarProductivitySettings,
    fetchLunarProductivityPlan,
    markLunarProductivitySeen,
    upsertInterviewStrategySettings,
    fetchInterviewStrategyPlan,
  };
}
