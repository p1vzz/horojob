import type { ThemeMode } from './index';

export type StoredThemeModeState = {
  mode: ThemeMode;
  hasExplicitModeSelection: boolean;
};

export function resolveStoredThemeModeState(raw: string | null): StoredThemeModeState {
  if (raw === 'light' || raw === 'dark') {
    return {
      mode: raw,
      hasExplicitModeSelection: true,
    };
  }

  return {
    mode: 'dark',
    hasExplicitModeSelection: false,
  };
}
