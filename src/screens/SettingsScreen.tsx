import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { JobParserQualityCard } from '../components/JobParserQualityCard';
import { MorningBriefingWidgetVariantPicker } from '../components/MorningBriefingWidgetVariantPicker';
import type { AppNavigationProp } from '../types/navigation';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  SettingsBirthDetailsSection,
  SettingsInterviewStrategyPanel,
  SettingsPremiumFeaturesSection,
  SettingsSubscriptionSection,
} from './settings/SettingsSections';
import {
  SETTINGS_INTERVIEW_DURATION_OPTIONS,
  SETTINGS_INTERVIEW_WEEKDAY_OPTIONS,
} from './settings/settingsInterviewOptions';
import { buildSettingsPremiumFeaturesViewModel } from './settings/settingsPremiumFeaturesViewModel';
import { useInterviewStrategySettings } from './settings/useInterviewStrategySettings';
import { useMorningBriefingSettings } from './settings/useMorningBriefingSettings';
import { usePremiumNotificationSettings } from './settings/usePremiumNotificationSettings';
import { useSettingsBootstrap } from './settings/useSettingsBootstrap';

const { width, height } = Dimensions.get('window');

export const SettingsScreen = () => {
  const navigation = useNavigation<AppNavigationProp<'Settings'>>();
  const { theme } = useThemeMode();
  const openPremiumPurchase = () => navigation.navigate('PremiumPurchase');
  const clearPremiumDependentState = () => {
    resetNotificationState();
    resetInterviewState({ clearSessionUserId: true });
  };
  const {
    bootstrapMorningBriefingState,
    briefing,
    handleWidgetSetup,
    handleWidgetStyleConfirm,
    isSyncingWidget,
    isWidgetStylePickerVisible,
    openWidgetStylePicker,
    plan,
    resetMorningBriefingState,
    setIsWidgetStylePickerVisible,
    setWidgetVariant,
    setupState,
    widgetVariant,
  } = useMorningBriefingSettings({
    navigateToPremium: openPremiumPurchase,
    onPremiumAccessLost: clearPremiumDependentState,
  });
  const {
    bootstrapNotificationState,
    burnoutSettings,
    burnoutStatus,
    handleBurnoutToggle,
    handleLunarProductivityToggle,
    isSavingBurnoutSettings,
    isSavingLunarSettings,
    isSyncingBurnout,
    isSyncingLunar,
    lunarSettings,
    lunarStatus,
    resetNotificationState,
  } = usePremiumNotificationSettings({
    navigateToPremium: openPremiumPurchase,
    plan,
  });
  const {
    bootstrapInterviewState,
    handleAddInterviewStrategyToCalendar,
    handleCycleInterviewWorkdayEnd,
    handleCycleInterviewWorkdayStart,
    handleGenerateInterviewStrategy,
    handleInterviewDurationChange,
    handleInterviewFeatureRowPress,
    handleInterviewStrategyToggle,
    handleInterviewWeekdayToggle,
    handleOpenInterviewCalendarPicker,
    handleResetInterviewPreferences,
    handleSelectInterviewCalendar,
    handleWidenInterviewWindow,
    interviewCalendarOptions,
    interviewCalendarPermissionCache,
    interviewPlan,
    interviewPreferences,
    interviewSelectedCalendarId,
    interviewSettings,
    interviewSyncSummary,
    isGeneratingInterviewPlan,
    isInterviewCalendarListVisible,
    isInterviewSectionExpanded,
    isLoadingInterviewCalendars,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    resetInterviewState,
    selectedInterviewCalendarOption,
  } = useInterviewStrategySettings({
    navigateToPremium: openPremiumPurchase,
    plan,
  });
  useSettingsBootstrap({
    bootstrapMorningBriefingState,
    bootstrapNotificationState,
    bootstrapInterviewState,
    clearPremiumDependentState,
    resetInterviewState,
    resetMorningBriefingState,
  });

  const { premiumFeatureStates, premiumFeaturesFooterText, widgetVariantLabel } = buildSettingsPremiumFeaturesViewModel({
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
    interviewCalendarPermissionStatus: interviewCalendarPermissionCache?.status ?? null,
    interviewPlan,
    interviewSelectedCalendarId,
    interviewSettings,
    isGeneratingInterviewPlan,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    selectedInterviewCalendarOption,
  });
  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient
              id="settingsGradTop"
              cx="45%"
              cy="-5%"
              rx="70%"
              ry="50%"
              fx="45%"
              fy="-5%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(90,58,204,0.28)" stopOpacity="0.28" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.08)" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="settingsGradBottom"
              cx="80%"
              cy="106%"
              rx="66%"
              ry="46%"
              fx="80%"
              fy="106%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(201,168,76,0.14)" stopOpacity="0.14" />
              <Stop offset="55%" stopColor="rgba(201,168,76,0.04)" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#settingsGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#settingsGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-5 pt-2">
            <View className="flex-row items-center mb-6">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <ChevronLeft size={18} color="rgba(212,212,224,0.75)" />
              </Pressable>
              <Text className="text-[30px] font-semibold tracking-tight" style={{ color: 'rgba(233,233,242,0.96)' }}>
                Settings
              </Text>
            </View>

            <SettingsBirthDetailsSection />

            <SettingsSubscriptionSection plan={plan} onOpenPremium={openPremiumPurchase} />

            <SettingsPremiumFeaturesSection
              plan={plan}
              featureStates={premiumFeatureStates}
              latestBriefing={briefing}
              onOpenWidgetStylePicker={openWidgetStylePicker}
              footerText={premiumFeaturesFooterText}
              widgetVariantLabel={widgetVariantLabel}
            >
              {plan === 'premium' && isInterviewSectionExpanded ? (
                <SettingsInterviewStrategyPanel
                  durationOptions={SETTINGS_INTERVIEW_DURATION_OPTIONS}
                  interviewCalendarOptions={interviewCalendarOptions}
                  interviewPlan={interviewPlan}
                  interviewPreferences={interviewPreferences}
                  interviewSelectedCalendarId={interviewSelectedCalendarId}
                  interviewSettings={interviewSettings}
                  interviewSyncSummary={interviewSyncSummary}
                  isGeneratingInterviewPlan={isGeneratingInterviewPlan}
                  isInterviewCalendarListVisible={isInterviewCalendarListVisible}
                  isLoadingInterviewCalendars={isLoadingInterviewCalendars}
                  isSavingInterviewSettings={isSavingInterviewSettings}
                  isSyncingInterviewCalendar={isSyncingInterviewCalendar}
                  onAddToCalendar={handleAddInterviewStrategyToCalendar}
                  onCycleWorkdayEnd={handleCycleInterviewWorkdayEnd}
                  onCycleWorkdayStart={handleCycleInterviewWorkdayStart}
                  onDurationChange={handleInterviewDurationChange}
                  onGenerate={handleGenerateInterviewStrategy}
                  onOpenCalendarPicker={handleOpenInterviewCalendarPicker}
                  onResetPreferences={handleResetInterviewPreferences}
                  onSelectInterviewCalendar={handleSelectInterviewCalendar}
                  onWeekdayToggle={handleInterviewWeekdayToggle}
                  onWidenWindow={handleWidenInterviewWindow}
                  selectedInterviewCalendarOption={selectedInterviewCalendarOption}
                  weekdayOptions={SETTINGS_INTERVIEW_WEEKDAY_OPTIONS}
                />
              ) : null}
            </SettingsPremiumFeaturesSection>

            {__DEV__ ? <JobParserQualityCard /> : null}

            <View className="items-center mt-12">
              <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                HoroJob v1.0.0
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                  Privacy Policy
                </Text>
                <Text className="mx-3 text-[12px]" style={{ color: 'rgba(212,212,224,0.18)' }}>
                  |
                </Text>
                <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                  Terms of Service
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <MorningBriefingWidgetVariantPicker
          visible={isWidgetStylePickerVisible}
          selectedVariantId={widgetVariant}
          briefing={briefing}
          onSelectVariant={(variantId) => setWidgetVariant(variantId)}
          onConfirm={handleWidgetStyleConfirm}
          onClose={() => setIsWidgetStylePickerVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
};
