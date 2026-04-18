import React from 'react';
import { Alert } from 'react-native';
import type { WritableCalendarOption } from '../../services/calendar';
import {
  getCalendarPermissionState,
  listWritableCalendarOptions,
  requestCalendarPermission,
  resolvePreferredCalendarId,
  syncInterviewStrategyCalendarEvents,
} from '../../services/calendar';
import { trackAnalyticsEvent } from '../../services/analytics';
import { ApiError, ensureAuthSession } from '../../services/authSession';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import {
  fetchInterviewStrategyPlan,
  upsertInterviewStrategySettings,
  type InterviewStrategySettings,
} from '../../services/notificationsApi';
import type {
  InterviewStrategyCalendarPermissionCache,
  InterviewStrategyCalendarSyncMap,
  InterviewStrategyPlan,
} from '../../types/interviewStrategy';
import {
  loadInterviewStrategyCalendarPermissionCacheForUser,
  loadInterviewStrategyCalendarSyncMapForUser,
  loadInterviewStrategySelectedCalendarIdForUser,
  saveInterviewStrategyCalendarPermissionCacheForUser,
  saveInterviewStrategyCalendarSyncMapForUser,
  saveInterviewStrategySelectedCalendarIdForUser,
} from '../../utils/interviewStrategyStorage';
import { resolveDeviceTimezoneIana } from '../settingsScreenCore';

export function useInterviewStrategySettings(args: {
  navigateToPremium: () => void;
  plan: SubscriptionPlan;
}) {
  const { navigateToPremium, plan } = args;

  const [sessionUserId, setSessionUserId] = React.useState<string | null>(null);
  const [interviewSettings, setInterviewSettings] = React.useState<InterviewStrategySettings | null>(null);
  const [interviewPlan, setInterviewPlan] = React.useState<InterviewStrategyPlan | null>(null);
  const [interviewCalendarSyncMap, setInterviewCalendarSyncMap] = React.useState<InterviewStrategyCalendarSyncMap>({});
  const [interviewCalendarPermissionCache, setInterviewCalendarPermissionCache] =
    React.useState<InterviewStrategyCalendarPermissionCache | null>(null);
  const [interviewSelectedCalendarId, setInterviewSelectedCalendarId] = React.useState<string | null>(null);
  const [interviewCalendarOptions, setInterviewCalendarOptions] = React.useState<WritableCalendarOption[]>([]);
  const [isInterviewCalendarListVisible, setIsInterviewCalendarListVisible] = React.useState(false);
  const [isLoadingInterviewCalendars, setIsLoadingInterviewCalendars] = React.useState(false);
  const [isInterviewSectionExpanded, setIsInterviewSectionExpanded] = React.useState(false);
  const [isGeneratingInterviewPlan, setIsGeneratingInterviewPlan] = React.useState(false);
  const [isSyncingInterviewCalendar, setIsSyncingInterviewCalendar] = React.useState(false);
  const [isSavingInterviewSettings, setIsSavingInterviewSettings] = React.useState(false);
  const [interviewSyncSummary, setInterviewSyncSummary] = React.useState<string | null>(null);

  const selectedInterviewCalendarOption = interviewSelectedCalendarId
    ? interviewCalendarOptions.find((option) => option.id === interviewSelectedCalendarId) ?? null
    : null;

  const resolveActiveUserId = async () => {
    if (sessionUserId) return sessionUserId;
    const session = await ensureAuthSession();
    setSessionUserId(session.user.id);
    return session.user.id;
  };

  const resetInterviewState = (options?: { clearSessionUserId?: boolean }) => {
    if (options?.clearSessionUserId) {
      setSessionUserId(null);
    }
    setInterviewSettings(null);
    setInterviewPlan(null);
    setInterviewCalendarSyncMap({});
    setInterviewCalendarPermissionCache(null);
    setInterviewSelectedCalendarId(null);
    setInterviewCalendarOptions([]);
    setIsInterviewCalendarListVisible(false);
    setIsInterviewSectionExpanded(false);
    setInterviewSyncSummary(null);
  };

  const performInterviewCalendarSync = (
    planOverride?: InterviewStrategyPlan | null,
    options?: { requestPermission?: boolean; silent?: boolean }
  ) => {
    const targetPlan = planOverride ?? interviewPlan;
    const shouldRequestPermission = options?.requestPermission ?? true;
    const silent = options?.silent ?? false;

    if (!targetPlan || targetPlan.slots.length === 0) {
      if (!silent) {
        Alert.alert('Generate Plan First', 'Generate interview strategy before adding events to calendar.');
      }
      return;
    }
    if (isSyncingInterviewCalendar) return;

    setIsSyncingInterviewCalendar(true);
    setInterviewSyncSummary(null);

    void (async () => {
      try {
        const userId = await resolveActiveUserId();
        const permissionState = shouldRequestPermission
          ? await requestCalendarPermission()
          : await getCalendarPermissionState();
        const permissionCache: InterviewStrategyCalendarPermissionCache = {
          status: permissionState.status,
          canAskAgain: permissionState.canAskAgain,
          updatedAt: new Date().toISOString(),
        };
        setInterviewCalendarPermissionCache(permissionCache);
        await saveInterviewStrategyCalendarPermissionCacheForUser(userId, permissionCache);

        trackAnalyticsEvent('interview_strategy_calendar_permission_result', {
          status: permissionState.status,
          canAskAgain: permissionState.canAskAgain,
          source: silent ? 'auto' : 'manual',
        });

        if (permissionState.status !== 'granted') {
          if (!silent) {
            Alert.alert(
              'Calendar Permission Required',
              'Enable calendar access in system settings to sync interview strategy slots.'
            );
          }
          return;
        }

        const calendarId = await resolvePreferredCalendarId(interviewSelectedCalendarId);
        if (!calendarId) {
          if (!silent) {
            Alert.alert('No Calendar Found', 'No writable calendar was found on this device.');
          }
          return;
        }
        if (interviewSelectedCalendarId !== calendarId) {
          setInterviewSelectedCalendarId(calendarId);
          await saveInterviewStrategySelectedCalendarIdForUser(userId, calendarId);
        }

        const syncResult = await syncInterviewStrategyCalendarEvents({
          plan: targetPlan,
          calendarId,
          existingMap: interviewCalendarSyncMap,
        });
        setInterviewCalendarSyncMap(syncResult.map);
        await saveInterviewStrategyCalendarSyncMapForUser(userId, syncResult.map);

        const summaryParts = [
          `Added ${syncResult.created}`,
          `Updated ${syncResult.updated}`,
          `Skipped ${syncResult.skipped}`,
        ];
        if (syncResult.recovered > 0) {
          summaryParts.push(`Recovered links ${syncResult.recovered}`);
        }
        if (syncResult.pruned > 0) {
          summaryParts.push(`Pruned stale ${syncResult.pruned}`);
        }
        if (syncResult.failed > 0) {
          summaryParts.push(`Failed ${syncResult.failed}`);
        }
        const summary = summaryParts.join(' | ');
        setInterviewSyncSummary(summary);

        trackAnalyticsEvent('interview_strategy_calendar_sync_completed', {
          created: syncResult.created,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          recovered: syncResult.recovered,
          pruned: syncResult.pruned,
          failed: syncResult.failed,
          source: silent ? 'auto' : 'manual',
        });

        if (!silent) {
          Alert.alert('Calendar Sync Complete', summary);
        }
      } catch {
        if (!silent) {
          Alert.alert('Sync Failed', 'Could not sync interview slots to calendar right now.');
        }
      } finally {
        setIsSyncingInterviewCalendar(false);
      }
    })();
  };

  const bootstrapInterviewState = async (
    userId: string,
    effectivePlan: SubscriptionPlan,
    isMounted: () => boolean = () => true
  ) => {
    setSessionUserId(userId);
    const [savedInterviewSyncMap, savedInterviewPermissionCache, savedInterviewSelectedCalendarId] = await Promise.all([
      loadInterviewStrategyCalendarSyncMapForUser(userId),
      loadInterviewStrategyCalendarPermissionCacheForUser(userId),
      loadInterviewStrategySelectedCalendarIdForUser(userId),
    ]);
    if (!isMounted()) return;

    setInterviewSettings(null);
    setInterviewPlan(null);
    setInterviewCalendarSyncMap(savedInterviewSyncMap);
    setInterviewCalendarPermissionCache(savedInterviewPermissionCache);
    setInterviewSelectedCalendarId(savedInterviewSelectedCalendarId);
    setInterviewCalendarOptions([]);
    setIsInterviewCalendarListVisible(false);
    setIsInterviewSectionExpanded(false);
    setInterviewSyncSummary(null);

    if (effectivePlan !== 'premium') {
      return;
    }

    try {
      const interviewPayload = await fetchInterviewStrategyPlan({ refresh: false });
      if (!isMounted()) return;

      setInterviewSettings(interviewPayload.settings);
      setInterviewPlan(interviewPayload.plan);
      setIsInterviewSectionExpanded(Boolean(interviewPayload.settings.enabled || interviewPayload.plan.slots.length > 0));

      if (interviewPayload.settings.enabled && interviewPayload.plan.slots.length > 0) {
        const permissionState = await getCalendarPermissionState();
        if (!isMounted()) return;
        if (permissionState.status === 'granted') {
          void performInterviewCalendarSync(interviewPayload.plan, {
            requestPermission: false,
            silent: true,
          });
        }
      }
    } catch (error) {
      if (!isMounted()) return;
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        setInterviewSettings(null);
        setInterviewPlan(null);
      }
    }
  };

  const refreshInterviewCalendarOptions = async (options?: { requestPermission?: boolean; silent?: boolean }) => {
    const requestPermission = options?.requestPermission ?? false;
    const silent = options?.silent ?? false;
    if (isLoadingInterviewCalendars) return null;

    setIsLoadingInterviewCalendars(true);
    try {
      const permissionState = requestPermission
        ? await requestCalendarPermission()
        : await getCalendarPermissionState();
      const permissionCache: InterviewStrategyCalendarPermissionCache = {
        status: permissionState.status,
        canAskAgain: permissionState.canAskAgain,
        updatedAt: new Date().toISOString(),
      };
      setInterviewCalendarPermissionCache(permissionCache);
      try {
        const userId = await resolveActiveUserId();
        await saveInterviewStrategyCalendarPermissionCacheForUser(userId, permissionCache);
      } catch {
        // Keep local state even if persistence fails.
      }

      if (permissionState.status !== 'granted') {
        if (!silent) {
          Alert.alert('Calendar Permission Required', 'Enable calendar access to pick a target calendar.');
        }
        return null;
      }

      const writableCalendars = await listWritableCalendarOptions();
      setInterviewCalendarOptions(writableCalendars);

      if (writableCalendars.length === 0) {
        if (!silent) {
          Alert.alert('No Calendar Found', 'No writable calendar was found on this device.');
        }
        return [];
      }

      if (interviewSelectedCalendarId && !writableCalendars.some((calendar) => calendar.id === interviewSelectedCalendarId)) {
        setInterviewSelectedCalendarId(null);
        try {
          const userId = await resolveActiveUserId();
          await saveInterviewStrategySelectedCalendarIdForUser(userId, null);
        } catch {
          // Keep UI responsive even if persistence fails.
        }
      }

      return writableCalendars;
    } finally {
      setIsLoadingInterviewCalendars(false);
    }
  };

  const handleOpenInterviewCalendarPicker = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_calendar_picker' });
      navigateToPremium();
      return;
    }
    if (isSyncingInterviewCalendar || isGeneratingInterviewPlan || isSavingInterviewSettings || isLoadingInterviewCalendars) return;
    if (isInterviewCalendarListVisible) {
      setIsInterviewCalendarListVisible(false);
      return;
    }

    void (async () => {
      const calendars = await refreshInterviewCalendarOptions({
        requestPermission: interviewCalendarPermissionCache?.status !== 'granted',
        silent: false,
      });
      if (!calendars || calendars.length === 0) return;
      setIsInterviewCalendarListVisible(true);
    })();
  };

  const handleSelectInterviewCalendar = (calendarId: string | null) => {
    if (isSyncingInterviewCalendar || isGeneratingInterviewPlan || isSavingInterviewSettings) return;
    setInterviewSelectedCalendarId(calendarId);
    setIsInterviewCalendarListVisible(false);
    setInterviewSyncSummary(null);
    void (async () => {
      try {
        const userId = await resolveActiveUserId();
        await saveInterviewStrategySelectedCalendarIdForUser(userId, calendarId);
      } catch {
        // Keep selected calendar in memory even if storage write fails.
      }
    })();
  };

  const handleGenerateInterviewStrategy = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_generate' });
      navigateToPremium();
      return;
    }
    if (isGeneratingInterviewPlan) return;

    trackAnalyticsEvent('interview_strategy_generate_tapped', {
      plannerMode: 'fixed_natal_sparse',
    });

    setIsGeneratingInterviewPlan(true);
    setInterviewSyncSummary(null);

    void (async () => {
      try {
        const timezoneIana = resolveDeviceTimezoneIana();
        const savedSettings = await upsertInterviewStrategySettings({
          enabled: true,
          timezoneIana,
        });

        const generatedPayload = await fetchInterviewStrategyPlan({ refresh: true });
        const generatedPlan = generatedPayload.plan;
        const generatedSettings = generatedPayload.settings;
        setInterviewSettings(generatedSettings);
        setInterviewPlan(generatedPlan);
        setIsInterviewSectionExpanded(true);

        const permissionState = await getCalendarPermissionState();
        if (permissionState.status === 'granted' && generatedSettings.enabled && generatedPlan.slots.length > 0) {
          void performInterviewCalendarSync(generatedPlan, {
            requestPermission: false,
            silent: true,
          });
        }

        trackAnalyticsEvent('interview_strategy_generated', {
          slotCount: generatedPlan.slots.length,
          weekCount: generatedPlan.weeks.length,
          autofillConfirmedAt: generatedSettings.autoFillConfirmedAt,
          autofillStartAt: generatedSettings.autoFillStartAt,
          filledUntilDateKey: generatedPlan.filledUntilDateKey ?? savedSettings.settings.filledUntilDateKey,
        });

        if (generatedPlan.slots.length === 0) {
          trackAnalyticsEvent('interview_strategy_empty_state', {
            plannerMode: 'fixed_natal_sparse',
          });
          Alert.alert(
            'No Recommended Slots',
            'No natal interview windows passed threshold in the next 30 days. Regenerate after your next transit refresh.'
          );
        }
      } catch {
        Alert.alert('Generation Failed', 'Could not generate interview strategy right now. Try again in a moment.');
      } finally {
        setIsGeneratingInterviewPlan(false);
      }
    })();
  };

  const handleAddInterviewStrategyToCalendar = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_calendar_sync' });
      navigateToPremium();
      return;
    }
    if (!interviewPlan || interviewPlan.slots.length === 0) {
      Alert.alert('Generate Plan First', 'Generate interview strategy before adding events to calendar.');
      return;
    }

    Alert.alert(
      'Calendar Access',
      'Horojob needs calendar access to add your interview focus blocks. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => performInterviewCalendarSync(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleInterviewStrategyToggle = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_toggle' });
      navigateToPremium();
      return;
    }
    if (isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar) return;

    const nextEnabled = !(interviewSettings?.enabled ?? false);
    const timezoneIana = interviewPlan?.timezoneIana ?? resolveDeviceTimezoneIana();
    const settingsPayload = {
      enabled: nextEnabled,
      timezoneIana,
    };

    setIsSavingInterviewSettings(true);
    void (async () => {
      try {
        const saved = await upsertInterviewStrategySettings(settingsPayload);
        const savedSettings = saved.settings;
        setInterviewSettings(savedSettings);

        if (!nextEnabled) {
          setInterviewPlan(null);
          setIsInterviewSectionExpanded(false);
          setIsInterviewCalendarListVisible(false);
          setInterviewSyncSummary(null);
          Alert.alert('Interview Strategy Disabled', 'Automatic interview slot planning is now turned off.');
          return;
        }

        setIsInterviewSectionExpanded(true);
        const interviewPayload = await fetchInterviewStrategyPlan({ refresh: false });
        setInterviewSettings(interviewPayload.settings);
        setInterviewPlan(interviewPayload.plan);

        const permissionState = await getCalendarPermissionState();
        if (permissionState.status === 'granted' && interviewPayload.settings.enabled && interviewPayload.plan.slots.length > 0) {
          void performInterviewCalendarSync(interviewPayload.plan, {
            requestPermission: false,
            silent: true,
          });
        }

        Alert.alert('Interview Strategy Enabled', 'Automatic interview slot planning is now active.');
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 403) {
            navigateToPremium();
            return;
          }
          if (error.status === 400) {
            Alert.alert('Invalid Settings', 'Interview strategy settings payload was rejected. Please retry.');
            return;
          }
        }
        Alert.alert('Update Failed', 'Could not update interview strategy right now. Try again in a moment.');
      } finally {
        setIsSavingInterviewSettings(false);
      }
    })();
  };

  const handleInterviewFeatureRowPress = () => {
    if (isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar) return;
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_row' });
      navigateToPremium();
      return;
    }

    const nextExpanded = !isInterviewSectionExpanded;
    setIsInterviewSectionExpanded(nextExpanded);
    if (!nextExpanded) return;

    trackAnalyticsEvent('interview_strategy_opened', { source: 'settings' });
    if (interviewCalendarPermissionCache?.status === 'granted' && interviewCalendarOptions.length === 0) {
      void refreshInterviewCalendarOptions({ requestPermission: false, silent: true });
    }
  };

  return {
    bootstrapInterviewState,
    handleAddInterviewStrategyToCalendar,
    handleGenerateInterviewStrategy,
    handleInterviewFeatureRowPress,
    handleInterviewStrategyToggle,
    handleOpenInterviewCalendarPicker,
    handleSelectInterviewCalendar,
    interviewCalendarOptions,
    interviewCalendarPermissionCache,
    interviewPlan,
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
  };
}
