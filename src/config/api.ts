import { Platform } from 'react-native';
import { APP_ENVIRONMENT } from './appEnvironment';
import { resolveApiBaseUrl } from './apiCore';

export const API_BASE_URL = resolveApiBaseUrl({
  appEnvironment: APP_ENVIRONMENT,
  configuredBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  platformOS: Platform.OS,
});
