import type { SubscriptionPlan } from '../../services/morningBriefingSync';

type SettingsBootstrapResult = {
  effectivePlan: SubscriptionPlan;
  userId: string | null;
};

export type SettingsBootstrapCoreDeps = {
  bootstrapMorningBriefingState: () => Promise<SettingsBootstrapResult>;
  bootstrapNotificationState: (effectivePlan: SubscriptionPlan, isMounted?: () => boolean) => Promise<void>;
  bootstrapInterviewState: (
    userId: string,
    effectivePlan: SubscriptionPlan,
    isMounted?: () => boolean
  ) => Promise<void>;
  clearPremiumDependentState: () => void;
  resetInterviewState: (options?: { clearSessionUserId?: boolean }) => void;
  resetMorningBriefingState: () => void;
};

export async function runSettingsBootstrap(
  deps: SettingsBootstrapCoreDeps,
  isMounted: () => boolean = () => true
) {
  const {
    bootstrapMorningBriefingState,
    bootstrapNotificationState,
    bootstrapInterviewState,
    clearPremiumDependentState,
    resetInterviewState,
    resetMorningBriefingState,
  } = deps;

  try {
    const { effectivePlan, userId } = await bootstrapMorningBriefingState();
    if (!isMounted()) return;

    await bootstrapNotificationState(effectivePlan, isMounted);
    if (!isMounted()) return;

    if (typeof userId === 'string' && userId.length > 0) {
      await bootstrapInterviewState(userId, effectivePlan, isMounted);
      return;
    }

    resetInterviewState({ clearSessionUserId: true });
  } catch {
    if (!isMounted()) return;
    resetMorningBriefingState();
    clearPremiumDependentState();
  }
}
