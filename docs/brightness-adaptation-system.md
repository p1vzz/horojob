# Brightness Adaptation System
**Status:** Active  
**Last synced:** 2026-04-07

## Goal

Keep key UI elements readable on different screen-brightness levels without adding a second theme layer on top of the dark app shell.

## Source Of Truth

- Provider/runtime: `src/contexts/BrightnessAdaptationContext.tsx`
- Tier/channel logic: `src/contexts/brightnessAdaptationCore.ts`
- Color helpers: `src/utils/brightnessAdaptation.ts`
- Regression tests:
  - `src/contexts/brightnessAdaptationCore.test.ts`
  - `src/utils/brightnessAdaptation.test.ts`

## Runtime Model

- `BrightnessAdaptationProvider` is mounted near the app root.
- Sampling is consumer-driven:
  - no active consumers -> no brightness polling
  - at least one active consumer -> provider samples while app state is `active`
- Sampling interval: `1200ms`
- Tier hysteresis: `0.04`
- Permission denied or runtime failure -> system falls back to neutral channels (`1.0`)

## Semantic Channels

- `intensityMultiplier`
  - use for pulse strength, wheel intensity, shimmer strength, loader emphasis
- `textOpacityMultiplier`
  - use for secondary text, icons, placeholders, labels
- `borderOpacityMultiplier`
  - use for outlines, separators, accent strokes, chips, rings
- `glowOpacityMultiplier`
  - use for soft fills, ambient halos, gradient overlays, loader atmosphere

Current tier grid:

- `very-low`: `1.28 / 1.18 / 1.24 / 1.40`
- `low`: `1.14 / 1.10 / 1.12 / 1.18`
- `medium`: `1 / 1 / 1 / 1`
- `high`: `0.98 / 0.96 / 0.94 / 0.88`
- `very-high`: `0.94 / 0.92 / 0.90 / 0.80`

Order in each row: `intensity / text / border / glow`.

## Usage Pattern

```tsx
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../utils/brightnessAdaptation';

function ExampleCard() {
  const { channels } = useBrightnessAdaptation();

  return (
    <View
      style={{
        backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
        borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
      }}
    />
  );
}
```

## Mapping Rules

- Use `adaptColorOpacity(..., channels.textOpacityMultiplier)` for:
  - secondary labels
  - helper copy
  - placeholders
  - subdued icons
- Use `adaptColorOpacity(..., channels.borderOpacityMultiplier)` for:
  - card outlines
  - dividers
  - accent rings
  - chip borders
- Use `adaptColorOpacity(..., channels.glowOpacityMultiplier)` for:
  - translucent fills
  - radial/linear glow layers
  - loader aura
  - tinted overlays
- Use raw `channels.intensityMultiplier` for:
  - animation intensity math
  - staged pulse strength
  - reveal/emphasis curves
- Use `adaptOpacity(...)` only when the UI API takes a numeric opacity prop instead of a color string.

## Current Application Areas

- Startup:
  - `src/components/loaders/BrandStartupLoader.tsx`
- Onboarding:
  - `src/screens/OnboardingScreen.tsx`
  - `src/components/OnboardingWheel.tsx`
- Dashboard:
  - `src/screens/DashboardScreen.tsx`
  - `src/components/DashboardHeader.tsx`
  - `src/components/DailyAstroStatus.tsx`
  - `src/components/JobCheckTile.tsx`
- Scanner:
  - `src/screens/ScannerScreen.tsx`
  - `src/screens/ScannerHistoryScreen.tsx`
  - `src/screens/scanner/ScannerSearchPanel.tsx`
  - `src/screens/scanner/ScannerFeedbackCard.tsx`
  - `src/screens/scanner/ScannerAnalysisSection.tsx`
  - `src/components/loaders/ZodiacCardLoader.tsx`

## Do And Do Not

- Do keep brightness adaptation local to high-value surfaces on dark mode.
- Do prefer semantic channels over inventing per-screen scalar boosts.
- Do preserve neutral fallback behavior when adaptation is unavailable.
- Do not use brightness adaptation as a substitute for missing theme tokens.
- Do not add another global polling loop outside `BrightnessAdaptationProvider`.
- Do not multiply the same surface through multiple semantic channels unless the visual role is genuinely mixed.

## Tuning Workflow

1. Reproduce the target screen on low and high device brightness.
2. Decide whether the problem is text, border, glow, or intensity.
3. Tune the shared tier grid in `brightnessAdaptationCore.ts` first.
4. Only add local exceptions if the component has a unique visual role.
5. Run `npm run verify` after non-trivial brightness changes.
