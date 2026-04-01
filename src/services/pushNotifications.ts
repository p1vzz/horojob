import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { upsertPushNotificationToken } from './notificationsApi';
import { createPushNotificationsService } from './pushNotificationsCore';

export * from './pushNotificationsCore';

function resolveEasProjectId() {
  const fromEasConfig = Constants.easConfig?.projectId;
  if (typeof fromEasConfig === 'string' && fromEasConfig.trim().length > 0) {
    return fromEasConfig.trim();
  }

  const fromExpoConfig = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.eas as
    | Record<string, unknown>
    | undefined;
  const projectId = fromExpoConfig?.projectId;
  if (typeof projectId === 'string' && projectId.trim().length > 0) {
    return projectId.trim();
  }

  return null;
}

const pushNotificationsService = createPushNotificationsService({
  platformOs: Platform.OS,
  appVersion: Constants.expoConfig?.version ?? null,
  getProjectId: resolveEasProjectId,
  getStoredToken: (key) => AsyncStorage.getItem(key),
  setStoredToken: (key, value) => AsyncStorage.setItem(key, value),
  removeStoredToken: (key) => AsyncStorage.removeItem(key),
  getPermissionsAsync: () => Notifications.getPermissionsAsync(),
  requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
  setNotificationChannelAsync: (channelId, config) => Notifications.setNotificationChannelAsync(channelId, config),
  androidImportanceDefault: Notifications.AndroidImportance.DEFAULT,
  getExpoPushTokenAsync: (params) => Notifications.getExpoPushTokenAsync(params),
  upsertPushNotificationToken,
});

export const registerPushTokenForUser = pushNotificationsService.registerPushTokenForUser;
export const clearPushTokenSyncMarkerForUser = pushNotificationsService.clearPushTokenSyncMarkerForUser;
