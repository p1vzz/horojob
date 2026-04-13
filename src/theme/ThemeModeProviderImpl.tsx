import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createAppTheme, syncLegacyTheme, type AppTheme, type ThemeMode } from './index';

const V1_APP_THEME_MODE: ThemeMode = 'dark';
const V1_APP_THEME = createAppTheme(V1_APP_THEME_MODE);

type ThemeModeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  colors: AppTheme['colors'];
  isLight: boolean;
  isDark: boolean;
  isReady: boolean;
  hasExplicitModeSelection: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // App light theme is parked for v2. Widgets keep their own day/night resources.
    syncLegacyTheme(V1_APP_THEME);
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode: V1_APP_THEME.mode,
      theme: V1_APP_THEME,
      colors: V1_APP_THEME.colors,
      isLight: V1_APP_THEME.isLight,
      isDark: V1_APP_THEME.isDark,
      isReady: true,
      hasExplicitModeSelection: false,
      setMode: () => {},
      toggleMode: () => {},
    }),
    []
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider');
  }
  return context;
}

export function useAppTheme() {
  return useThemeMode().theme;
}
