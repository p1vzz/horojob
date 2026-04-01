import assert from 'node:assert/strict';
import test from 'node:test';
import { runSettingsBootstrap } from './settingsBootstrapCore';

test('settings bootstrap core runs morning, notification, and interview bootstrap in order', async () => {
  const steps: string[] = [];

  await runSettingsBootstrap({
    bootstrapMorningBriefingState: async () => {
      steps.push('morning');
      return { effectivePlan: 'premium', userId: 'user-1' };
    },
    bootstrapNotificationState: async (effectivePlan, isMounted = () => true) => {
      steps.push(`notification:${effectivePlan}:${isMounted()}`);
    },
    bootstrapInterviewState: async (userId, effectivePlan, isMounted = () => true) => {
      steps.push(`interview:${userId}:${effectivePlan}:${isMounted()}`);
    },
    clearPremiumDependentState: () => {
      steps.push('clear-premium');
    },
    resetInterviewState: () => {
      steps.push('reset-interview');
    },
    resetMorningBriefingState: () => {
      steps.push('reset-morning');
    },
  });

  assert.deepEqual(steps, ['morning', 'notification:premium:true', 'interview:user-1:premium:true']);
});

test('settings bootstrap core resets interview state when session user is missing', async () => {
  const steps: string[] = [];

  await runSettingsBootstrap({
    bootstrapMorningBriefingState: async () => ({ effectivePlan: 'free', userId: null }),
    bootstrapNotificationState: async (effectivePlan) => {
      steps.push(`notification:${effectivePlan}`);
    },
    bootstrapInterviewState: async () => {
      steps.push('interview');
    },
    clearPremiumDependentState: () => {
      steps.push('clear-premium');
    },
    resetInterviewState: (options) => {
      steps.push(`reset-interview:${String(options?.clearSessionUserId)}`);
    },
    resetMorningBriefingState: () => {
      steps.push('reset-morning');
    },
  });

  assert.deepEqual(steps, ['notification:free', 'reset-interview:true']);
});

test('settings bootstrap core clears state on bootstrap failure while mounted', async () => {
  const steps: string[] = [];

  await runSettingsBootstrap({
    bootstrapMorningBriefingState: async () => {
      throw new Error('boom');
    },
    bootstrapNotificationState: async () => {
      steps.push('notification');
    },
    bootstrapInterviewState: async () => {
      steps.push('interview');
    },
    clearPremiumDependentState: () => {
      steps.push('clear-premium');
    },
    resetInterviewState: () => {
      steps.push('reset-interview');
    },
    resetMorningBriefingState: () => {
      steps.push('reset-morning');
    },
  });

  assert.deepEqual(steps, ['reset-morning', 'clear-premium']);
});

test('settings bootstrap core aborts after morning bootstrap when unmounted', async () => {
  const steps: string[] = [];

  await runSettingsBootstrap(
    {
      bootstrapMorningBriefingState: async () => {
        steps.push('morning');
        return { effectivePlan: 'premium', userId: 'user-1' };
      },
      bootstrapNotificationState: async () => {
        steps.push('notification');
      },
      bootstrapInterviewState: async () => {
        steps.push('interview');
      },
      clearPremiumDependentState: () => {
        steps.push('clear-premium');
      },
      resetInterviewState: () => {
        steps.push('reset-interview');
      },
      resetMorningBriefingState: () => {
        steps.push('reset-morning');
      },
    },
    () => false
  );

  assert.deepEqual(steps, ['morning']);
});
