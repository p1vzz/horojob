export type AppEnvironment = 'development' | 'staging' | 'production';

export const APP_ENVIRONMENT_ENV_VAR = 'EXPO_PUBLIC_APP_ENV';

const DEVELOPMENT_ALIASES = new Set(['development', 'dev', 'local', 'debug']);
const STAGING_ALIASES = new Set(['staging', 'stage', 'preview', 'qa', 'test']);
const PRODUCTION_ALIASES = new Set(['production', 'prod', 'release']);

function resolveRuntimeDevelopmentFlag() {
  if (typeof __DEV__ === 'boolean') return __DEV__;
  return process.env.NODE_ENV !== 'production';
}

export function resolveAppEnvironment(rawValue: string | null | undefined, runtimeIsDevelopment: boolean): AppEnvironment {
  const normalized = rawValue?.trim().toLowerCase();
  if (normalized) {
    if (DEVELOPMENT_ALIASES.has(normalized)) return 'development';
    if (STAGING_ALIASES.has(normalized)) return 'staging';
    if (PRODUCTION_ALIASES.has(normalized)) return 'production';
  }

  return runtimeIsDevelopment ? 'development' : 'production';
}

export function shouldExposeTechnicalSurfaces(environment: AppEnvironment) {
  return environment !== 'production';
}

export function shouldAllowDevelopmentOverrides(environment: AppEnvironment) {
  return environment === 'development';
}

export const APP_ENVIRONMENT = resolveAppEnvironment(
  process.env.EXPO_PUBLIC_APP_ENV,
  resolveRuntimeDevelopmentFlag(),
);
export const IS_DEVELOPMENT_APP_ENVIRONMENT = APP_ENVIRONMENT === 'development';
export const IS_STAGING_APP_ENVIRONMENT = APP_ENVIRONMENT === 'staging';
export const IS_PRODUCTION_APP_ENVIRONMENT = APP_ENVIRONMENT === 'production';
export const SHOULD_EXPOSE_TECHNICAL_SURFACES = shouldExposeTechnicalSurfaces(APP_ENVIRONMENT);
export const SHOULD_ALLOW_DEVELOPMENT_OVERRIDES = shouldAllowDevelopmentOverrides(APP_ENVIRONMENT);
