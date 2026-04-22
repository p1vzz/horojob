import type { AppEnvironment } from './appEnvironment';

type ResolveApiBaseUrlInput = {
  appEnvironment: AppEnvironment;
  configuredBaseUrl?: string | null;
  platformOS: string;
};

function fallbackBaseUrlForPlatform(platformOS: string) {
  return platformOS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787';
}

function normalizeApiBaseUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    throw new Error('API base URL is empty');
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    throw new Error('API base URL must be a valid absolute URL');
  }
}

export function resolveApiBaseUrl(input: ResolveApiBaseUrlInput) {
  const configuredBaseUrl = input.configuredBaseUrl?.trim();
  const hasConfiguredBaseUrl = Boolean(configuredBaseUrl);

  if (!hasConfiguredBaseUrl && input.appEnvironment !== 'development') {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be set for staging and production builds');
  }

  const rawBaseUrl =
    hasConfiguredBaseUrl && configuredBaseUrl
      ? configuredBaseUrl
      : fallbackBaseUrlForPlatform(input.platformOS);
  const baseUrl = normalizeApiBaseUrl(rawBaseUrl);
  const parsed = new URL(baseUrl);

  if (input.appEnvironment !== 'development' && parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must use https outside development builds');
  }

  return baseUrl;
}
