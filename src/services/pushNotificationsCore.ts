const PUSH_TOKEN_SYNC_PREFIX = 'push-token-sync:v1';

export type PushTokenSyncResult =
  | { status: 'synced'; token: string }
  | { status: 'already_synced'; token: string }
  | { status: 'permission_denied' }
  | { status: 'missing_project_id' }
  | { status: 'token_unavailable' }
  | { status: 'unsupported_platform' };

export type PushNotificationsCoreDeps = {
  platformOs: string;
  appVersion: string | null;
  getProjectId: () => string | null;
  getStoredToken: (key: string) => Promise<string | null>;
  setStoredToken: (key: string, value: string) => Promise<void>;
  removeStoredToken: (key: string) => Promise<void>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync?: (channelId: string, config: { name: string; importance: number }) => Promise<unknown>;
  androidImportanceDefault?: number;
  getExpoPushTokenAsync: (params: { projectId: string }) => Promise<{ data?: string | null }>;
  upsertPushNotificationToken: (input: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    appVersion?: string | null;
  }) => Promise<unknown>;
};

export type RegisterPushTokenOptions = {
  forceSync?: boolean;
};

export function pushTokenSyncStorageKeyForUser(userId: string) {
  return `${PUSH_TOKEN_SYNC_PREFIX}:${userId}`;
}

async function ensureNotificationPermissionGranted(deps: PushNotificationsCoreDeps) {
  const current = await deps.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await deps.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

export function createPushNotificationsService(deps: PushNotificationsCoreDeps) {
  const registerPushTokenForUser = async (
    userId: string,
    options: RegisterPushTokenOptions = {}
  ): Promise<PushTokenSyncResult> => {
    if (deps.platformOs !== 'android' && deps.platformOs !== 'ios') {
      return { status: 'unsupported_platform' };
    }

    if (deps.platformOs === 'android' && deps.setNotificationChannelAsync) {
      await deps.setNotificationChannelAsync('default', {
        name: 'default',
        importance: deps.androidImportanceDefault ?? 3,
      });
    }

    const hasPermission = await ensureNotificationPermissionGranted(deps);
    if (!hasPermission) {
      return { status: 'permission_denied' };
    }

    const projectId = deps.getProjectId();
    if (!projectId) {
      return { status: 'missing_project_id' };
    }

    const tokenResult = await deps.getExpoPushTokenAsync({ projectId });
    const token = tokenResult.data?.trim();
    if (!token) {
      return { status: 'token_unavailable' };
    }

    const key = pushTokenSyncStorageKeyForUser(userId);
    const previousToken = await deps.getStoredToken(key);
    if (!options.forceSync && previousToken === token) {
      return { status: 'already_synced', token };
    }

    const platform = deps.platformOs === 'android' ? 'android' : 'ios';
    await deps.upsertPushNotificationToken({
      token,
      platform,
      appVersion: deps.appVersion ?? null,
    });

    await deps.setStoredToken(key, token);
    return { status: 'synced', token };
  };

  const clearPushTokenSyncMarkerForUser = async (userId: string) => {
    await deps.removeStoredToken(pushTokenSyncStorageKeyForUser(userId));
  };

  return {
    registerPushTokenForUser,
    clearPushTokenSyncMarkerForUser,
  };
}
