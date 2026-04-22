import React from 'react';
import { ActivityIndicator, Alert, View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { JobParserQualityCard } from '../components/JobParserQualityCard';
import { MorningBriefingWidgetVariantPicker } from '../components/MorningBriefingWidgetVariantPicker';
import {
  fetchBirthProfile,
  fetchDailyTransit,
  upsertBirthProfile,
  type BirthProfileEditLock,
  type BirthProfileResponse,
} from '../services/astrologyApi';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { syncCareerVibePlanCache } from '../services/careerVibePlanSync';
import { syncInterviewStrategyPlan } from '../services/interviewStrategyPlanSync';
import { syncMorningBriefingCache } from '../services/morningBriefingSync';
import { syncNatalChartCache } from '../services/natalChartSync';
import type { AppNavigationProp, AppScreenProps } from '../types/navigation';
import { clearCareerVibePlanForUser } from '../utils/careerVibePlanStorage';
import { clearMorningBriefingForUser } from '../utils/morningBriefingStorage';
import { clearNatalChartCacheForUser } from '../utils/natalChartStorage';
import { saveOnboardingForUser } from '../utils/onboardingStorage';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';
import {
  SettingsBirthDetailsSection,
  type BirthProfileRecalculationStep,
  SettingsInterviewStrategyPanel,
  SettingsPremiumFeaturesSection,
  SettingsSubscriptionSection,
} from './settings/SettingsSections';
import {
  createBirthProfileDraft,
  shouldShowSettingsInitialLoader,
  validateBirthProfileDraft,
  type BirthProfileDraft,
  type SettingsBirthProfileLoadState,
} from './settingsScreenCore';
import { buildSettingsPremiumFeaturesViewModel } from './settings/settingsPremiumFeaturesViewModel';
import { useInterviewStrategySettings } from './settings/useInterviewStrategySettings';
import { useMorningBriefingSettings } from './settings/useMorningBriefingSettings';
import { usePremiumNotificationSettings } from './settings/usePremiumNotificationSettings';
import { useSettingsBootstrap } from './settings/useSettingsBootstrap';

type BirthProfileRecalculationStepId =
  | 'save'
  | 'natal'
  | 'daily'
  | 'career'
  | 'alerts'
  | 'morning'
  | 'interview'
  | 'app';

function createBirthRecalculationSteps(plan: 'free' | 'premium'): BirthProfileRecalculationStep[] {
  const steps: BirthProfileRecalculationStep[] = [
    { id: 'save', label: 'Saving birth details', status: 'pending' },
    { id: 'natal', label: 'Preparing natal chart', status: 'pending' },
    { id: 'daily', label: 'Refreshing daily transit and AI synergy', status: 'pending' },
    { id: 'career', label: 'Refreshing Career Vibe', status: 'pending' },
  ];

  if (plan === 'premium') {
    steps.push(
      { id: 'alerts', label: 'Refreshing premium alert plans', status: 'pending' },
      { id: 'morning', label: 'Refreshing Morning Briefing', status: 'pending' },
      { id: 'interview', label: 'Refreshing Interview Strategy', status: 'pending' }
    );
  }

  steps.push({ id: 'app', label: 'Refreshing app cache', status: 'pending' });
  return steps;
}

function isFutureLock(editLock: BirthProfileEditLock | null) {
  if (!editLock?.lockedUntil) return false;
  const timestamp = Date.parse(editLock.lockedUntil);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function formatBirthProfileLockMessage(editLock: BirthProfileEditLock | null) {
  if (!isFutureLock(editLock)) return null;
  const lockedUntil = new Date(editLock?.lockedUntil ?? '');
  const dateLabel = lockedUntil.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const durationLabel = editLock?.durationDays ? `${editLock.durationDays} day${editLock.durationDays === 1 ? '' : 's'}` : null;
  return durationLabel
    ? `Birth details are locked after the latest change. Next edit opens ${dateLabel}; this lock is ${durationLabel}.`
    : `Birth details are locked after the latest change. Next edit opens ${dateLabel}.`;
}

function readBirthProfileEditLock(payload: unknown): BirthProfileEditLock | null {
  if (!payload || typeof payload !== 'object') return null;
  const editLock = (payload as { editLock?: unknown }).editLock;
  if (!editLock || typeof editLock !== 'object') return null;
  const candidate = editLock as Partial<BirthProfileEditLock>;
  return {
    lockedUntil: typeof candidate.lockedUntil === 'string' ? candidate.lockedUntil : null,
    retryAfterSeconds: typeof candidate.retryAfterSeconds === 'number' ? candidate.retryAfterSeconds : null,
    lockLevel: typeof candidate.lockLevel === 'number' ? candidate.lockLevel : 0,
    durationDays: typeof candidate.durationDays === 'number' ? candidate.durationDays : null,
  };
}

function SettingsInitialLoader() {
  return (
    <View
      className="rounded-[18px] px-5 py-8 items-center"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <ActivityIndicator size="small" color="#C9A84C" />
      <Text className="text-[13px] font-semibold mt-3" style={{ color: 'rgba(233,233,242,0.9)' }}>
        Preparing settings
      </Text>
      <Text className="text-[12px] text-center mt-1 leading-[17px]" style={{ color: 'rgba(212,212,224,0.48)' }}>
        Syncing account, calendar, and premium feature state.
      </Text>
    </View>
  );
}

export const SettingsScreen = ({ route }: AppScreenProps<'Settings'>) => {
  const navigation = useNavigation<AppNavigationProp<'Settings'>>();
  const queryClient = useQueryClient();
  const { theme } = useThemeMode();
  const { width, height } = useWindowDimensions();
  const handledWidgetSetupKeyRef = React.useRef<number | null>(null);
  const [birthProfile, setBirthProfile] = React.useState<BirthProfileResponse['profile'] | null>(null);
  const [birthProfileLoadState, setBirthProfileLoadState] = React.useState<SettingsBirthProfileLoadState>('loading');
  const [birthProfileEditLock, setBirthProfileEditLock] = React.useState<BirthProfileEditLock | null>(null);
  const [birthProfileDraft, setBirthProfileDraft] = React.useState<BirthProfileDraft>(() => createBirthProfileDraft(null));
  const [isEditingBirthProfile, setIsEditingBirthProfile] = React.useState(false);
  const [isSavingBirthProfile, setIsSavingBirthProfile] = React.useState(false);
  const [birthRecalculationSteps, setBirthRecalculationSteps] = React.useState<BirthProfileRecalculationStep[]>([]);
  const [isSettingsBootstrapReady, setIsSettingsBootstrapReady] = React.useState(false);
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
    handleInterviewFeatureRowPress,
    handleInterviewStrategyToggle,
    handleOpenInterviewCalendarPicker,
    handleRemoveInterviewStrategyFromCalendar,
    handleRetryInterviewStrategy,
    handleSelectInterviewCalendar,
    hasInterviewCalendarEvents,
    interviewCalendarOptions,
    interviewCalendarPermissionCache,
    interviewPlan,
    interviewSelectedCalendarId,
    interviewSettings,
    interviewErrorText,
    interviewSyncSummary,
    isGeneratingInterviewPlan,
    isInterviewCalendarListVisible,
    isInterviewSectionExpanded,
    isLoadingInterviewCalendars,
    isRemovingInterviewCalendarEvents,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    resetInterviewState,
    selectedInterviewCalendarOption,
  } = useInterviewStrategySettings({
    navigateToPremium: openPremiumPurchase,
    plan,
  });
  useSettingsBootstrap(
    {
      bootstrapMorningBriefingState,
      bootstrapNotificationState,
      bootstrapInterviewState,
      clearPremiumDependentState,
      resetInterviewState,
      resetMorningBriefingState,
    },
    {
      onStart: () => setIsSettingsBootstrapReady(false),
      onSettled: () => setIsSettingsBootstrapReady(true),
    }
  );

  React.useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const response = await fetchBirthProfile();
        if (!mounted) return;
        setBirthProfile(response?.profile ?? null);
        setBirthProfileDraft(createBirthProfileDraft(response?.profile ?? null));
        setBirthProfileEditLock(response?.editLock ?? null);
        setBirthProfileLoadState(response?.profile ? 'ready' : 'missing');
      } catch {
        if (!mounted) return;
        setBirthProfile(null);
        setBirthProfileDraft(createBirthProfileDraft(null));
        setBirthProfileEditLock(null);
        setBirthProfileLoadState('failed');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!route.params?.openWidgetSetup) return;
    if (!isSettingsBootstrapReady || birthProfileLoadState === 'loading') return;
    if (plan !== 'premium') return;
    const key = route.params.widgetSetupKey ?? 1;
    if (handledWidgetSetupKeyRef.current === key) return;
    handledWidgetSetupKeyRef.current = key;
    openWidgetStylePicker();
  }, [
    birthProfileLoadState,
    isSettingsBootstrapReady,
    openWidgetStylePicker,
    plan,
    route.params?.openWidgetSetup,
    route.params?.widgetSetupKey,
  ]);

  const updateBirthRecalculationStep = (
    id: BirthProfileRecalculationStepId,
    status: BirthProfileRecalculationStep['status']
  ) => {
    setBirthRecalculationSteps((current) => current.map((step) => (step.id === id ? { ...step, status } : step)));
  };

  const handleStartBirthProfileEdit = () => {
    setBirthProfileDraft(createBirthProfileDraft(birthProfile));
    setBirthRecalculationSteps([]);
    setIsEditingBirthProfile(true);
  };

  const handleCancelBirthProfileEdit = () => {
    if (isSavingBirthProfile) return;
    setBirthProfileDraft(createBirthProfileDraft(birthProfile));
    setBirthRecalculationSteps([]);
    setIsEditingBirthProfile(false);
  };

  const handleSaveBirthProfile = () => {
    if (isSavingBirthProfile) return;

    const validation = validateBirthProfileDraft(birthProfileDraft, birthProfile);
    if (!validation.ok) {
      Alert.alert('Check Birth Details', validation.message);
      return;
    }

    if (!validation.changed) {
      setIsEditingBirthProfile(false);
      setBirthRecalculationSteps([]);
      return;
    }

    setBirthRecalculationSteps(createBirthRecalculationSteps(plan));
    setIsSavingBirthProfile(true);

    void (async () => {
      let hadRecalculationFailure = false;
      let saveCompleted = false;

      const runStep = async (id: BirthProfileRecalculationStepId, task: () => Promise<void>) => {
        updateBirthRecalculationStep(id, 'active');
        try {
          await task();
          updateBirthRecalculationStep(id, 'done');
        } catch {
          hadRecalculationFailure = true;
          updateBirthRecalculationStep(id, 'failed');
        }
      };

      try {
        updateBirthRecalculationStep('save', 'active');
        const response = await upsertBirthProfile(validation.input);
        updateBirthRecalculationStep('save', 'done');
        saveCompleted = true;
        setBirthProfile(response.profile);
        setBirthProfileDraft(createBirthProfileDraft(response.profile));
        setBirthProfileEditLock(response.editLock ?? null);
        setBirthProfileLoadState('ready');

        const session = await ensureAuthSession();
        await saveOnboardingForUser(session.user.id, response.profile);
        await Promise.all([
          clearNatalChartCacheForUser(session.user.id),
          clearCareerVibePlanForUser(session.user.id),
          plan === 'premium' ? clearMorningBriefingForUser(session.user.id) : Promise.resolve(),
        ]);

        await runStep('natal', async () => {
          const result = await syncNatalChartCache();
          if (result.status !== 'synced') {
            throw new Error(result.errorText);
          }
        });

        await runStep('daily', async () => {
          await fetchDailyTransit({ includeAiSynergy: true });
        });

        await runStep('career', async () => {
          const result = await syncCareerVibePlanCache({ refresh: true });
          if (result.status === 'failed') {
            throw new Error(result.snapshot.errorText ?? 'Career Vibe did not refresh.');
          }
        });

        if (plan === 'premium') {
          await runStep('alerts', async () => {
            await bootstrapNotificationState('premium');
          });

          await runStep('morning', async () => {
            const result = await syncMorningBriefingCache({ refresh: true });
            if (result.status !== 'synced') {
              throw new Error('Morning Briefing did not refresh.');
            }
          });

          await runStep('interview', async () => {
            await syncInterviewStrategyPlan({ autoEnable: true });
          });
        }

        await runStep('app', async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['aiSynergy'] }),
            queryClient.invalidateQueries({ queryKey: ['dailyTransit'] }),
            queryClient.invalidateQueries({ queryKey: ['careerInsights'] }),
            queryClient.invalidateQueries({ queryKey: ['fullNatalCareerAnalysis'] }),
          ]);
          const bootstrapResult = await bootstrapMorningBriefingState();
          await bootstrapNotificationState(bootstrapResult.effectivePlan);
          if (bootstrapResult.userId) {
            await bootstrapInterviewState(bootstrapResult.userId, bootstrapResult.effectivePlan);
          }
        });

        if (hadRecalculationFailure) {
          Alert.alert('Birth Details Saved', 'Some dependent data did not refresh. Open Settings again or retry the affected feature.');
          return;
        }

        setIsEditingBirthProfile(false);
        Alert.alert('Birth Details Updated', 'Your profile data has been recalculated.');
      } catch (error) {
        if (!saveCompleted) {
          updateBirthRecalculationStep('save', 'failed');
        } else {
          updateBirthRecalculationStep('app', 'failed');
        }
        if (error instanceof ApiError && error.status === 429) {
          const editLock = readBirthProfileEditLock(error.payload);
          setBirthProfileEditLock(editLock);
          Alert.alert('Birth Details Locked', formatBirthProfileLockMessage(editLock) ?? 'Try editing birth details later.');
          return;
        }
        Alert.alert('Update Failed', 'Could not save birth details right now. Try again in a moment.');
      } finally {
        setIsSavingBirthProfile(false);
      }
    })();
  };

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
    isRemovingInterviewCalendarEvents,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    selectedInterviewCalendarOption,
  });
  const isInitialLoading = shouldShowSettingsInitialLoader({
    birthProfileLoadState,
    settingsBootstrapReady: isSettingsBootstrapReady,
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

            {isInitialLoading ? (
              <SettingsInitialLoader />
            ) : (
              <>
                <SettingsBirthDetailsSection
                  draft={birthProfileDraft}
                  isEditing={isEditingBirthProfile}
                  isSaving={isSavingBirthProfile}
                  lockMessage={formatBirthProfileLockMessage(birthProfileEditLock)}
                  profile={birthProfile}
                  loadState={birthProfileLoadState}
                  recalculationSteps={birthRecalculationSteps}
                  onCancelEdit={handleCancelBirthProfileEdit}
                  onChangeDraft={setBirthProfileDraft}
                  onSave={handleSaveBirthProfile}
                  onStartEdit={handleStartBirthProfileEdit}
                />

                <SettingsSubscriptionSection plan={plan} onOpenPremium={openPremiumPurchase} />

                <SettingsPremiumFeaturesSection
                  plan={plan}
                  featureStates={premiumFeatureStates}
                  onOpenWidgetStylePicker={openWidgetStylePicker}
                  footerText={premiumFeaturesFooterText}
                  widgetVariantLabel={widgetVariantLabel}
                >
                  {plan === 'premium' && isInterviewSectionExpanded ? (
                    <SettingsInterviewStrategyPanel
                      interviewCalendarOptions={interviewCalendarOptions}
                      interviewPlan={interviewPlan}
                      interviewSelectedCalendarId={interviewSelectedCalendarId}
                      interviewSettings={interviewSettings}
                      interviewErrorText={interviewErrorText}
                      hasInterviewCalendarEvents={hasInterviewCalendarEvents}
                      interviewSyncSummary={interviewSyncSummary}
                      isGeneratingInterviewPlan={isGeneratingInterviewPlan}
                      isInterviewCalendarListVisible={isInterviewCalendarListVisible}
                      isLoadingInterviewCalendars={isLoadingInterviewCalendars}
                      isRemovingInterviewCalendarEvents={isRemovingInterviewCalendarEvents}
                      isSavingInterviewSettings={isSavingInterviewSettings}
                      isSyncingInterviewCalendar={isSyncingInterviewCalendar}
                      onAddToCalendar={handleAddInterviewStrategyToCalendar}
                      onRemoveFromCalendar={handleRemoveInterviewStrategyFromCalendar}
                      onRetry={handleRetryInterviewStrategy}
                      onOpenCalendarPicker={handleOpenInterviewCalendarPicker}
                      onSelectInterviewCalendar={handleSelectInterviewCalendar}
                      selectedInterviewCalendarOption={selectedInterviewCalendarOption}
                    />
                  ) : null}
                </SettingsPremiumFeaturesSection>

                {SHOULD_EXPOSE_TECHNICAL_SURFACES ? <JobParserQualityCard /> : null}

                <View className="items-center mt-12">
                  <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                    HoroJob v1.0.0
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                      Privacy Policy (TODO)
                    </Text>
                    <Text className="mx-3 text-[12px]" style={{ color: 'rgba(212,212,224,0.18)' }}>
                      |
                    </Text>
                    <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.22)' }}>
                      Terms of Service (TODO)
                    </Text>
                  </View>
                </View>
              </>
            )}
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
