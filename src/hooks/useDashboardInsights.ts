import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ensureAuthSession } from '../services/authSession';
import {
  FROZEN_BURNOUT_SNAPSHOT,
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
  toBurnoutInsightSnapshotFromPlan,
  toLunarProductivityInsightSnapshotFromPlan,
} from '../services/dashboardInsightSnapshots';
import { fetchBurnoutPlan, fetchLunarProductivityPlan } from '../services/notificationsApi';
import { createDefaultDashboardInsightsState } from './useDashboardInsightsCore';

export function useDashboardInsights() {
  const [state, setState] = React.useState(() => createDefaultDashboardInsightsState());
  const burnoutRequestIdRef = React.useRef(0);
  const lunarRequestIdRef = React.useRef(0);
  const planRef = React.useRef<'free' | 'premium'>('free');

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
      const lastSyncedAt = new Date().toISOString();

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
  }, []);

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
      const lastSyncedAt = new Date().toISOString();

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
  }, []);

  const refreshBurnout = React.useCallback(async () => {
    if (planRef.current !== 'premium') return;
    const requestId = ++burnoutRequestIdRef.current;
    await hydrateBurnout(requestId);
  }, [hydrateBurnout]);

  const refreshLunar = React.useCallback(async () => {
    if (planRef.current !== 'premium') return;
    const requestId = ++lunarRequestIdRef.current;
    await hydrateLunar(requestId);
  }, [hydrateLunar]);

  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          const session = await ensureAuthSession();
          const plan = session.user.subscriptionTier === 'premium' ? 'premium' : 'free';
          planRef.current = plan;
          if (plan !== 'premium') {
            setState(createDefaultDashboardInsightsState());
            return;
          }

          const burnoutRequestId = ++burnoutRequestIdRef.current;
          const lunarRequestId = ++lunarRequestIdRef.current;

          void Promise.allSettled([hydrateBurnout(burnoutRequestId), hydrateLunar(lunarRequestId)]);
        } catch {
          planRef.current = 'free';
          burnoutRequestIdRef.current += 1;
          lunarRequestIdRef.current += 1;
          setState(createDefaultDashboardInsightsState());
        }
      })();

      return () => {
        burnoutRequestIdRef.current += 1;
        lunarRequestIdRef.current += 1;
      };
    }, [hydrateBurnout, hydrateLunar])
  );

  return {
    ...state,
    refreshBurnout,
    refreshLunar,
  };
}
