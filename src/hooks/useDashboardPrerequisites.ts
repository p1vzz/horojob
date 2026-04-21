import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ensureAuthSession } from '../services/authSession';
import { syncNatalChartCache } from '../services/natalChartSync';
import {
  DASHBOARD_PREREQUISITE_GATE_TIMEOUT_MS,
  createDashboardPrerequisitesAuthFailedState,
  createDashboardPrerequisitesCheckingState,
  resolveDashboardPrerequisitesState,
  shouldShowDashboardPrerequisiteGate,
  type DashboardCareerFeaturePrerequisites,
  type DashboardPrerequisitesState,
} from './dashboardPrerequisitesCore';

export type { DashboardCareerFeaturePrerequisites, DashboardPrerequisitesState };

export type DashboardPrerequisites = DashboardPrerequisitesState & {
  shouldShowDashboardGate: boolean;
};

export function useDashboardPrerequisites(): DashboardPrerequisites {
  const [state, setState] = React.useState<DashboardPrerequisitesState>(() =>
    createDashboardPrerequisitesCheckingState()
  );
  const [hasGateTimedOut, setHasGateTimedOut] = React.useState(false);
  const hasCompletedInitialCheckRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setHasGateTimedOut(false);
      setState((current) => {
        if (current.isReadyForCareerFeatures) {
          return {
            ...current,
            isChecking: true,
            hasCompletedInitialCheck: hasCompletedInitialCheckRef.current,
          };
        }

        return createDashboardPrerequisitesCheckingState({
          isPremium: current.isPremium,
          hasCompletedInitialCheck: hasCompletedInitialCheckRef.current,
        });
      });

      void (async () => {
        try {
          const session = await ensureAuthSession();
          const syncResult = await syncNatalChartCache();
          if (!active) return;

          hasCompletedInitialCheckRef.current = true;
          setState(resolveDashboardPrerequisitesState({
            session,
            syncResult,
            hasCompletedInitialCheck: true,
          }));
        } catch (error) {
          if (!active) return;

          hasCompletedInitialCheckRef.current = true;
          setState(createDashboardPrerequisitesAuthFailedState(error));
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  React.useEffect(() => {
    if (!state.isChecking || state.hasCompletedInitialCheck) return;
    const timer = setTimeout(() => {
      setHasGateTimedOut(true);
    }, DASHBOARD_PREREQUISITE_GATE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [state.hasCompletedInitialCheck, state.isChecking]);

  return {
    ...state,
    shouldShowDashboardGate: shouldShowDashboardPrerequisiteGate({
      isChecking: state.isChecking,
      hasCompletedInitialCheck: state.hasCompletedInitialCheck,
      hasGateTimedOut,
    }),
  };
}
