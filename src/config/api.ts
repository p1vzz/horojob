import { Platform } from 'react-native';

const fallbackBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL =
  (configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : fallbackBaseUrl).replace(/\/+$/, '');

