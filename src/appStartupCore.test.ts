import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInitialRouteName, shouldForceOnboardingEntry, shouldForceStartupLoader } from './appStartupCore';

test('app startup core resolves initial route from onboarding state and override flag', () => {
  assert.equal(resolveInitialRouteName({ hasOnboarded: true, forceOnboardingEntry: false }), 'Dashboard');
  assert.equal(resolveInitialRouteName({ hasOnboarded: false, forceOnboardingEntry: false }), 'Onboarding');
  assert.equal(resolveInitialRouteName({ hasOnboarded: true, forceOnboardingEntry: true }), 'Onboarding');
});

test('app startup core only enables onboarding override in development for truthy env values', () => {
  assert.equal(shouldForceOnboardingEntry('true', true), true);
  assert.equal(shouldForceOnboardingEntry(' 1 ', true), true);
  assert.equal(shouldForceOnboardingEntry('yes', true), true);
  assert.equal(shouldForceOnboardingEntry('on', true), true);
  assert.equal(shouldForceOnboardingEntry('true', false), false);
  assert.equal(shouldForceOnboardingEntry('false', true), false);
  assert.equal(shouldForceOnboardingEntry(undefined, true), false);
});

test('app startup core only enables startup loader override in development for truthy env values', () => {
  assert.equal(shouldForceStartupLoader('true', true), true);
  assert.equal(shouldForceStartupLoader(' 1 ', true), true);
  assert.equal(shouldForceStartupLoader('yes', true), true);
  assert.equal(shouldForceStartupLoader('on', true), true);
  assert.equal(shouldForceStartupLoader('true', false), false);
  assert.equal(shouldForceStartupLoader('false', true), false);
  assert.equal(shouldForceStartupLoader(undefined, true), false);
});
