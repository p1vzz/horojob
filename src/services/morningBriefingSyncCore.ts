import type { MorningBriefingResponse } from './astrologyApi';
import type { MorningBriefingSetupState } from '../utils/morningBriefingStorage';
import type { MorningBriefingWidgetVariantId } from './morningBriefingWidgetVariants';

export type SubscriptionPlan = 'free' | 'premium';

export type MorningBriefingSnapshot = {
  userId: string;
  plan: SubscriptionPlan;
  setupState: MorningBriefingSetupState;
  widgetVariant: MorningBriefingWidgetVariantId;
  payload: MorningBriefingResponse | null;
};

export type MorningBriefingSyncResult =
  | { status: 'synced'; snapshot: MorningBriefingSnapshot; payload: MorningBriefingResponse }
  | { status: 'premium_required'; snapshot: MorningBriefingSnapshot }
  | { status: 'profile_missing'; snapshot: MorningBriefingSnapshot }
  | { status: 'unauthorized'; snapshot: MorningBriefingSnapshot }
  | { status: 'failed'; snapshot: MorningBriefingSnapshot };

type SessionLike = {
  user: {
    id: string;
    subscriptionTier?: unknown;
  };
};

export type MorningBriefingSyncDeps = {
  ensureAuthSession: () => Promise<SessionLike>;
  fetchMorningBriefing: (options?: { refresh?: boolean }) => Promise<MorningBriefingResponse>;
  loadMorningBriefingForUser: (userId: string) => Promise<MorningBriefingResponse | null>;
  loadMorningBriefingSetupStateForUser: (userId: string) => Promise<MorningBriefingSetupState | null>;
  loadMorningBriefingWidgetVariantForUser: (userId: string) => Promise<MorningBriefingWidgetVariantId>;
  saveMorningBriefingForUser: (userId: string, payload: MorningBriefingResponse) => Promise<void>;
  saveMorningBriefingSetupStateForUser: (userId: string, state: MorningBriefingSetupState) => Promise<void>;
  saveMorningBriefingWidgetVariantForUser: (userId: string, variantId: MorningBriefingWidgetVariantId) => Promise<void>;
  clearMorningBriefingForUser: (userId: string) => Promise<void>;
  clearMorningBriefingWidget: () => Promise<unknown>;
  setMorningBriefingWidgetLocked: () => Promise<unknown>;
  setMorningBriefingWidgetProfileMissing: () => Promise<unknown>;
  syncMorningBriefingWidget: (payload: MorningBriefingResponse) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

function resolvePlan(input: unknown): SubscriptionPlan {
  return input === 'premium' ? 'premium' : 'free';
}

function defaultSetupStateForPlan(plan: SubscriptionPlan): MorningBriefingSetupState {
  return plan === 'premium' ? 'eligible_not_prompted' : 'not_eligible';
}

export function createMorningBriefingSyncService(deps: MorningBriefingSyncDeps) {
  const normalizeSnapshotForCurrentUser = async (): Promise<MorningBriefingSnapshot> => {
    const session = await deps.ensureAuthSession();
    const userId = session.user.id;
    const plan = resolvePlan(session.user.subscriptionTier);

    const payload = await deps.loadMorningBriefingForUser(userId);
    const loadedSetupState = await deps.loadMorningBriefingSetupStateForUser(userId);
    const widgetVariant = await deps.loadMorningBriefingWidgetVariantForUser(userId);
    const setupState = loadedSetupState ?? defaultSetupStateForPlan(plan);

    if (!loadedSetupState) {
      await deps.saveMorningBriefingSetupStateForUser(userId, setupState);
    }
    await deps.saveMorningBriefingWidgetVariantForUser(userId, widgetVariant);

    if (plan === 'free' && setupState !== 'not_eligible') {
      await deps.saveMorningBriefingSetupStateForUser(userId, 'not_eligible');
      return {
        userId,
        plan,
        setupState: 'not_eligible',
        widgetVariant,
        payload,
      };
    }

    return {
      userId,
      plan,
      setupState,
      widgetVariant,
      payload,
    };
  };

  const getMorningBriefingSnapshotForCurrentUser = async (): Promise<MorningBriefingSnapshot> => {
    return normalizeSnapshotForCurrentUser();
  };

  const setMorningBriefingSetupStateForCurrentUser = async (state: MorningBriefingSetupState) => {
    const session = await deps.ensureAuthSession();
    await deps.saveMorningBriefingSetupStateForUser(session.user.id, state);
  };

  const setMorningBriefingWidgetVariantForCurrentUser = async (variantId: MorningBriefingWidgetVariantId) => {
    const session = await deps.ensureAuthSession();
    await deps.saveMorningBriefingWidgetVariantForUser(session.user.id, variantId);
  };

  const syncMorningBriefingCache = async (options?: { refresh?: boolean }): Promise<MorningBriefingSyncResult> => {
    const snapshot = await normalizeSnapshotForCurrentUser();

    if (snapshot.plan !== 'premium') {
      await deps.clearMorningBriefingForUser(snapshot.userId);
      await deps.saveMorningBriefingSetupStateForUser(snapshot.userId, 'not_eligible');
      await deps.setMorningBriefingWidgetLocked();
      return {
        status: 'premium_required',
        snapshot: {
          ...snapshot,
          setupState: 'not_eligible',
          payload: null,
        },
      };
    }

    try {
      const payload = await deps.fetchMorningBriefing({ refresh: options?.refresh });
      await deps.saveMorningBriefingForUser(snapshot.userId, payload);
      await deps.syncMorningBriefingWidget(payload);

      const nextState =
        snapshot.setupState === 'enabled' || snapshot.setupState === 'pin_requested'
          ? snapshot.setupState
          : 'eligible_not_prompted';
      if (nextState !== snapshot.setupState) {
        await deps.saveMorningBriefingSetupStateForUser(snapshot.userId, nextState);
      }

      return {
        status: 'synced',
        payload,
        snapshot: {
          ...snapshot,
          setupState: nextState,
          payload,
        },
      };
    } catch (error) {
      if (error instanceof deps.ApiError) {
        const apiError = error as Error & { status?: unknown };
        if (apiError.status === 403) {
          await deps.clearMorningBriefingForUser(snapshot.userId);
          await deps.saveMorningBriefingSetupStateForUser(snapshot.userId, 'not_eligible');
          await deps.setMorningBriefingWidgetLocked();
          return {
            status: 'premium_required',
            snapshot: {
              ...snapshot,
              setupState: 'not_eligible',
              payload: null,
            },
          };
        }

        if (apiError.status === 404) {
          await deps.setMorningBriefingWidgetProfileMissing();
          return {
            status: 'profile_missing',
            snapshot,
          };
        }

        if (apiError.status === 401) {
          await deps.clearMorningBriefingForUser(snapshot.userId);
          await deps.clearMorningBriefingWidget();
          return {
            status: 'unauthorized',
            snapshot: {
              ...snapshot,
              payload: null,
            },
          };
        }
      }

      return {
        status: 'failed',
        snapshot,
      };
    }
  };

  return {
    getMorningBriefingSnapshotForCurrentUser,
    setMorningBriefingSetupStateForCurrentUser,
    setMorningBriefingWidgetVariantForCurrentUser,
    syncMorningBriefingCache,
  };
}
