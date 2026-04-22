import assert from 'node:assert/strict';
import test from 'node:test';
import type { MorningBriefingResponse } from '../../services/astrologyApi';
import type { WritableCalendarOption } from '../../services/calendar';
import type {
  BurnoutSettings,
  InterviewStrategySettings,
  LunarProductivitySettings,
} from '../../services/notificationsApi';
import { DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT } from '../../services/morningBriefingWidgetVariants';
import type { InterviewStrategyPlan } from '../../types/interviewStrategy';
import { buildSettingsPremiumFeaturesViewModel } from './settingsPremiumFeaturesViewModel';

const noop = () => {};

function createBriefing(aiSynergy = 81): MorningBriefingResponse {
  return {
    cached: true,
    dateKey: '2026-03-31',
    generatedAt: '2026-03-31T08:00:00.000Z',
    schemaVersion: 'v1',
    headline: 'Steady focus',
    summary: 'Use the afternoon for interviews and follow-ups.',
    metrics: {
      energy: 75,
      focus: 72,
      luck: 68,
      aiSynergy,
    },
    modeLabel: 'Steady',
    staleAfter: '2026-04-01T08:00:00.000Z',
    sources: {
      dailyTransitDateKey: '2026-03-31',
      aiSynergyDateKey: '2026-03-31',
    },
  };
}

function createBurnoutSettings(enabled: boolean): BurnoutSettings {
  return {
    enabled,
    timezoneIana: 'Europe/Warsaw',
    workdayStartMinute: 540,
    workdayEndMinute: 1080,
    quietHoursStartMinute: 1290,
    quietHoursEndMinute: 480,
    updatedAt: '2026-03-31T08:00:00.000Z',
    source: 'saved',
  };
}

function createLunarSettings(enabled: boolean): LunarProductivitySettings {
  return {
    enabled,
    timezoneIana: 'Europe/Warsaw',
    workdayStartMinute: 540,
    workdayEndMinute: 1080,
    quietHoursStartMinute: 1290,
    quietHoursEndMinute: 480,
    updatedAt: '2026-03-31T08:00:00.000Z',
    source: 'saved',
  };
}

function createInterviewSettings(enabled: boolean): InterviewStrategySettings {
  return {
    enabled,
    autoFillConfirmedAt: '2026-03-31T08:00:00.000Z',
    autoFillStartAt: '2026-03-31T09:00:00.000Z',
    filledUntilDateKey: '2026-04-07',
    lastGeneratedAt: '2026-03-31T08:00:00.000Z',
    updatedAt: '2026-03-31T08:00:00.000Z',
    source: 'saved',
    timezoneIana: 'Europe/Warsaw',
    slotDurationMinutes: 45,
    allowedWeekdays: [1, 3, 5],
    workdayStartMinute: 540,
    workdayEndMinute: 1080,
    quietHoursStartMinute: 1290,
    quietHoursEndMinute: 480,
    slotsPerWeek: 3,
  };
}

function createInterviewPlan(slotCount: number): InterviewStrategyPlan {
  return {
    strategyId: 'strategy-1',
    algorithmVersion: 'interview-strategy-v1',
    generatedAt: '2026-03-31T08:00:00.000Z',
    horizonDays: 14,
    timezoneIana: 'Europe/Warsaw',
    filledUntilDateKey: '2026-04-07',
    slots: Array.from({ length: slotCount }, (_, index) => ({
      id: `slot-${index + 1}`,
      weekKey: '2026-W14',
      startAt: `2026-04-0${index + 1}T10:00:00.000Z`,
      endAt: `2026-04-0${index + 1}T10:45:00.000Z`,
      timezoneIana: 'Europe/Warsaw',
      score: 86 - index,
      explanation: 'High alignment window',
      breakdown: {
        dailyCareerScore: 80,
        aiSynergyScore: 84,
        weekdayWeight: 1,
        hourWeight: 1,
        conflictPenalty: 0,
      },
    })),
    weeks: [],
  };
}

function createCalendarOption(): WritableCalendarOption {
  return {
    id: 'work',
    title: 'Work',
    sourceName: 'Google',
    isPrimary: false,
  };
}

test('settings premium features view model locks premium rows for free plan', () => {
  const result = buildSettingsPremiumFeaturesViewModel({
    plan: 'free',
    briefing: null,
    handleWidgetSetup: noop,
    isSyncingWidget: false,
    setupState: 'not_eligible',
    widgetVariant: DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
    burnoutSettings: null,
    burnoutStatus: null,
    handleBurnoutToggle: noop,
    isSavingBurnoutSettings: false,
    isSyncingBurnout: false,
    lunarSettings: null,
    lunarStatus: null,
    handleLunarProductivityToggle: noop,
    isSavingLunarSettings: false,
    isSyncingLunar: false,
    handleInterviewFeatureRowPress: noop,
    handleInterviewStrategyToggle: noop,
    interviewCalendarPermissionStatus: null,
    interviewPlan: null,
    interviewSelectedCalendarId: null,
    interviewSettings: null,
    isGeneratingInterviewPlan: false,
    isRemovingInterviewCalendarEvents: false,
    isSavingInterviewSettings: false,
    isSyncingInterviewCalendar: false,
    selectedInterviewCalendarOption: null,
  });

  assert.equal(result.widgetVariantLabel, "Today's Career Vibe (4x2)");
  assert.equal(result.premiumFeaturesFooterText, 'Upgrade to Pro to enable those features');
  assert.equal(result.premiumFeatureStates.widget.statusLabel, 'Upgrade');
  assert.equal(result.premiumFeatureStates.widget.toggleOn, false);
  assert.equal(result.premiumFeatureStates.burnout.statusLabel, 'Upgrade');
  assert.equal(result.premiumFeatureStates.lunar.statusLabel, 'Upgrade');
  assert.equal(result.premiumFeatureStates.calendar.statusLabel, 'Upgrade');
  assert.deepEqual(result.premiumFeatureStates.calendar.detailLines, []);
});

test('settings premium features view model reflects premium feature state details', () => {
  const result = buildSettingsPremiumFeaturesViewModel({
    plan: 'premium',
    briefing: createBriefing(88),
    handleWidgetSetup: noop,
    isSyncingWidget: true,
    setupState: 'enabled',
    widgetVariant: 'strip_peak',
    burnoutSettings: createBurnoutSettings(true),
    burnoutStatus: {
      score: 67,
      severity: 'high',
      nextPlannedAt: '2026-03-31T09:10:00.000Z',
      status: 'planned',
    },
    handleBurnoutToggle: noop,
    isSavingBurnoutSettings: false,
    isSyncingBurnout: false,
    lunarSettings: createLunarSettings(true),
    lunarStatus: {
      score: 84,
      severity: 'high',
      impactDirection: 'disruptive',
      nextPlannedAt: '2026-03-31T09:25:00.000Z',
      status: 'planned',
    },
    handleLunarProductivityToggle: noop,
    isSavingLunarSettings: true,
    isSyncingLunar: false,
    handleInterviewFeatureRowPress: noop,
    handleInterviewStrategyToggle: noop,
    interviewCalendarPermissionStatus: 'granted',
    interviewPlan: createInterviewPlan(2),
    interviewSelectedCalendarId: 'work',
    interviewSettings: createInterviewSettings(true),
    isGeneratingInterviewPlan: false,
    isRemovingInterviewCalendarEvents: false,
    isSavingInterviewSettings: false,
    isSyncingInterviewCalendar: false,
    selectedInterviewCalendarOption: createCalendarOption(),
  });

  assert.equal(result.widgetVariantLabel, 'Peak Strip (4x1)');
  assert.equal(result.premiumFeaturesFooterText, 'Manage widget, burnout alerts, lunar productivity, and interview strategy directly from Settings');
  assert.equal(result.premiumFeatureStates.widget.statusLabel, 'Syncing...');
  assert.deepEqual(result.premiumFeatureStates.widget.detailLines, ['Peak Strip (4x1)', 'AI 88%']);
  assert.equal(result.premiumFeatureStates.burnout.statusLabel, 'Enabled');
  assert.deepEqual(result.premiumFeatureStates.burnout.detailLines, [
    'High strain 67%',
    'Cut switching before taking on more work',
    'Push armed for today',
  ]);
  assert.equal(result.premiumFeatureStates.lunar.statusLabel, 'Syncing...');
  assert.deepEqual(result.premiumFeatureStates.lunar.detailLines, [
    'Disruptive 84%',
    'Protect focus and cut switching',
    'Push armed for today',
  ]);
  assert.equal(result.premiumFeatureStates.calendar.statusLabel, 'Auto');
  assert.deepEqual(result.premiumFeatureStates.calendar.detailLines, [
    'Windows ready',
    'Calendar granted',
    'Target Work - Google',
  ]);
});

test('settings premium features view model keeps widget toggle off until setup is enabled', () => {
  const result = buildSettingsPremiumFeaturesViewModel({
    plan: 'premium',
    briefing: null,
    handleWidgetSetup: noop,
    isSyncingWidget: false,
    setupState: 'eligible_not_prompted',
    widgetVariant: DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
    burnoutSettings: null,
    burnoutStatus: null,
    handleBurnoutToggle: noop,
    isSavingBurnoutSettings: false,
    isSyncingBurnout: false,
    lunarSettings: null,
    lunarStatus: null,
    handleLunarProductivityToggle: noop,
    isSavingLunarSettings: false,
    isSyncingLunar: false,
    handleInterviewFeatureRowPress: noop,
    handleInterviewStrategyToggle: noop,
    interviewCalendarPermissionStatus: null,
    interviewPlan: null,
    interviewSelectedCalendarId: null,
    interviewSettings: null,
    isGeneratingInterviewPlan: false,
    isRemovingInterviewCalendarEvents: false,
    isSavingInterviewSettings: false,
    isSyncingInterviewCalendar: false,
    selectedInterviewCalendarOption: null,
  });

  assert.equal(result.premiumFeatureStates.widget.statusLabel, 'Set up');
  assert.equal(result.premiumFeatureStates.widget.toggleOn, false);
});

test('settings premium features view model keeps lunar row useful outside the dashboard display range', () => {
  const result = buildSettingsPremiumFeaturesViewModel({
    plan: 'premium',
    briefing: null,
    handleWidgetSetup: noop,
    isSyncingWidget: false,
    setupState: 'enabled',
    widgetVariant: DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
    burnoutSettings: createBurnoutSettings(true),
    burnoutStatus: null,
    handleBurnoutToggle: noop,
    isSavingBurnoutSettings: false,
    isSyncingBurnout: false,
    lunarSettings: createLunarSettings(true),
    lunarStatus: {
      score: 67,
      severity: 'high',
      impactDirection: null,
      nextPlannedAt: null,
      status: 'not_scheduled',
    },
    handleLunarProductivityToggle: noop,
    isSavingLunarSettings: false,
    isSyncingLunar: false,
    handleInterviewFeatureRowPress: noop,
    handleInterviewStrategyToggle: noop,
    interviewCalendarPermissionStatus: null,
    interviewPlan: null,
    interviewSelectedCalendarId: null,
    interviewSettings: null,
    isGeneratingInterviewPlan: false,
    isRemovingInterviewCalendarEvents: false,
    isSavingInterviewSettings: false,
    isSyncingInterviewCalendar: false,
    selectedInterviewCalendarOption: null,
  });

  assert.deepEqual(result.premiumFeatureStates.lunar.detailLines, [
    'Elevated 67%',
    'Keep complex work earlier and lighter',
  ]);
});
