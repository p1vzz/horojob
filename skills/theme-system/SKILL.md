---
name: theme-system
description: Use this skill when implementing or refactoring dark/light theme behavior in the Horojob mobile app, including token updates in src/theme, ThemeModeProvider usage, Settings theme toggle wiring, color migration in screens/components, and Android widget light/dark color parity. Do not use it for backend API or server-side changes.
---

# Goal

Apply theme changes through semantic tokens and explicit dual palettes so future UI updates stay consistent and scalable.

# Apply when

Use this skill when the task involves:
- light theme rollout
- dark/light parity fixes
- theme token additions
- screen/component color migration
- settings theme switch behavior
- onboarding palette updates
- widget palette synchronization across Android day/night resources

Typical trigger phrases:
- make this screen support light theme
- invert colors by theme logic
- add theme toggle
- move hardcoded colors to theme tokens
- align widget colors with app light theme

# Primary priorities

1. Keep one source of truth for reusable colors in `src/theme/index.ts`.
2. Use context-driven theme access (`useThemeMode`, `useAppTheme`).
3. Keep explicit dark and light values for every new role.
4. Preserve readability and contrast in both modes.
5. Avoid temporary hacks that hide missing token design.

# Do

- read `docs/theme-system.md` before non-trivial theme edits
- map UI colors to semantic token roles first
- add new token pairs when a role is reusable across screens
- use local dual palettes (`DARK_*` and `LIGHT_*`) for feature-specific visuals
- keep settings toggle connected via `setMode('light' | 'dark')`
- update both Android widget files when widget colors change:
  - `android/app/src/main/res/values/colors.xml`
  - `android/app/src/main/res/values-night/colors.xml`

# Do not

- do not add runtime global color inversion preprocessors
- do not add new direct imports of mutable legacy `theme` in UI code
- do not ship one-mode-only color changes
- do not leave text/input/border contrast unchecked in either mode

# Workflow

For non-trivial theme tasks:

1. Inspect touched screens/components and classify each color as reusable token or local palette.
2. Update `src/theme/index.ts` token pairs if reusable roles are missing.
3. Apply colors through `useThemeMode` or `useAppTheme`.
4. Update settings/widget wiring if the task touches those areas.
5. Verify both modes on affected screens before finalizing.

# Output quality bar

A good result:
- keeps theme logic centralized and explicit
- avoids hardcoded ad hoc color drift
- maintains contrast and readability in dark and light modes
- keeps widgets aligned with app theme direction
