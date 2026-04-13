import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ensureAuthSession } from '../services/authSession';
import {
  FROZEN_BURNOUT_SNAPSHOT,
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
  toBurnoutInsightSnapshotFromPlan,
  toLunarProductivityInsightSnapshotFromPlan,
} from '../services/dashboardInsightSnapshots';
import {
  fetchBurnoutPlan,
  fetchLunarProductivityPlan,
  markBurnoutSeen,
  markLunarProductivitySeen,
} from '../services/notificationsApi';
import {
  createDefaultDashboardInsightsState,
  createUnavailableDashboardInsightsState,
  shouldAcknowledgeBurnoutCard,
  shouldAcknowledgeLunarCard,
  shouldDisplayBurnoutCard,
  shouldDisplayLunarCard,
} from './useDashboardInsightsCore';

export function useDashboardInsights(options: {
  showBurnoutFallbackOnError?: boolean;
  showLunarFallbackOnError?: boolean;
} = {}) {
  const showBurnoutFallbackOnError = options.showBurnoutFallbackOnError ?? false;
  const showLunarFallbackOnError = options.showLunarFallbackOnError ?? false;
  const [state, setState] = React.useState(() => createDefaultDashboardInsightsState());
  const [isInitialReady, setIsInitialReady] = React.useState(false);
  const [burnoutVisible, setBurnoutVisible] = React.useState(false);
  const [lunarVisible, setLunarVisible] = React.useState(false);
  const burnoutRequestIdRef = React.useRef(0);
  const lunarRequestIdRef = React.useRef(0);
  const initialResolutionDoneRef = React.useRef(false);

  const hydrateBurnout = React.useCallback(async (requestId: number) => {
    setState((current) => ({
      ...current,
      burnout: {
        ...current.burnout,
        isHydrating: true,
      },
    }));

    try {
      const burnoutPlan = await fetchBurnoutPlan();
      if (burnoutRequestIdRef.current !== requestId) return;
      const shouldDisplay = shouldDisplayBurnoutCard(burnoutPlan);
      if (shouldAcknowledgeBurnoutCard(burnoutPlan)) {
        await markBurnoutSeen({ dateKey: burnoutPlan.dateKey }).catch(() => {
          // Keep dashboard hydration resilient even if acknowledge path fails.
        });
      }
      if (burnoutRequestIdRef.current !== requestId) return;
      const lastSyncedAt = new Date().toISOString();
      setBurnoutVisible(shouldDisplay);

      setState((current) => ({
        ...current,
        burnout: {
          snapshot: toBurnoutInsightSnapshotFromPlan(burnoutPlan),
          source: 'live',
          isHydrating: false,
          lastSyncedAt,
        },
      }));
    } catch {
      if (burnoutRequestIdRef.current !== requestId) return;
      setBurnoutVisible(showBurnoutFallbackOnError);
      setState((current) => ({
        ...current,
        burnout: {
          snapshot: FROZEN_BURNOUT_SNAPSHOT,
          source: 'fallback',
          isHydrating: false,
          lastSyncedAt: current.burnout.lastSyncedAt,
        },
      }));
    }
  }, [showBurnoutFallbackOnError]);

  const hydrateLunar = React.useCallback(async (requestId: number) => {
    setState((current) => ({
      ...current,
      lunar: {
        ...current.lunar,
        isHydrating: true,
      },
    }));

    try {
      const lunarPlan = await fetchLunarProductivityPlan();
      if (lunarRequestIdRef.current !== requestId) return;
      const shouldDisplay = shouldDisplayLunarCard(lunarPlan);
      if (shouldAcknowledgeLunarCard(lunarPlan)) {
        await markLunarProductivitySeen({ dateKey: lunarPlan.dateKey }).catch(() => {
          // Keep dashboard hydration resilient even if acknowledge path fails.
        });
      }
      if (lunarRequestIdRef.current !== requestId) return;
      const lastSyncedAt = new Date().toISOString();
      setLunarVisible(shouldDisplay);

      setState((current) => ({
        ...current,
        lunar: {
          snapshot: toLunarProductivityInsightSnapshotFromPlan(lunarPlan),
          source: 'live',
          isHydrating: false,
          lastSyncedAt,
        },
      }));
    } catch {
      if (lunarRequestIdRef.current !== requestId) return;
      setLunarVisible(showLunarFallbackOnError);
      setState((current) => ({
        ...current,
        lunar: {
          snapshot: FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
          source: 'fallback',
          isHydrating: false,
          lastSyncedAt: current.lunar.lastSyncedAt,
        },
      }));
    }
  }, [showLunarFallbackOnError]);

  const refreshBurnout = React.useCallback(async () => {
    const requestId = ++burnoutRequestIdRef.current;
    await hydrateBurnout(requestId);
  }, [hydrateBurnout]);

  const refreshLunar = React.useCallback(async () => {
    const requestId = ++lunarRequestIdRef.current;
    await hydrateLunar(requestId);
  }, [hydrateLunar]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const session = await ensureAuthSession();
          const plan = session.user.subscriptionTier === 'premium' ? 'premium' : 'free';
          if (plan !== 'premium') {
            if (!initialResolutionDoneRef.current) {
              initialResolutionDoneRef.current = true;
              setIsInitialReady(true);
            }
            setBurnoutVisible(false);
            setLunarVisible(false);
            setState(createDefaultDashboardInsightsState());
            return;
          }

          const burnoutRequestId = ++burnoutRequestIdRef.current;
          const lunarRequestId = ++lunarRequestIdRef.current;

          void Promise.allSettled([hydrateBurnout(burnoutRequestId), hydrateLunar(lunarRequestId)]).then(() => {
            if (active && !initialResolutionDoneRef.current) {
              initialResolutionDoneRef.current = true;
              setIsInitialReady(true);
            }
          });
        } catch {
          burnoutRequestIdRef.current += 1;
          lunarRequestIdRef.current += 1;
          setBurnoutVisible(showBurnoutFallbackOnError);
          setLunarVisible(showLunarFallbackOnError);
          if (!initialResolutionDoneRef.current) {
            initialResolutionDoneRef.current = true;
            setIsInitialReady(true);
          }
          setState(createUnavailableDashboardInsightsState());
        }
      })();

      return () => {
        active = false;
        burnoutRequestIdRef.current += 1;
        lunarRequestIdRef.current += 1;
      };
    }, [hydrateBurnout, hydrateLunar])
  );

  return {
    ...state,
    isInitialReady,
    burnoutVisible,
    lunarVisible,
    refreshBurnout,
    refreshLunar,
  };
}
