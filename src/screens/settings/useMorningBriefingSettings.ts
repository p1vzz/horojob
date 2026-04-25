import React from 'react';
import { Alert, Platform } from 'react-native';
import type { MorningBriefingResponse } from '../../services/astrologyApiCore';
import {
  getMorningBriefingSnapshotForCurrentUser,
  setMorningBriefingSetupStateForCurrentUser,
  setMorningBriefingWidgetVariantForCurrentUser,
  syncMorningBriefingCache,
  type SubscriptionPlan,
} from '../../services/morningBriefingSync';
import { hasMorningBriefingWidgetInstance, requestPinMorningBriefingWidget } from '../../services/morningBriefingWidgetBridge';
import {
  DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
  type MorningBriefingWidgetVariantId,
} from '../../services/morningBriefingWidgetVariants';
import type { MorningBriefingSetupState } from '../../utils/morningBriefingStorage';

type BootstrapResult = {
  effectivePlan: SubscriptionPlan;
  userId: string | null;
};

export function useMorningBriefingSettings(args: {
  navigateToPremium: () => void;
  onPremiumAccessLost?: () => void;
}) {
  const { navigateToPremium, onPremiumAccessLost } = args;

  const [plan, setPlan] = React.useState<SubscriptionPlan>('free');
  const [setupState, setSetupState] = React.useState<MorningBriefingSetupState>('not_eligible');
  const [widgetVariant, setWidgetVariant] =
    React.useState<MorningBriefingWidgetVariantId>(DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT);
  const [briefing, setBriefing] = React.useState<MorningBriefingResponse | null>(null);
  const [isSyncingWidget, setIsSyncingWidget] = React.useState(false);
  const [isWidgetStylePickerVisible, setIsWidgetStylePickerVisible] = React.useState(false);

  const applySnapshot = (snapshot: {
    plan: SubscriptionPlan;
    setupState: MorningBriefingSetupState;
    widgetVariant: MorningBriefingWidgetVariantId;
    payload: MorningBriefingResponse | null;
  }) => {
    setPlan(snapshot.plan);
    setSetupState(snapshot.setupState);
    setWidgetVariant(snapshot.widgetVariant);
    setBriefing(snapshot.payload);
    if (snapshot.plan !== 'premium') {
      onPremiumAccessLost?.();
    }
  };

  const syncBriefingCache = async (refresh: boolean) => {
    const result = await syncMorningBriefingCache({ refresh });
    applySnapshot(result.snapshot);
    return result;
  };

  const bootstrapMorningBriefingState = async (): Promise<BootstrapResult> => {
    const snapshot = await getMorningBriefingSnapshotForCurrentUser();
    applySnapshot(snapshot);

    if (snapshot.plan !== 'premium' || snapshot.payload) {
      return {
        effectivePlan: snapshot.plan,
        userId: snapshot.userId,
      };
    }

    setIsSyncingWidget(true);
    try {
      const result = await syncBriefingCache(false);
      return {
        effectivePlan: result.snapshot.plan,
        userId: result.snapshot.userId,
      };
    } finally {
      setIsSyncingWidget(false);
    }
  };

  const resetMorningBriefingState = () => {
    setPlan('free');
    setSetupState('not_eligible');
    setWidgetVariant(DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT);
    setBriefing(null);
    setIsSyncingWidget(false);
    setIsWidgetStylePickerVisible(false);
    onPremiumAccessLost?.();
  };

  const syncWidgetBriefing = async (refresh: boolean) => {
    setIsSyncingWidget(true);
    try {
      const result = await syncBriefingCache(refresh);
      return result.status;
    } finally {
      setIsSyncingWidget(false);
    }
  };

  const applySetupState = async (nextState: MorningBriefingSetupState) => {
    setSetupState(nextState);
    try {
      await setMorningBriefingSetupStateForCurrentUser(nextState);
    } catch {
      // Keep local state optimistic if persistence fails.
    }
  };

  const applyWidgetVariant = async (nextVariant: MorningBriefingWidgetVariantId) => {
    setWidgetVariant(nextVariant);
    try {
      await setMorningBriefingWidgetVariantForCurrentUser(nextVariant);
    } catch {
      // Keep local state optimistic if persistence fails.
    }
  };

  const waitForWidgetInstance = async (variantId?: MorningBriefingWidgetVariantId, attempts = 6, intervalMs = 800) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const hasInstance = await hasMorningBriefingWidgetInstance(variantId);
      if (hasInstance) return true;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    return false;
  };

  const startAndroidWidgetPinFlow = (variantId: MorningBriefingWidgetVariantId) => {
    void (async () => {
      await applyWidgetVariant(variantId);
      await applySetupState('pin_requested');
      const requested = await requestPinMorningBriefingWidget(variantId);
      if (!requested) {
        Alert.alert(
          'Add Widget Manually',
          'Long press Home Screen -> Widgets -> Horojob. Choose one of the Morning Career Briefing widget styles.'
        );
        return;
      }

      const hasInstance = await waitForWidgetInstance(variantId);
      if (hasInstance) {
        await applySetupState('enabled');
        await syncWidgetBriefing(true);
        Alert.alert('Widget Enabled', 'Morning Career Briefing widget is now active.');
      } else {
        await applySetupState('pin_requested');
        Alert.alert(
          'Widget Setup Pending',
          'System did not complete pin automatically. Long press Home Screen -> Widgets -> Horojob and add your preferred style.'
        );
      }
    })();
  };

  const handleWidgetSetup = () => {
    if (plan !== 'premium') {
      navigateToPremium();
      return;
    }

    if (setupState === 'enabled') {
      void syncWidgetBriefing(true).then((status) => {
        if (status === 'synced') {
          Alert.alert('Briefing Updated', 'Morning widget payload is synced with the latest data.');
        } else if (status === 'profile_missing') {
          Alert.alert('Complete Profile', 'Finish onboarding details first to generate morning briefing.');
        } else if (status === 'failed') {
          Alert.alert('Sync Failed', 'Could not refresh morning briefing right now. Try again in a moment.');
        }
      });
      return;
    }

    if (Platform.OS === 'android') {
      setIsWidgetStylePickerVisible(true);
      return;
    }

    void applySetupState('pin_requested');
    Alert.alert(
      'Enable Widget (iOS)',
      '1. Long press Home Screen\n2. Tap "+" in top corner\n3. Find Horojob\n4. Add Morning Career Briefing widget',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => {
            void applySetupState('prompt_dismissed');
          },
        },
        {
          text: 'I Added It',
          onPress: () => {
            void applySetupState('enabled');
            void syncWidgetBriefing(true);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const openWidgetStylePicker = () => {
    if (plan !== 'premium') {
      navigateToPremium();
      return;
    }
    setIsWidgetStylePickerVisible(true);
  };

  const handleWidgetStyleConfirm = () => {
    setIsWidgetStylePickerVisible(false);
    void applyWidgetVariant(widgetVariant);
    if (Platform.OS === 'android' && setupState !== 'enabled') {
      startAndroidWidgetPinFlow(widgetVariant);
      return;
    }

    if (Platform.OS === 'android' && setupState === 'enabled') {
      Alert.alert(
        'Style Saved',
        'Selected widget style is saved. Add another style from Home Screen widgets when needed.'
      );
    }
  };

  return {
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
  };
}
