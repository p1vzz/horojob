import React from 'react';
import { Alert } from 'react-native';
import type { WritableCalendarOption } from '../../services/calendar';
import {
  getCalendarPermissionState,
  listWritableCalendarOptions,
  removeInterviewStrategyCalendarEvents,
  requestCalendarPermission,
  resolvePreferredCalendarId,
  syncInterviewStrategyCalendarEvents,
} from '../../services/calendar';
import { trackAnalyticsEvent } from '../../services/analytics';
import { ApiError, ensureAuthSession } from '../../services/authSession';
import { syncNatalChartCache } from '../../services/natalChartSync';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import { syncInterviewStrategyPlan } from '../../services/interviewStrategyPlanSync';
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
import { resolveInterviewStrategyPreparationAlert } from './interviewStrategySettingsCore';
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
  const [isRemovingInterviewCalendarEvents, setIsRemovingInterviewCalendarEvents] = React.useState(false);
  const [isSavingInterviewSettings, setIsSavingInterviewSettings] = React.useState(false);
  const [interviewSyncSummary, setInterviewSyncSummary] = React.useState<string | null>(null);
  const [interviewErrorText, setInterviewErrorText] = React.useState<string | null>(null);

  const selectedInterviewCalendarOption = interviewSelectedCalendarId
    ? interviewCalendarOptions.find((option) => option.id === interviewSelectedCalendarId) ?? null
    : null;
  const hasInterviewCalendarEvents = Object.keys(interviewCalendarSyncMap).length > 0;

  const resolveActiveUserId = async () => {
    if (sessionUserId) return sessionUserId;
    const session = await ensureAuthSession();
    setSessionUserId(session.user.id);
    return session.user.id;
  };

  const ensureInterviewStrategyNatalChartReady = async () => {
    const syncResult = await syncNatalChartCache();
    if (syncResult.status === 'synced') return;
    throw new Error(syncResult.errorText);
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
    setInterviewErrorText(null);
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
        Alert.alert('No Windows to Add', 'Interview windows are still preparing, or there are no standout windows right now.');
      }
      return;
    }
    if (isSyncingInterviewCalendar || isRemovingInterviewCalendarEvents) return;

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
              'Enable calendar access in system settings to add interview reminders.'
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

        const summary =
          syncResult.failed > 0
            ? 'Some calendar reminders could not be updated. Try again in a moment.'
            : 'Calendar reminders are up to date.';
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
          Alert.alert('Calendar Updated', summary);
        }
      } catch {
        if (!silent) {
          Alert.alert('Sync Failed', 'Could not update interview reminders right now.');
        }
      } finally {
        setIsSyncingInterviewCalendar(false);
      }
    })();
  };

  const removeInterviewCalendarEvents = async (options?: { requestPermission?: boolean; silent?: boolean }) => {
    const requestPermission = options?.requestPermission ?? true;
    const silent = options?.silent ?? false;
    if (isRemovingInterviewCalendarEvents) return null;

    setIsRemovingInterviewCalendarEvents(true);
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

      const userId = await resolveActiveUserId();
      await saveInterviewStrategyCalendarPermissionCacheForUser(userId, permissionCache);

      if (permissionState.status !== 'granted') {
        if (!silent) {
          Alert.alert(
            'Calendar Permission Required',
            permissionState.canAskAgain
              ? 'Allow calendar access to remove Horojob interview windows from this device.'
              : 'Enable calendar access in system settings to remove Horojob interview windows.'
          );
        }
        return null;
      }

      const result = await removeInterviewStrategyCalendarEvents({
        plan: interviewPlan,
        existingMap: interviewCalendarSyncMap,
      });
      setInterviewCalendarSyncMap(result.map);
      await saveInterviewStrategyCalendarSyncMapForUser(userId, result.map);

      const summary =
        result.deleted > 0
          ? 'Removed Horojob interview reminders from this device.'
          : 'No Horojob interview reminders were found on this device.';
      const detail = result.failed > 0 ? `${summary} Some reminders could not be removed.` : summary;
      setInterviewSyncSummary(detail);

      trackAnalyticsEvent('interview_strategy_calendar_remove_completed', {
        deleted: result.deleted,
        failed: result.failed,
        notFound: result.notFound,
        skipped: result.skipped,
        scanned: result.scanned,
        source: silent ? 'auto' : 'manual',
      });

      if (!silent) {
        Alert.alert('Calendar Cleaned Up', detail);
      }

      return result;
    } catch {
      if (!silent) {
        Alert.alert('Calendar Cleanup Failed', 'Could not remove interview windows from calendar right now.');
      }
      return null;
    } finally {
      setIsRemovingInterviewCalendarEvents(false);
    }
  };

  const handleRemoveInterviewStrategyFromCalendar = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_calendar_remove' });
      navigateToPremium();
      return;
    }
    if (isSyncingInterviewCalendar || isRemovingInterviewCalendarEvents || isSavingInterviewSettings) return;
    trackAnalyticsEvent('interview_strategy_calendar_remove_tapped', {
      hasCalendarEvents: hasInterviewCalendarEvents,
    });
    void removeInterviewCalendarEvents({ requestPermission: true, silent: false });
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
    setInterviewErrorText(null);

    if (effectivePlan !== 'premium') {
      return;
    }

    try {
      const { payload: interviewPayload } = await syncInterviewStrategyPlan({ autoEnable: true });
      if (!isMounted()) return;

      setInterviewSettings(interviewPayload.settings);
      setInterviewPlan(interviewPayload.plan);
      setIsInterviewSectionExpanded(Boolean(interviewPayload.settings.enabled));

      if (interviewPayload.settings.enabled) {
        trackAnalyticsEvent('interview_strategy_settings_panel_viewed', {
          source: 'settings_bootstrap',
          slotCount: interviewPayload.plan.slots.length,
          hasCalendarEvents: Object.keys(savedInterviewSyncMap).length > 0,
        });
        if (interviewPayload.plan.slots.length === 0) {
          trackAnalyticsEvent('interview_strategy_no_slots_shown', {
            source: 'settings_bootstrap',
          });
        }
      }

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
        setInterviewErrorText(null);
        return;
      }
      const alert = resolveInterviewStrategyPreparationAlert(error);
      setInterviewErrorText(alert.message);
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
    if (
      isSyncingInterviewCalendar ||
      isRemovingInterviewCalendarEvents ||
      isGeneratingInterviewPlan ||
      isSavingInterviewSettings ||
      isLoadingInterviewCalendars
    ) return;
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
    if (isSyncingInterviewCalendar || isRemovingInterviewCalendarEvents || isGeneratingInterviewPlan || isSavingInterviewSettings) return;
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

  const handleRetryInterviewStrategy = () => {
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_retry' });
      navigateToPremium();
      return;
    }
    if (isGeneratingInterviewPlan) return;

    trackAnalyticsEvent('interview_strategy_retry_tapped', {
      plannerMode: 'fixed_natal_sparse',
    });

    setIsGeneratingInterviewPlan(true);
    setInterviewSyncSummary(null);
    setInterviewErrorText(null);

    void (async () => {
      try {
        const { payload: generatedPayload } = await syncInterviewStrategyPlan({ autoEnable: true });
        const generatedPlan = generatedPayload.plan;
        const generatedSettings = generatedPayload.settings;
        setInterviewSettings(generatedSettings);
        setInterviewPlan(generatedPlan);
        setIsInterviewSectionExpanded(Boolean(generatedSettings.enabled));

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
          filledUntilDateKey: generatedPlan.filledUntilDateKey ?? generatedSettings.filledUntilDateKey,
        });

        if (generatedPlan.slots.length === 0) {
          trackAnalyticsEvent('interview_strategy_no_slots_shown', {
            plannerMode: 'fixed_natal_sparse',
            source: 'settings_retry',
          });
          Alert.alert(
            'No Standout Windows',
            'No interview windows are strong enough to recommend right now. We will keep checking automatically.'
          );
        }
      } catch (error) {
        const alert = resolveInterviewStrategyPreparationAlert(error);
        setInterviewErrorText(alert.message);
        trackAnalyticsEvent('interview_strategy_retry_failed', {
          message: alert.message,
        });
        Alert.alert(alert.title, alert.message);
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
      trackAnalyticsEvent('interview_strategy_no_slots_shown', {
        source: 'settings_calendar_sync',
      });
      Alert.alert('No Windows to Add', 'Interview windows are still preparing, or there are no standout windows right now.');
      return;
    }

    trackAnalyticsEvent('interview_strategy_calendar_add_tapped', {
      slotCount: interviewPlan.slots.length,
      hasExistingCalendarEvents: hasInterviewCalendarEvents,
    });

    Alert.alert(
      'Calendar Access',
      'Horojob needs calendar access to add your interview calendar reminders. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            trackAnalyticsEvent('interview_strategy_calendar_add_confirmed', {
              slotCount: interviewPlan.slots.length,
            });
            performInterviewCalendarSync();
          },
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
    if (isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar || isRemovingInterviewCalendarEvents) return;

    const nextEnabled = !(interviewSettings?.enabled ?? false);
    const timezoneIana = interviewPlan?.timezoneIana ?? resolveDeviceTimezoneIana();
    const settingsPayload = {
      enabled: nextEnabled,
      timezoneIana,
    };

    setIsSavingInterviewSettings(true);
    setInterviewErrorText(null);
    void (async () => {
      try {
        if (nextEnabled) {
          await ensureInterviewStrategyNatalChartReady();
        }

        const saved = await upsertInterviewStrategySettings(settingsPayload);
        const savedSettings = saved.settings;
        setInterviewSettings(savedSettings);

        if (!nextEnabled) {
          setInterviewPlan(null);
          setIsInterviewSectionExpanded(false);
          setIsInterviewCalendarListVisible(false);
          setInterviewSyncSummary(null);
          const removalResult = await removeInterviewCalendarEvents({ requestPermission: true, silent: true });
          const cleanupText = removalResult
            ? removalResult.deleted > 0
              ? 'Removed Horojob calendar reminders from this device.'
              : 'No Horojob calendar reminders were found on this device.'
            : 'Calendar reminders could not be checked right now.';
          trackAnalyticsEvent('interview_strategy_toggle_changed', {
            enabled: false,
            calendarDeleted: removalResult?.deleted ?? null,
            calendarFailed: removalResult?.failed ?? null,
          });
          Alert.alert('Interview Strategy Disabled', `Interview Strategy is turned off. ${cleanupText}`);
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

        trackAnalyticsEvent('interview_strategy_toggle_changed', {
          enabled: true,
          slotCount: interviewPayload.plan.slots.length,
        });

        Alert.alert('Interview Strategy Enabled', 'Interview Strategy is on. We will keep your timing windows ready automatically.');
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
        if (nextEnabled) {
          const alert = resolveInterviewStrategyPreparationAlert(error);
          setInterviewErrorText(alert.message);
          Alert.alert(alert.title, alert.message);
          return;
        }
        Alert.alert('Update Failed', 'Could not update interview strategy right now. Try again in a moment.');
      } finally {
        setIsSavingInterviewSettings(false);
      }
    })();
  };

  const handleInterviewFeatureRowPress = () => {
    if (isSavingInterviewSettings || isGeneratingInterviewPlan || isSyncingInterviewCalendar || isRemovingInterviewCalendarEvents) return;
    if (plan !== 'premium') {
      trackAnalyticsEvent('interview_strategy_premium_gate_hit', { source: 'settings_row' });
      navigateToPremium();
      return;
    }
    if (!(interviewSettings?.enabled ?? false)) {
      return;
    }

    const nextExpanded = !isInterviewSectionExpanded;
    setIsInterviewSectionExpanded(nextExpanded);
    if (!nextExpanded) return;

    trackAnalyticsEvent('interview_strategy_opened', { source: 'settings' });
    trackAnalyticsEvent('interview_strategy_settings_panel_viewed', {
      source: 'settings_row',
      slotCount: interviewPlan?.slots.length ?? null,
      hasCalendarEvents: hasInterviewCalendarEvents,
    });
    if (interviewCalendarPermissionCache?.status === 'granted' && interviewCalendarOptions.length === 0) {
      void refreshInterviewCalendarOptions({ requestPermission: false, silent: true });
    }
  };

  return {
    bootstrapInterviewState,
    handleAddInterviewStrategyToCalendar,
    handleRemoveInterviewStrategyFromCalendar,
    handleRetryInterviewStrategy,
    handleInterviewFeatureRowPress,
    handleInterviewStrategyToggle,
    handleOpenInterviewCalendarPicker,
    handleSelectInterviewCalendar,
    interviewCalendarOptions,
    interviewCalendarPermissionCache,
    interviewPlan,
    interviewSelectedCalendarId,
    interviewSettings,
    interviewErrorText,
    hasInterviewCalendarEvents,
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
  };
}
