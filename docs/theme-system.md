# Theme System

## Goal

Keep dark and light themes scalable, predictable, and easy to extend without ad hoc color overrides.

## Source of truth

- `src/theme/index.ts` defines semantic theme tokens (`ThemeColors`) and mode factories (`createAppTheme`).
- `src/theme/ThemeModeProviderImpl.tsx` owns mode state, persistence, and context APIs (`useThemeMode`, `useAppTheme`).
- `src/screens/SettingsScreen.tsx` is the UI entry point for user mode switching (`setMode('light' | 'dark')`).
- `android/app/src/main/res/values/colors.xml` and `android/app/src/main/res/values-night/colors.xml` are the source of truth for widget light/dark colors.

## Mandatory rules

- Use `useThemeMode` or `useAppTheme` in UI code; avoid new direct usage of mutable legacy `theme`.
- Do not use runtime color inversion or global color preprocessors.
- If a color role is reusable, add it to `ThemeColors` with both dark and light values.
- If a color role is feature-specific, define explicit `DARK_*` and `LIGHT_*` local palettes in that feature file.
- Keep contrast readable in both modes for text, borders, cards, inputs, and status accents.
- When changing widget visuals, update both `values/colors.xml` and `values-night/colors.xml` in the same diff.

## How to add a themed UI block

1. Start from semantic token mapping (`background`, `surface`, `foreground`, `border`, `primary`, etc.).
2. If mapping is not possible, add a new semantic token pair to `src/theme/index.ts`.
3. Wire styles from `useThemeMode().theme.colors` (or `useAppTheme().colors`).
4. For special visuals (onboarding gradients, feature cards), define parallel dark/light local palette constants.
5. Verify dark and light mode before shipping.

## Migration policy

- New files must be token-first.
- When touching legacy files with hardcoded colors, migrate the touched area to token/local-palette style.
- Keep compatibility shims (`src/theme.ts`, `src/theme/ThemeModeProvider.ts`, no-op legacy helpers) only while migration is in progress.
- Remove legacy shims after all screens/components are moved to context-driven theme APIs.

## QA checklist for theme changes

- App launches without Metro import errors from `src/theme` paths.
- Theme switch in Settings updates screen colors immediately and persists after app restart.
- Text contrast is readable on all touched screens in both modes.
- Android widgets preserve parity with app theme direction and do not regress readability.
