import assert from 'node:assert/strict';
import test from 'node:test';
import { createRevenueCatService } from './revenueCatCore';

test('revenue cat service checks platform key availability', () => {
  const service = createRevenueCatService({
    platformOs: 'ios',
    getEnv: (name) => (name === 'EXPO_PUBLIC_RC_IOS_API_KEY' ? '  key-ios  ' : undefined),
    logLevels: { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 },
    purchases: {
      setLogLevel: () => {},
      isConfigured: async () => false,
      configure: () => {},
      logIn: async () => {},
      setAttributes: async () => {},
      getOfferings: async () => ({ current: null }),
      purchasePackage: async () => ({ customerInfo: {} }),
      restorePurchases: async () => ({}),
    },
  });

  assert.equal(service.isRevenueCatConfigured(), true);
});

test('revenue cat service configure path calls configure when sdk is not configured', async () => {
  const calls: string[] = [];
  let configuredInput: { apiKey: string; appUserID: string } | null = null;
  let attributesInput: Record<string, string> | null = null;

  const service = createRevenueCatService({
    platformOs: 'android',
    appEnvironment: 'staging',
    getEnv: (name) => {
      if (name === 'EXPO_PUBLIC_RC_ANDROID_API_KEY') return 'android-key';
      if (name === 'EXPO_PUBLIC_RC_LOG_LEVEL') return 'warn';
      return undefined;
    },
    logLevels: { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 },
    purchases: {
      setLogLevel: (level) => calls.push(`log:${level}`),
      isConfigured: async () => false,
      configure: (input) => {
        configuredInput = input;
        calls.push('configure');
      },
      logIn: async () => {
        calls.push('login');
      },
      setAttributes: async (attributes) => {
        attributesInput = attributes;
        calls.push('attributes');
      },
      getOfferings: async () => ({ current: null }),
      purchasePackage: async () => ({ customerInfo: {} }),
      restorePurchases: async () => ({}),
    },
  });

  const ok = await service.configureRevenueCatForUser('user-1');
  assert.equal(ok, true);
  assert.deepEqual(configuredInput, { apiKey: 'android-key', appUserID: 'user-1' });
  assert.deepEqual(attributesInput, { backend_user_id: 'user-1', app_env: 'staging' });
  assert.deepEqual(calls, ['log:3', 'configure', 'attributes']);
});

test('revenue cat service logs in when sdk already configured for another user', async () => {
  const calls: string[] = [];
  const service = createRevenueCatService({
    platformOs: 'ios',
    getEnv: (name) => (name === 'EXPO_PUBLIC_RC_IOS_API_KEY' ? 'ios-key' : undefined),
    logLevels: { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 },
    purchases: {
      setLogLevel: () => {},
      isConfigured: async () => true,
      configure: () => {
        calls.push('configure');
      },
      logIn: async (userId) => {
        calls.push(`login:${userId}`);
      },
      setAttributes: async () => {},
      getOfferings: async () => ({ current: null }),
      purchasePackage: async () => ({ customerInfo: {} }),
      restorePurchases: async () => ({}),
    },
  });

  await service.configureRevenueCatForUser('u-1');
  await service.configureRevenueCatForUser('u-2');
  assert.deepEqual(calls, ['login:u-1', 'login:u-2']);
});

test('revenue cat service resolves offering, purchase, restore and entitlement', async () => {
  const service = createRevenueCatService({
    platformOs: 'ios',
    getEnv: (name) => {
      if (name === 'EXPO_PUBLIC_RC_IOS_API_KEY') return 'ios-key';
      if (name === 'EXPO_PUBLIC_RC_OFFERING_MAIN') return 'main_offer';
      if (name === 'EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM') return 'gold';
      return undefined;
    },
    logLevels: { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 },
    purchases: {
      setLogLevel: () => {},
      isConfigured: async () => false,
      configure: () => {},
      logIn: async () => {},
      setAttributes: async () => {},
      getOfferings: async () => ({
        all: {
          main_offer: { id: 'main' },
        },
        current: { id: 'fallback' },
      }),
      purchasePackage: async (pkg) => ({ customerInfo: { pkg } }),
      restorePurchases: async () => ({ restored: true }),
    },
  });

  const offering = await service.getMainRevenueCatOffering();
  const customerInfo = await service.purchaseRevenueCatPackage({ id: 'annual' });
  const restore = await service.restoreRevenueCatPurchases();
  const hasEntitlement = service.hasPremiumRevenueCatEntitlement({
    entitlements: { active: { gold: { active: true } } },
  });

  assert.deepEqual(offering, { id: 'main' });
  assert.deepEqual(customerInfo, { pkg: { id: 'annual' } });
  assert.deepEqual(restore, { restored: true });
  assert.equal(hasEntitlement, true);
});
