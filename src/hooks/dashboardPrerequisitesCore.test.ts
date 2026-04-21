import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDashboardPrerequisitesCheckingState,
  resolveDashboardPrerequisitesState,
  shouldShowDashboardPrerequisiteGate,
} from './dashboardPrerequisitesCore';
import type { AuthSession } from '../utils/authSessionStorage';

function createSession(subscriptionTier: 'free' | 'premium' = 'premium'): AuthSession {
  return {
    user: {
      id: 'user-1',
      kind: 'anonymous',
      subscriptionTier,
      appleLinked: false,
      email: null,
      displayName: null,
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    accessToken: 'access',
    refreshToken: 'refresh',
    accessExpiresAt: '2026-04-02T00:00:00.000Z',
    refreshExpiresAt: '2026-04-03T00:00:00.000Z',
  };
}

test('dashboard prerequisites treat synced natal chart as ready for career features', () => {
  const state = resolveDashboardPrerequisitesState({
    session: createSession('premium'),
    syncResult: {
      status: 'synced',
      userId: 'user-1',
      payload: { chart: {} },
    },
  });

  assert.equal(state.isReadyForCareerFeatures, true);
  assert.equal(state.isPremium, true);
  assert.equal(state.reason, 'ready');
});

test('dashboard prerequisites block career tools when birth profile is missing', () => {
  const state = resolveDashboardPrerequisitesState({
    session: createSession('free'),
    syncResult: {
      status: 'failed',
      userId: 'user-1',
      errorText: 'Complete your birth profile to prepare your career map.',
    },
  });

  assert.equal(state.isReadyForCareerFeatures, false);
  assert.equal(state.isPremium, false);
  assert.equal(state.reason, 'profile_missing');
  assert.equal(state.actionLabel, 'Open Natal Chart');
});

test('dashboard prerequisites allow local natal cache while surfacing sync warning', () => {
  const state = resolveDashboardPrerequisitesState({
    session: createSession('premium'),
    syncResult: {
      status: 'cached',
      userId: 'user-1',
      payload: { chart: {} },
      errorText: 'Unable to prepare your chart right now.',
    },
  });

  assert.equal(state.isReadyForCareerFeatures, true);
  assert.equal(state.reason, 'ready');
  assert.equal(state.errorText, 'Unable to prepare your chart right now.');
});

test('dashboard prerequisite gate has a bounded initial checking state', () => {
  const checking = createDashboardPrerequisitesCheckingState();

  assert.equal(
    shouldShowDashboardPrerequisiteGate({
      isChecking: checking.isChecking,
      hasCompletedInitialCheck: checking.hasCompletedInitialCheck,
      hasGateTimedOut: false,
    }),
    true
  );

  assert.equal(
    shouldShowDashboardPrerequisiteGate({
      isChecking: true,
      hasCompletedInitialCheck: false,
      hasGateTimedOut: true,
    }),
    false
  );
});
