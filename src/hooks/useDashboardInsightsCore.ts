import type { SubscriptionPlan } from '../services/morningBriefingSync';
import {
  FROZEN_BURNOUT_SNAPSHOT,
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
  toBurnoutInsightSnapshotFromPlan,
  toLunarProductivityInsightSnapshotFromPlan,
  type BurnoutInsightSnapshot,
  type DashboardInsightSourceMode,
  type LunarProductivitySnapshot,
} from '../services/dashboardInsightSnapshots';
import type { BurnoutPlanResponse, LunarProductivityPlanResponse } from '../services/notificationsApi';

export type DashboardInsightCardState<TSnapshot> = {
  snapshot: TSnapshot;
  source: DashboardInsightSourceMode;
  isHydrating: boolean;
  lastSyncedAt: string | null;
};

export type DashboardInsightsState = {
  burnout: DashboardInsightCardState<BurnoutInsightSnapshot>;
  lunar: DashboardInsightCardState<LunarProductivitySnapshot>;
};

function createDefaultDashboardInsightCardState<TSnapshot>(snapshot: TSnapshot): DashboardInsightCardState<TSnapshot> {
  return {
    snapshot,
    source: 'preview',
    isHydrating: false,
    lastSyncedAt: null,
  };
}

export function createDefaultDashboardInsightsState(): DashboardInsightsState {
  return {
    burnout: createDefaultDashboardInsightCardState(FROZEN_BURNOUT_SNAPSHOT),
    lunar: createDefaultDashboardInsightCardState(FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT),
  };
}

export function createUnavailableDashboardInsightsState(): DashboardInsightsState {
  return {
    burnout: {
      snapshot: FROZEN_BURNOUT_SNAPSHOT,
      source: 'fallback',
      isHydrating: false,
      lastSyncedAt: null,
    },
    lunar: {
      snapshot: FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
      source: 'fallback',
      isHydrating: false,
      lastSyncedAt: null,
    },
  };
}

export function shouldFetchDashboardInsights(plan: SubscriptionPlan) {
  return plan === 'premium';
}

export function shouldDisplayBurnoutCard(plan: BurnoutPlanResponse) {
  return plan.risk.severity !== 'none';
}

export function shouldDisplayLunarCard(plan: LunarProductivityPlanResponse) {
  return plan.risk.impactDirection !== null;
}

export function shouldAcknowledgeBurnoutCard(plan: BurnoutPlanResponse) {
  return (
    shouldDisplayBurnoutCard(plan) &&
    plan.settings.enabled &&
    (plan.timing.status === 'planned' || plan.timing.status === 'not_scheduled')
  );
}

export function shouldAcknowledgeLunarCard(plan: LunarProductivityPlanResponse) {
  return (
    shouldDisplayLunarCard(plan) &&
    plan.settings.enabled &&
    (plan.timing.status === 'planned' || plan.timing.status === 'not_scheduled')
  );
}

function resolveBurnoutInsight(
  result: PromiseSettledResult<BurnoutPlanResponse> | undefined,
  lastSyncedAt: string | null,
  referenceDate: Date
): DashboardInsightCardState<BurnoutInsightSnapshot> {
  if (!result || result.status === 'rejected') {
    return {
      snapshot: FROZEN_BURNOUT_SNAPSHOT,
      source: 'fallback',
      isHydrating: false,
      lastSyncedAt,
    };
  }

  return {
    snapshot: toBurnoutInsightSnapshotFromPlan(result.value, referenceDate),
    source: 'live',
    isHydrating: false,
    lastSyncedAt,
  };
}

function resolveLunarInsight(
  result: PromiseSettledResult<LunarProductivityPlanResponse> | undefined,
  lastSyncedAt: string | null,
  referenceDate: Date
): DashboardInsightCardState<LunarProductivitySnapshot> {
  if (!result || result.status === 'rejected') {
    return {
      snapshot: FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
      source: 'fallback',
      isHydrating: false,
      lastSyncedAt,
    };
  }

  return {
    snapshot: toLunarProductivityInsightSnapshotFromPlan(result.value, referenceDate),
    source: 'live',
    isHydrating: false,
    lastSyncedAt,
  };
}

export function resolveDashboardInsightsState(input: {
  plan: SubscriptionPlan;
  burnoutResult?: PromiseSettledResult<BurnoutPlanResponse>;
  lunarResult?: PromiseSettledResult<LunarProductivityPlanResponse>;
  burnoutLastSyncedAt?: string | null;
  lunarLastSyncedAt?: string | null;
  referenceDate?: Date;
}): DashboardInsightsState {
  if (!shouldFetchDashboardInsights(input.plan)) {
    return createDefaultDashboardInsightsState();
  }

  const referenceDate = input.referenceDate ?? new Date();

  return {
    burnout: resolveBurnoutInsight(input.burnoutResult, input.burnoutLastSyncedAt ?? null, referenceDate),
    lunar: resolveLunarInsight(input.lunarResult, input.lunarLastSyncedAt ?? null, referenceDate),
  };
}
