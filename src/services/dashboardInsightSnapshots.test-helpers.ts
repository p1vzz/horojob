import type { BurnoutPlanResponse, LunarProductivityPlanResponse } from './notificationsApi';

export function createBurnoutPlan(overrides?: Partial<BurnoutPlanResponse>): BurnoutPlanResponse {
  return {
    dateKey: overrides?.dateKey ?? '2026-03-31',
    enabled: overrides?.enabled ?? true,
    settings: overrides?.settings ?? {
      enabled: true,
      timezoneIana: 'Europe/Warsaw',
      workdayStartMinute: 540,
      workdayEndMinute: 1080,
      quietHoursStartMinute: 1290,
      quietHoursEndMinute: 480,
      updatedAt: null,
      source: 'saved',
    },
    risk: overrides?.risk ?? {
      algorithmVersion: 'burnout-risk-v1',
      score: 85,
      severity: 'critical',
      components: {
        saturnLoad: 47,
        moonLoad: 34,
        workloadMismatch: 24,
        tagPressure: 12,
        recoveryBuffer: 18,
      },
      signals: {
        saturnHardCount: 2,
        moonHardCount: 1,
        saturnMoonHard: 1,
        riskTagContextSwitch: 66,
        riskTagRushBias: 58,
        positiveAspectStrength: 21,
        momentum: {
          energy: 34,
          focus: 28,
        },
        saturn: {
          house: 10,
          retrograde: false,
        },
        moon: {
          house: 6,
        },
      },
    },
    timing: overrides?.timing ?? {
      algorithmVersion: 'burnout-timing-v1',
      nextPlannedAt: '2026-03-31T08:30:00.000Z',
      status: 'planned',
      scheduledDateKey: '2026-03-31',
      scheduledSeverity: 'critical',
    },
  };
}

export function createLunarPlan(overrides?: Partial<LunarProductivityPlanResponse>): LunarProductivityPlanResponse {
  return {
    dateKey: overrides?.dateKey ?? '2026-04-01',
    enabled: overrides?.enabled ?? true,
    settings: overrides?.settings ?? {
      enabled: true,
      timezoneIana: 'Europe/Warsaw',
      workdayStartMinute: 540,
      workdayEndMinute: 1080,
      quietHoursStartMinute: 1290,
      quietHoursEndMinute: 480,
      updatedAt: null,
      source: 'saved',
    },
    risk: overrides?.risk ?? {
      algorithmVersion: 'lunar-productivity-risk-v1',
      score: 78,
      severity: 'high',
      components: {
        moonPhaseLoad: 42,
        emotionalTide: 36,
        focusResonance: 24,
        circadianAlignment: 32,
        recoveryBuffer: 21,
      },
      signals: {
        moonPhase: 'waxing_gibbous',
        illuminationPercent: 68,
        moonHouse: 6,
        hardAspectCount: 2,
        supportiveAspectStrength: 17,
        momentum: {
          energy: 39,
          focus: 31,
        },
      },
    },
    timing: overrides?.timing ?? {
      algorithmVersion: 'lunar-productivity-timing-v1',
      nextPlannedAt: '2026-04-01T08:30:00.000Z',
      status: 'planned',
      scheduledDateKey: '2026-04-01',
      scheduledSeverity: 'high',
    },
  };
}
