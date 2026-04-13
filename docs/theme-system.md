# Theme System

## Goal

Keep theme tokens scalable and predictable while app v1 ships dark-only UI and preserves light-theme assets for a later v2 rollout.

## Source of truth

- `src/theme/index.ts` defines semantic theme tokens (`ThemeColors`) and mode factories (`createAppTheme`).
- `src/theme/ThemeModeProviderImpl.tsx` exposes the app runtime theme context (`useThemeMode`, `useAppTheme`) and currently pins the mobile app to dark mode for v1.
- `docs/brightness-adaptation-system.md` defines the screen-brightness adaptation model used on top of the dark app shell for loaders, onboarding, dashboard accents, and scanner states.
- `android/app/src/main/res/values/colors.xml` and `android/app/src/main/res/values-night/colors.xml` are the source of truth for widget light/dark colors.
- `App.tsx` uses a dark startup loader and routes directly into the app stack without a theme chooser in v1.
- `src/components/backgrounds/CosmicOnboardingDarkBackground.tsx` is the active startup/onboarding backdrop surface. `src/components/backgrounds/CosmicOnboardingLightBackground.tsx` is kept parked for v2 work.

## Mandatory rules

- Use `useThemeMode` or `useAppTheme` in UI code; avoid new direct usage of mutable legacy `theme`.
- Do not use runtime color inversion or global color preprocessors.
- If a color role is reusable, add it to `ThemeColors` with both dark and light values.
- If a color role is feature-specific, define explicit `DARK_*` and `LIGHT_*` local palettes in that feature file.
- Keep app contrast readable in dark mode, and keep widget contrast readable in both Android day/night resources.
- Use `useBrightnessAdaptation()` for screen-brightness responsiveness instead of ad hoc polling or one-off opacity multipliers.
- When changing widget visuals, update both `values/colors.xml` and `values-night/colors.xml` in the same diff.
- Do not reintroduce app light-mode switching or the startup theme chooser in v1 work unless product explicitly asks for it.
- Keep parked light-mode palettes/components intact where practical so v2 can restore them without rebuilding from scratch.
- Keep the shared onboarding background components presentational and reusable; new flow-specific logic should stay in the parent screen rather than being pushed into these shared SVG surfaces.

## How to add a themed UI block

1. Start from semantic token mapping (`background`, `surface`, `foreground`, `border`, `primary`, etc.).
2. If mapping is not possible, add a new semantic token pair to `src/theme/index.ts`.
3. Wire styles from `useThemeMode().theme.colors` (or `useAppTheme().colors`).
4. For special visuals (onboarding gradients, feature cards), define parallel dark/light local palette constants.
5. If a touched dark-mode surface needs brightness responsiveness, apply semantic adaptation channels from `docs/brightness-adaptation-system.md`.
6. Verify touched app screens in dark mode before shipping.
7. If widgets are touched, verify both Android day and night resources.

## Migration policy

- New files must be token-first.
- When touching legacy files with hardcoded colors, migrate the touched area to token/local-palette style.
- Keep compatibility shims (`src/theme.ts`, `src/theme/ThemeModeProvider.ts`, no-op legacy helpers) only while migration is in progress.
- Remove legacy shims after all screens/components are moved to context-driven theme APIs.

## QA checklist for theme changes

- App launches without Metro import errors from `src/theme` paths.
- Startup loader, onboarding, and dashboard stay on dark backgrounds without light-theme flash.
- Settings does not expose an app theme switch in v1.
- Text contrast is readable on all touched app screens in dark mode.
- Android widgets preserve readable day/night variants and do not regress readability.
