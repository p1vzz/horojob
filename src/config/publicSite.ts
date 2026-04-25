function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const configuredBaseUrl = typeof process.env.EXPO_PUBLIC_PUBLIC_SITE_BASE_URL === 'string'
  ? process.env.EXPO_PUBLIC_PUBLIC_SITE_BASE_URL.trim()
  : '';

export const PUBLIC_SITE_BASE_URL = trimTrailingSlash(
  configuredBaseUrl.length > 0 ? configuredBaseUrl : 'https://horojob.app'
);

export const PUBLIC_PRIVACY_POLICY_URL = `${PUBLIC_SITE_BASE_URL}/privacy-policy`;
export const PUBLIC_TERMS_OF_USE_URL = `${PUBLIC_SITE_BASE_URL}/terms-of-use`;
export const PUBLIC_SUPPORT_URL = `${PUBLIC_SITE_BASE_URL}/support`;
