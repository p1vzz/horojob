import type { RootStackParamList } from './types/navigation';

export type AppInitialRouteName = Extract<keyof RootStackParamList, 'Onboarding' | 'Dashboard'>;

function parseBooleanEnv(rawValue: string | null | undefined) {
  if (typeof rawValue !== 'string') return false;
  const normalized = rawValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function shouldForceOnboardingEntry(rawValue: string | null | undefined, isDev: boolean) {
  return isDev && parseBooleanEnv(rawValue);
}

export function shouldForceStartupLoader(rawValue: string | null | undefined, isDev: boolean) {
  return isDev && parseBooleanEnv(rawValue);
}

export function resolveInitialRouteName(input: {
  hasOnboarded: boolean;
  forceOnboardingEntry: boolean;
}): AppInitialRouteName {
  if (input.forceOnboardingEntry || !input.hasOnboarded) {
    return 'Onboarding';
  }
  return 'Dashboard';
}
