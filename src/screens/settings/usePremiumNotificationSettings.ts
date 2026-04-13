import React from 'react';
import { Alert } from 'react-native';
import { ApiError, ensureAuthSession } from '../../services/authSession';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import {
  fetchBurnoutPlan,
  fetchLunarProductivityPlan,
  upsertLunarProductivitySettings,
  upsertBurnoutSettings,
  type BurnoutPlanResponse,
  type BurnoutSettings,
  type LunarProductivityImpactDirection,
  type LunarProductivityPlanResponse,
  type LunarProductivitySettings,
} from '../../services/notificationsApi';
import { registerPushTokenForUser } from '../../services/pushNotifications';
import { resolveDeviceTimezoneIana } from '../settingsScreenCore';

export type BurnoutStatusSnapshot = {
  score: number;
  severity: BurnoutPlanResponse['risk']['severity'];
  nextPlannedAt: string | null;
  status: BurnoutPlanResponse['timing']['status'];
};

export type LunarProductivityStatusSnapshot = {
  score: number;
  severity: LunarProductivityPlanResponse['risk']['severity'];
  impactDirection: LunarProductivityImpactDirection | null;
  nextPlannedAt: string | null;
  status: LunarProductivityPlanResponse['timing']['status'];
};

function toBurnoutStatusSnapshot(payload: BurnoutPlanResponse): BurnoutStatusSnapshot {
  return {
    score: payload.risk.score,
    severity: payload.risk.severity,
    nextPlannedAt: payload.timing.nextPlannedAt,
    status: payload.timing.status,
  };
}

function toLunarStatusSnapshot(payload: LunarProductivityPlanResponse): LunarProductivityStatusSnapshot {
  return {
    score: payload.risk.score,
    severity: payload.risk.severity,
    impactDirection: payload.risk.impactDirection,
    nextPlannedAt: payload.timing.nextPlannedAt,
    status: payload.timing.status,
  };
}

export function usePremiumNotificationSettings(args: {
  navigateToPremium: () => void;
  plan: SubscriptionPlan;
}) {
  const { navigateToPremium, plan } = args;

  const [burnoutSettings, setBurnoutSettings] = React.useState<BurnoutSettings | null>(null);
  const [burnoutStatus, setBurnoutStatus] = React.useState<BurnoutStatusSnapshot | null>(null);
  const [isSyncingBurnout, setIsSyncingBurnout] = React.useState(false);
  const [isSavingBurnoutSettings, setIsSavingBurnoutSettings] = React.useState(false);
  const [lunarSettings, setLunarSettings] = React.useState<LunarProductivitySettings | null>(null);
  const [lunarStatus, setLunarStatus] = React.useState<LunarProductivityStatusSnapshot | null>(null);
  const [isSyncingLunar, setIsSyncingLunar] = React.useState(false);
  const [isSavingLunarSettings, setIsSavingLunarSettings] = React.useState(false);

  const resetNotificationState = () => {
    setBurnoutSettings(null);
    setBurnoutStatus(null);
    setIsSyncingBurnout(false);
    setIsSavingBurnoutSettings(false);
    setLunarSettings(null);
    setLunarStatus(null);
    setIsSyncingLunar(false);
    setIsSavingLunarSettings(false);
  };

  const refreshBurnoutPlan = async () => {
    setIsSyncingBurnout(true);
    try {
      const payload = await fetchBurnoutPlan();
      setBurnoutSettings(payload.settings);
      setBurnoutStatus(toBurnoutStatusSnapshot(payload));
      return payload;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setBurnoutStatus(null);
        return null;
      }
      throw error;
    } finally {
      setIsSyncingBurnout(false);
    }
  };

  const refreshLunarProductivityPlan = async () => {
    setIsSyncingLunar(true);
    try {
      const payload = await fetchLunarProductivityPlan();
      setLunarSettings(payload.settings);
      setLunarStatus(toLunarStatusSnapshot(payload));
      return payload;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setLunarStatus(null);
        return null;
      }
      throw error;
    } finally {
      setIsSyncingLunar(false);
    }
  };

  const bootstrapNotificationState = async (
    effectivePlan: SubscriptionPlan,
    isMounted: () => boolean = () => true
  ) => {
    if (effectivePlan !== 'premium') {
      if (isMounted()) resetNotificationState();
      return;
    }

    try {
      const burnoutPayload = await fetchBurnoutPlan();
      if (!isMounted()) return;
      setBurnoutSettings(burnoutPayload.settings);
      setBurnoutStatus(toBurnoutStatusSnapshot(burnoutPayload));
    } catch (error) {
      if (!isMounted()) return;
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setBurnoutStatus(null);
      }
    }

    try {
      const lunarPayload = await fetchLunarProductivityPlan();
      if (!isMounted()) return;
      setLunarSettings(lunarPayload.settings);
      setLunarStatus(toLunarStatusSnapshot(lunarPayload));
    } catch (error) {
      if (!isMounted()) return;
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setLunarStatus(null);
      }
    }
  };

  const ensurePushNotificationsReady = async (featureName: 'burnout alerts' | 'lunar productivity alerts') => {
    const session = await ensureAuthSession();
    const tokenSyncResult = await registerPushTokenForUser(session.user.id, { forceSync: true });

    if (tokenSyncResult.status === 'permission_denied') {
      Alert.alert(
        'Notifications Required',
        `Enable notifications in system settings to receive ${featureName}.`
      );
      return false;
    }
    if (tokenSyncResult.status === 'unsupported_platform') {
      Alert.alert(
        'Unsupported Platform',
        `${featureName.charAt(0).toUpperCase()}${featureName.slice(1)} are only available on iOS and Android devices.`
      );
      return false;
    }
    if (tokenSyncResult.status === 'missing_project_id' || tokenSyncResult.status === 'token_unavailable') {
      Alert.alert(
        'Push Setup Incomplete',
        'Push token is not available yet. Please retry in a moment.'
      );
      return false;
    }

    return true;
  };

  const handleBurnoutToggle = () => {
    if (plan !== 'premium') {
      navigateToPremium();
      return;
    }
    if (isSavingBurnoutSettings) return;

    const nextEnabled = !(burnoutSettings?.enabled ?? false);
    const settingsPayload = {
      enabled: nextEnabled,
      timezoneIana: resolveDeviceTimezoneIana(),
      workdayStartMinute: burnoutSettings?.workdayStartMinute ?? 540,
      workdayEndMinute: burnoutSettings?.workdayEndMinute ?? 1230,
      quietHoursStartMinute: burnoutSettings?.quietHoursStartMinute ?? 1290,
      quietHoursEndMinute: burnoutSettings?.quietHoursEndMinute ?? 480,
    };

    setIsSavingBurnoutSettings(true);
    void (async () => {
      try {
        if (nextEnabled) {
          const pushReady = await ensurePushNotificationsReady('burnout alerts');
          if (!pushReady) return;
        }

        const saved = await upsertBurnoutSettings(settingsPayload);
        setBurnoutSettings(saved.settings);
        await refreshBurnoutPlan();

        if (nextEnabled) {
          Alert.alert(
            'Burnout Alerts Enabled',
            'Burnout guidance is enabled. You will get nudges when workload pressure needs a lighter plan.'
          );
        } else {
          Alert.alert('Burnout Alerts Disabled', 'Burnout guidance notifications are now turned off.');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 403) {
            navigateToPremium();
            return;
          }
          if (error.status === 400) {
            Alert.alert('Invalid Settings', 'Burnout alert settings payload was rejected. Please retry.');
            return;
          }
        }
        Alert.alert('Update Failed', 'Could not update burnout alerts right now. Try again in a moment.');
      } finally {
        setIsSavingBurnoutSettings(false);
      }
    })();
  };

  const handleLunarProductivityToggle = () => {
    if (plan !== 'premium') {
      navigateToPremium();
      return;
    }
    if (isSavingLunarSettings) return;

    const nextEnabled = !(lunarSettings?.enabled ?? false);
    const settingsPayload = {
      enabled: nextEnabled,
      timezoneIana: resolveDeviceTimezoneIana(),
      workdayStartMinute: lunarSettings?.workdayStartMinute ?? 540,
      workdayEndMinute: lunarSettings?.workdayEndMinute ?? 1230,
      quietHoursStartMinute: lunarSettings?.quietHoursStartMinute ?? 1290,
      quietHoursEndMinute: lunarSettings?.quietHoursEndMinute ?? 480,
    };

    setIsSavingLunarSettings(true);
    void (async () => {
      try {
        if (nextEnabled) {
          const pushReady = await ensurePushNotificationsReady('lunar productivity alerts');
          if (!pushReady) return;
        }

        const saved = await upsertLunarProductivitySettings(settingsPayload);
        setLunarSettings(saved.settings);
        await refreshLunarProductivityPlan();

        if (nextEnabled) {
          Alert.alert(
            'Lunar Productivity Enabled',
            'Action-ready lunar guidance is enabled. You will get nudges before disruptive dips and strong focus windows.'
          );
        } else {
          Alert.alert('Lunar Productivity Disabled', 'Lunar guidance notifications are now turned off.');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 403) {
            navigateToPremium();
            return;
          }
          if (error.status === 400) {
            Alert.alert('Invalid Settings', 'Lunar productivity settings payload was rejected. Please retry.');
            return;
          }
        }
        Alert.alert('Update Failed', 'Could not update lunar productivity alerts right now. Try again in a moment.');
      } finally {
        setIsSavingLunarSettings(false);
      }
    })();
  };

  return {
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
  };
}
