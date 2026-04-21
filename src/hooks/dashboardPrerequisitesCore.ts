import type { NatalChartSyncResult } from '../services/natalChartSyncCore';
import type { AuthSession } from '../utils/authSessionStorage';

export const DASHBOARD_PREREQUISITE_GATE_TIMEOUT_MS = 8_000;

export type DashboardPrerequisiteReason =
  | 'checking'
  | 'ready'
  | 'profile_missing'
  | 'natal_chart_missing'
  | 'sync_failed'
  | 'auth_failed';

export type DashboardPrerequisitesState = {
  isChecking: boolean;
  hasCompletedInitialCheck: boolean;
  isReadyForCareerFeatures: boolean;
  isPremium: boolean | null;
  reason: DashboardPrerequisiteReason;
  errorText: string | null;
  blockTitle: string;
  blockBody: string;
  actionLabel: string;
};

export type DashboardCareerFeaturePrerequisites = Pick<
  DashboardPrerequisitesState,
  'isChecking' | 'isReadyForCareerFeatures' | 'isPremium' | 'reason' | 'errorText' | 'blockTitle' | 'blockBody' | 'actionLabel'
>;

const CHECKING_BODY = 'Preparing the natal chart that powers career matching, interview timing, and full reports.';

export function createDashboardPrerequisitesCheckingState(input?: {
  isPremium?: boolean | null;
  hasCompletedInitialCheck?: boolean;
}): DashboardPrerequisitesState {
  return {
    isChecking: true,
    hasCompletedInitialCheck: input?.hasCompletedInitialCheck ?? false,
    isReadyForCareerFeatures: false,
    isPremium: input?.isPremium ?? null,
    reason: 'checking',
    errorText: null,
    blockTitle: 'Preparing your career map',
    blockBody: CHECKING_BODY,
    actionLabel: 'Preparing',
  };
}

function classifyNatalChartIssue(errorText: string | null | undefined): Exclude<DashboardPrerequisiteReason, 'checking' | 'ready'> {
  const normalized = (errorText ?? '').toLowerCase();
  if (normalized.includes('birth profile') || normalized.includes('complete your birth profile')) {
    return 'profile_missing';
  }
  if (normalized.includes('natal chart')) {
    return 'natal_chart_missing';
  }
  return 'sync_failed';
}

function resolveBlockedCopy(reason: DashboardPrerequisiteReason, errorText: string | null) {
  if (reason === 'profile_missing') {
    return {
      blockTitle: 'Complete your birth profile',
      blockBody: 'Add your birth details first, then Horojob can prepare the career map behind these tools.',
      actionLabel: 'Open Natal Chart',
    };
  }

  if (reason === 'natal_chart_missing') {
    return {
      blockTitle: 'Preparing your natal chart',
      blockBody: 'Your career map needs to finish before role matching, interview timing, or full reports can open.',
      actionLabel: 'Open Natal Chart',
    };
  }

  if (reason === 'auth_failed') {
    return {
      blockTitle: 'Session needs a refresh',
      blockBody: 'Reconnect your session before Horojob can prepare the career map.',
      actionLabel: 'Open Natal Chart',
    };
  }

  return {
    blockTitle: 'Career map unavailable',
    blockBody: errorText ?? 'The career map could not sync yet. Try again when the connection is stable.',
    actionLabel: 'Open Natal Chart',
  };
}

export function resolveDashboardPrerequisitesState(input: {
  session: AuthSession;
  syncResult: NatalChartSyncResult;
  hasCompletedInitialCheck?: boolean;
}): DashboardPrerequisitesState {
  const isPremium = input.session.user.subscriptionTier === 'premium';
  const hasCompletedInitialCheck = input.hasCompletedInitialCheck ?? true;

  if (input.syncResult.status === 'synced' || input.syncResult.status === 'cached') {
    return {
      isChecking: false,
      hasCompletedInitialCheck,
      isReadyForCareerFeatures: true,
      isPremium,
      reason: 'ready',
      errorText: input.syncResult.status === 'cached' ? input.syncResult.errorText : null,
      blockTitle: '',
      blockBody: '',
      actionLabel: '',
    };
  }

  const reason = classifyNatalChartIssue(input.syncResult.errorText);
  const copy = resolveBlockedCopy(reason, input.syncResult.errorText);

  return {
    isChecking: false,
    hasCompletedInitialCheck,
    isReadyForCareerFeatures: false,
    isPremium,
    reason,
    errorText: input.syncResult.errorText,
    ...copy,
  };
}

export function createDashboardPrerequisitesAuthFailedState(error: unknown): DashboardPrerequisitesState {
  const errorText = error instanceof Error && error.message.trim().length > 0
    ? error.message
    : 'Unable to prepare your dashboard session.';
  const copy = resolveBlockedCopy('auth_failed', errorText);
  return {
    isChecking: false,
    hasCompletedInitialCheck: true,
    isReadyForCareerFeatures: false,
    isPremium: null,
    reason: 'auth_failed',
    errorText,
    ...copy,
  };
}

export function shouldShowDashboardPrerequisiteGate(input: {
  isChecking: boolean;
  hasCompletedInitialCheck: boolean;
  hasGateTimedOut: boolean;
}) {
  return input.isChecking && !input.hasCompletedInitialCheck && !input.hasGateTimedOut;
}
