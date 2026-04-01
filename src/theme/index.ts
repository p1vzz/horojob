export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  background: string;
  backgroundSubtle: string;
  surface: string;
  surfaceElevated: string;
  cardBg: string;
  cardMuted: string;
  border: string;
  borderStrong: string;
  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;
  muted: string;
  primary: string;
  secondary: string;
  mint: string;
  gold: string;
  amethyst: string;
  lunarWhite: string;
  danger: string;
  warning: string;
  inputBg: string;
  inputBorder: string;
  inputBorderActive: string;
  overlayScrim: string;
};

export type AppTheme = {
  mode: ThemeMode;
  isLight: boolean;
  isDark: boolean;
  colors: ThemeColors;
};

const DARK_COLORS: ThemeColors = {
  background: '#06060C',
  backgroundSubtle: '#0A0A14',
  surface: '#0E0E1E',
  surfaceElevated: '#14142A',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  cardMuted: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  foreground: '#D4D4E0',
  foregroundSecondary: 'rgba(212, 212, 224, 0.74)',
  foregroundMuted: 'rgba(212, 212, 224, 0.55)',
  muted: 'rgba(212, 212, 224, 0.55)',
  primary: '#C9A84C',
  secondary: '#5A3ACC',
  mint: '#38CC88',
  gold: '#C9A84C',
  amethyst: '#5A3ACC',
  lunarWhite: '#F5F7FF',
  danger: '#FF6B8A',
  warning: '#E1C066',
  inputBg: 'rgba(255, 255, 255, 0.03)',
  inputBorder: 'rgba(255, 255, 255, 0.06)',
  inputBorderActive: 'rgba(201, 168, 76, 0.3)',
  overlayScrim: 'rgba(5, 6, 12, 0.72)',
};

const LIGHT_COLORS: ThemeColors = {
  background: '#F3F0E9',
  backgroundSubtle: '#F8F3EA',
  surface: '#FBF8F1',
  surfaceElevated: '#FFFFFF',
  cardBg: 'rgba(255, 255, 255, 0.84)',
  cardMuted: 'rgba(255, 255, 255, 0.9)',
  border: 'rgba(154, 129, 92, 0.2)',
  borderStrong: 'rgba(149, 120, 79, 0.32)',
  foreground: '#3A352D',
  foregroundSecondary: 'rgba(86, 75, 61, 0.84)',
  foregroundMuted: 'rgba(106, 92, 74, 0.66)',
  muted: 'rgba(97, 88, 77, 0.62)',
  primary: '#BC6B2A',
  secondary: '#7D5BDD',
  mint: '#2FAE79',
  gold: '#B58D2B',
  amethyst: '#7D5BDD',
  lunarWhite: '#3F3A33',
  danger: '#D25F6E',
  warning: '#B18838',
  inputBg: 'rgba(255, 255, 255, 0.82)',
  inputBorder: 'rgba(154, 129, 92, 0.2)',
  inputBorderActive: 'rgba(181, 139, 60, 0.44)',
  overlayScrim: 'rgba(58, 46, 28, 0.16)',
};

const DARK_THEME: AppTheme = {
  mode: 'dark',
  isLight: false,
  isDark: true,
  colors: DARK_COLORS,
};

const LIGHT_THEME: AppTheme = {
  mode: 'light',
  isLight: true,
  isDark: false,
  colors: LIGHT_COLORS,
};

export function createAppTheme(mode: ThemeMode): AppTheme {
  return mode === 'light' ? LIGHT_THEME : DARK_THEME;
}

// Legacy export used across existing files. New code should prefer `useThemeMode().theme`.
export const theme: AppTheme = {
  ...DARK_THEME,
};

export function syncLegacyTheme(nextTheme: AppTheme) {
  theme.mode = nextTheme.mode;
  theme.isLight = nextTheme.isLight;
  theme.isDark = nextTheme.isDark;
  theme.colors = nextTheme.colors;
}

// Backward-compat no-op helpers kept temporarily to avoid stale Metro module crashes.
export function setThemeMode(mode: ThemeMode) {
  syncLegacyTheme(createAppTheme(mode));
}

export function resolveThemeColor<T>(value: T): T {
  return value;
}

export function installThemeColorPreprocessors() {
  // Intentional no-op. Legacy API kept for compatibility during migration.
}
