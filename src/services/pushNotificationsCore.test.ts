import assert from 'node:assert/strict';
import test from 'node:test';
import { createPushNotificationsService } from './pushNotificationsCore';

test('push notifications service returns unsupported_platform outside ios/android', async () => {
  const service = createPushNotificationsService({
    platformOs: 'web',
    appVersion: '1.0.0',
    getProjectId: () => 'project-id',
    getStoredToken: async () => null,
    setStoredToken: async () => {},
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async () => {},
  });

  const result = await service.registerPushTokenForUser('user-1');
  assert.deepEqual(result, { status: 'unsupported_platform' });
});

test('push notifications service returns permission_denied when permission is not granted', async () => {
  const service = createPushNotificationsService({
    platformOs: 'ios',
    appVersion: '1.0.0',
    getProjectId: () => 'project-id',
    getStoredToken: async () => null,
    setStoredToken: async () => {},
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'denied' }),
    requestPermissionsAsync: async () => ({ status: 'denied' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async () => {},
  });

  const result = await service.registerPushTokenForUser('user-1');
  assert.deepEqual(result, { status: 'permission_denied' });
});

test('push notifications service returns missing_project_id without EAS project', async () => {
  const service = createPushNotificationsService({
    platformOs: 'ios',
    appVersion: '1.0.0',
    getProjectId: () => null,
    getStoredToken: async () => null,
    setStoredToken: async () => {},
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async () => {},
  });

  const result = await service.registerPushTokenForUser('user-1');
  assert.deepEqual(result, { status: 'missing_project_id' });
});

test('push notifications service returns already_synced when token did not change', async () => {
  const service = createPushNotificationsService({
    platformOs: 'ios',
    appVersion: '1.0.0',
    getProjectId: () => 'project-id',
    getStoredToken: async () => 'ExponentPushToken[abc]',
    setStoredToken: async () => {},
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async () => {
      throw new Error('must not be called');
    },
  });

  const result = await service.registerPushTokenForUser('user-1');
  assert.deepEqual(result, { status: 'already_synced', token: 'ExponentPushToken[abc]' });
});

test('push notifications service force syncs unchanged token for explicit notification opt-ins', async () => {
  const calls: Array<{ kind: string; payload?: unknown }> = [];
  const service = createPushNotificationsService({
    platformOs: 'ios',
    appVersion: '1.0.0',
    getProjectId: () => 'project-id',
    getStoredToken: async () => 'ExponentPushToken[abc]',
    setStoredToken: async (key, value) => {
      calls.push({ kind: 'setStoredToken', payload: { key, value } });
    },
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async (input) => {
      calls.push({ kind: 'upsert', payload: input });
    },
  });

  const result = await service.registerPushTokenForUser('user-1', { forceSync: true });

  assert.deepEqual(result, { status: 'synced', token: 'ExponentPushToken[abc]' });
  assert.deepEqual(calls, [
    {
      kind: 'upsert',
      payload: {
        token: 'ExponentPushToken[abc]',
        platform: 'ios',
        appVersion: '1.0.0',
      },
    },
    {
      kind: 'setStoredToken',
      payload: {
        key: 'push-token-sync:v1:user-1',
        value: 'ExponentPushToken[abc]',
      },
    },
  ]);
});

test('push notifications service syncs token and stores marker on android', async () => {
  const calls: Array<{ kind: string; payload?: unknown }> = [];
  const service = createPushNotificationsService({
    platformOs: 'android',
    appVersion: '1.2.3',
    getProjectId: () => 'project-id',
    getStoredToken: async () => null,
    setStoredToken: async (key, value) => {
      calls.push({ kind: 'setStoredToken', payload: { key, value } });
    },
    removeStoredToken: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    setNotificationChannelAsync: async (channelId, config) => {
      calls.push({ kind: 'setChannel', payload: { channelId, config } });
    },
    androidImportanceDefault: 4,
    getExpoPushTokenAsync: async () => ({ data: '  ExponentPushToken[new]  ' }),
    upsertPushNotificationToken: async (input) => {
      calls.push({ kind: 'upsert', payload: input });
    },
  });

  const result = await service.registerPushTokenForUser('user-42');
  assert.deepEqual(result, { status: 'synced', token: 'ExponentPushToken[new]' });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].kind, 'setChannel');
  assert.deepEqual(calls[1], {
    kind: 'upsert',
    payload: {
      token: 'ExponentPushToken[new]',
      platform: 'android',
      appVersion: '1.2.3',
    },
  });
  assert.deepEqual(calls[2], {
    kind: 'setStoredToken',
    payload: {
      key: 'push-token-sync:v1:user-42',
      value: 'ExponentPushToken[new]',
    },
  });
});

test('push notifications service clears sync marker by user key', async () => {
  const removedKeys: string[] = [];
  const service = createPushNotificationsService({
    platformOs: 'ios',
    appVersion: null,
    getProjectId: () => 'project-id',
    getStoredToken: async () => null,
    setStoredToken: async () => {},
    removeStoredToken: async (key) => {
      removedKeys.push(key);
    },
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[abc]' }),
    upsertPushNotificationToken: async () => {},
  });

  await service.clearPushTokenSyncMarkerForUser('u-clear');
  assert.deepEqual(removedKeys, ['push-token-sync:v1:u-clear']);
});
