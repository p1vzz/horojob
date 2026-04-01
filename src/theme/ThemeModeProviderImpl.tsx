import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createAppTheme, syncLegacyTheme, type AppTheme, type ThemeMode } from './index';

const THEME_MODE_STORAGE_KEY = 'horojob-theme-mode:v1';

type ThemeModeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  colors: AppTheme['colors'];
  isLight: boolean;
  isDark: boolean;
  isReady: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function normalizeThemeMode(raw: string | null): ThemeMode {
  return raw === 'light' ? 'light' : 'dark';
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const storedValue = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
        if (!mounted) return;
        setModeState(normalizeThemeMode(storedValue));
      } catch {
        if (!mounted) return;
        setModeState('dark');
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    // Transitional bridge while legacy `theme` imports are still in the codebase.
    syncLegacyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const applyThemeMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode).catch(() => {
      // Keep runtime mode even if persistence fails.
    });
  };

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      theme: resolvedTheme,
      colors: resolvedTheme.colors,
      isLight: resolvedTheme.isLight,
      isDark: resolvedTheme.isDark,
      isReady,
      setMode: applyThemeMode,
      toggleMode: () => applyThemeMode(mode === 'light' ? 'dark' : 'light'),
    }),
    [isReady, mode, resolvedTheme]
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
