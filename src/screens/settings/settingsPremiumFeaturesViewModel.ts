import type { MorningBriefingResponse } from '../../services/astrologyApi';
import type { WritableCalendarOption } from '../../services/calendar';
import type {
  BurnoutSettings,
  InterviewStrategySettings,
  LunarProductivitySettings,
} from '../../services/notificationsApi';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import {
  getMorningBriefingWidgetVariantOption,
  type MorningBriefingWidgetVariantId,
} from '../../services/morningBriefingWidgetVariants';
import type { InterviewStrategyPlan } from '../../types/interviewStrategy';
import type { MorningBriefingSetupState } from '../../utils/morningBriefingStorage';
import { formatInterviewCalendarOptionLabel } from '../settingsScreenCore';
import type { SettingsPremiumFeatureId, SettingsPremiumFeatureState } from './settingsTypes';

type RiskStatusSnapshot = {
  score: number;
  severity: string;
};

type BuildSettingsPremiumFeaturesViewModelArgs = {
  plan: SubscriptionPlan;
  briefing: MorningBriefingResponse | null;
  handleWidgetSetup: () => void;
  isSyncingWidget: boolean;
  setupState: MorningBriefingSetupState;
  widgetVariant: MorningBriefingWidgetVariantId;
  burnoutSettings: BurnoutSettings | null;
  burnoutStatus: RiskStatusSnapshot | null;
  handleBurnoutToggle: () => void;
  isSavingBurnoutSettings: boolean;
  isSyncingBurnout: boolean;
  lunarSettings: LunarProductivitySettings | null;
  lunarStatus: RiskStatusSnapshot | null;
  handleLunarProductivityToggle: () => void;
  isSavingLunarSettings: boolean;
  isSyncingLunar: boolean;
  handleInterviewFeatureRowPress: () => void;
  handleInterviewStrategyToggle: () => void;
  interviewCalendarPermissionStatus: string | null;
  interviewPlan: InterviewStrategyPlan | null;
  interviewSelectedCalendarId: string | null;
  interviewSettings: Pick<InterviewStrategySettings, 'enabled' | 'filledUntilDateKey'> | null;
  isGeneratingInterviewPlan: boolean;
  isSavingInterviewSettings: boolean;
  isSyncingInterviewCalendar: boolean;
  selectedInterviewCalendarOption: WritableCalendarOption | null;
};

type SettingsPremiumFeaturesViewModel = {
  premiumFeatureStates: Record<SettingsPremiumFeatureId, SettingsPremiumFeatureState>;
  premiumFeaturesFooterText: string;
  widgetVariantLabel: string;
};

function toDetailLines(lines: Array<string | null>) {
  return lines.filter((line): line is string => Boolean(line));
}

function formatWidgetVariantLabel(variantId: MorningBriefingWidgetVariantId) {
  const variant = getMorningBriefingWidgetVariantOption(variantId);
  return `${variant.title} (${variant.sizeLabel})`;
}

function resolveFeatureStatusLabel(args: {
  plan: SubscriptionPlan;
  busy: boolean;
  enabled: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const { plan, busy, enabled, activeLabel, inactiveLabel } = args;
  if (plan !== 'premium') return 'Upgrade';
  if (busy) return 'Syncing...';
  return enabled ? activeLabel : inactiveLabel;
}

function resolveWidgetStatusLabel(args: {
  plan: SubscriptionPlan;
  isSyncingWidget: boolean;
  setupState: MorningBriefingSetupState;
}) {
  const { plan, isSyncingWidget, setupState } = args;
  if (plan !== 'premium') return 'Upgrade';
  if (isSyncingWidget) return 'Syncing...';
  if (setupState === 'enabled') return 'Enabled';
  if (setupState === 'pin_requested') return 'Pending';
  return 'Set up';
}

export function buildSettingsPremiumFeaturesViewModel(
  args: BuildSettingsPremiumFeaturesViewModelArgs
): SettingsPremiumFeaturesViewModel {
  const {
    plan,
    briefing,
    handleWidgetSetup,
    isSyncingWidget,
    setupState,
    widgetVariant,
    burnoutSettings,
    burnoutStatus,
    handleBurnoutToggle,
    isSavingBurnoutSettings,
    isSyncingBurnout,
    lunarSettings,
    lunarStatus,
    handleLunarProductivityToggle,
    isSavingLunarSettings,
    isSyncingLunar,
    handleInterviewFeatureRowPress,
    handleInterviewStrategyToggle,
    interviewCalendarPermissionStatus,
    interviewPlan,
    interviewSelectedCalendarId,
    interviewSettings,
    isGeneratingInterviewPlan,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    selectedInterviewCalendarOption,
  } = args;

  const widgetVariantLabel = formatWidgetVariantLabel(widgetVariant);
  const widgetStatusLabel = resolveWidgetStatusLabel({
    plan,
    isSyncingWidget,
    setupState,
  });

  const burnoutEnabled = burnoutSettings?.enabled ?? false;
  const burnoutStatusLabel = resolveFeatureStatusLabel({
    plan,
    busy: isSavingBurnoutSettings || isSyncingBurnout,
    enabled: burnoutEnabled,
    activeLabel: 'Enabled',
    inactiveLabel: 'Off',
  });

  const lunarEnabled = lunarSettings?.enabled ?? false;
  const lunarStatusLabel = resolveFeatureStatusLabel({
    plan,
    busy: isSavingLunarSettings || isSyncingLunar,
    enabled: lunarEnabled,
    activeLabel: 'Enabled',
    inactiveLabel: 'Off',
  });

  const interviewEnabled = interviewSettings?.enabled ?? false;
  const interviewStatusLabel = resolveFeatureStatusLabel({
    plan,
    busy: isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar,
    enabled: interviewEnabled,
    activeLabel: 'Auto',
    inactiveLabel: 'Set up',
  });

  const interviewSlotsLabel = interviewPlan ? `${interviewPlan.slots.length} slots` : null;
  const interviewCalendarTargetLabel = selectedInterviewCalendarOption
    ? `Target ${formatInterviewCalendarOptionLabel(selectedInterviewCalendarOption)}`
    : interviewSelectedCalendarId
      ? 'Target selected'
      : 'Target auto';
  const interviewPermissionLabel = interviewCalendarPermissionStatus
    ? `Calendar ${interviewCalendarPermissionStatus}`
    : null;
  const interviewHorizonLabel = interviewSettings?.filledUntilDateKey
    ? `Filled until ${interviewSettings.filledUntilDateKey}`
    : null;

  return {
    premiumFeatureStates: {
      widget: {
        activeThumbColor: 'rgba(201,168,76,0.9)',
        activeTrackColor: 'rgba(201,168,76,0.32)',
        busy: isSyncingWidget,
        detailLines: toDetailLines([widgetVariantLabel, briefing ? `AI ${briefing.metrics.aiSynergy}%` : null]),
        onPress: handleWidgetSetup,
        statusAccentColor: plan === 'premium' ? '#C9A84C' : 'rgba(212,212,224,0.46)',
        statusLabel: widgetStatusLabel,
        toggleInteractive: false,
        toggleOn: plan === 'premium',
      },
      burnout: {
        activeThumbColor: 'rgba(201,168,76,0.9)',
        activeTrackColor: 'rgba(201,168,76,0.32)',
        busy: isSavingBurnoutSettings || isSyncingBurnout,
        detailLines: toDetailLines([
          burnoutStatus ? `Risk ${burnoutStatus.score}%` : null,
          burnoutStatus ? burnoutStatus.severity.toUpperCase() : null,
        ]),
        onPress: handleBurnoutToggle,
        statusAccentColor: plan === 'premium' ? '#C9A84C' : 'rgba(212,212,224,0.46)',
        statusLabel: burnoutStatusLabel,
        toggleInteractive: false,
        toggleOn: plan === 'premium' && burnoutEnabled,
      },
      lunar: {
        activeThumbColor: 'rgba(245,247,255,0.96)',
        activeTrackColor: 'rgba(245,247,255,0.34)',
        busy: isSavingLunarSettings || isSyncingLunar,
        detailLines: toDetailLines([
          lunarStatus ? `Risk ${lunarStatus.score}%` : null,
          lunarStatus ? lunarStatus.severity.toUpperCase() : null,
        ]),
        onPress: handleLunarProductivityToggle,
        statusAccentColor: plan === 'premium' ? '#F5F7FF' : 'rgba(212,212,224,0.46)',
        statusLabel: lunarStatusLabel,
        toggleInteractive: false,
        toggleOn: plan === 'premium' && lunarEnabled,
      },
      calendar: {
        activeThumbColor: 'rgba(201,168,76,0.9)',
        activeTrackColor: 'rgba(201,168,76,0.32)',
        busy: isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar,
        detailLines: toDetailLines([
          interviewSlotsLabel,
          interviewPermissionLabel,
          interviewCalendarTargetLabel,
          interviewHorizonLabel,
        ]),
        onPress: handleInterviewFeatureRowPress,
        onTogglePress: handleInterviewStrategyToggle,
        statusAccentColor: plan === 'premium' ? '#C9A84C' : 'rgba(212,212,224,0.46)',
        statusLabel: interviewStatusLabel,
        toggleInteractive: true,
        toggleOn: plan === 'premium' && interviewEnabled,
      },
    },
    premiumFeaturesFooterText:
      plan === 'premium'
        ? 'Manage widget, burnout alerts, lunar productivity, and interview strategy directly from Settings'
        : 'Upgrade to Pro to enable those features',
    widgetVariantLabel,
  };
}
