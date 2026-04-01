---
name: android-widget-ops
description: Use this skill when implementing, refactoring, or debugging Android home-screen widgets in the Horojob app, including widget provider Kotlin code, RemoteViews layouts, drawable resources, day/night color resources, widget info XML, and update/scheduling behavior. Do not use it for iOS widgets or backend-only changes.
---

# Goal

Ship Android widget changes that are visually correct, resource-safe, and synchronized with app logic.

# Apply when

Use this skill when the task involves:
- `MorningBriefingWidgetProvider.kt` behavior
- widget module/package wiring
- `res/layout/widget_*.xml` changes
- `res/drawable/widget_*.xml` changes
- widget day/night palette updates in `values` and `values-night`
- widget preview/info XML updates

Typical trigger phrases:
- update widget UI
- widget colors are wrong
- widget does not refresh
- add new widget variant
- fix widget layout

# Primary priorities

1. Keep layout, drawable, and provider IDs aligned.
2. Maintain day/night resource parity.
3. Preserve readability in small and medium widget sizes.
4. Keep update logic resilient and battery-aware.
5. Validate on real pinned widget states.

# Do

- inspect provider and layout resource IDs together before renaming
- update both:
  - `android/app/src/main/res/values/colors.xml`
  - `android/app/src/main/res/values-night/colors.xml`
- ensure new drawable/layout references exist for all widget variants
- keep widget info XML dimensions and resize modes coherent with layout
- test at least one small and one medium/strip widget on device

# Do not

- do not update only one theme resource set
- do not change resource names without updating provider references
- do not ship unreadable text contrast on light or dark wallpaper contexts

# Workflow

1. Identify affected widget variants and resource graph.
2. Apply layout/drawable/color changes with day/night parity.
3. Update provider code if IDs, pending intents, or update logic changed.
4. Rebuild and pin widgets on device/emulator.
5. Verify rendering, click actions, and refresh behavior.
6. Confirm no regressions in other widget variants.

# Output quality bar

A good result:
- keeps provider and resources synchronized
- preserves visual parity across day/night
- works on pinned widgets without stale states
- avoids regressions in unrelated widget variants
