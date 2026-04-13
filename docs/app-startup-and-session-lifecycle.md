# App Startup And Session Lifecycle
**Status:** Active  
**Last synced:** 2026-04-12

## Goal

Document how app startup resolves session state, onboarding state, and background sync tasks.

## Entry Point

- Root composition: `App.tsx`
- Providers:
  - `QueryClientProvider`
  - `ThemeModeProvider`
  - `BrightnessAdaptationProvider`
  - `GestureHandlerRootView`
  - `SafeAreaProvider`
  - `NavigationContainer`

## Startup Sequence

1. Initialize notification response listeners.
2. Show brand startup loader while bootstrap runs.
   - visual mark: zodiac-ring ascent mark rendered by `src/components/brand/BrandAstroWheelMark.tsx`
   - background: shared dark onboarding backdrop (`#06060C` base with the same cosmic atmosphere used by the dark app shell)
   - brightness behavior: mark, shimmer, subtitle, and loader glow use the semantic brightness-adaptation channels documented in `docs/brightness-adaptation-system.md`
   - native splash/app icon assets are regenerated from the same ascent-mark geometry via `scripts/generate-brand-assets.ps1`
   - visibility gate: remains on screen for at least 3 seconds before app shell can advance
3. In parallel with the startup loader, run bootstrap:
   - `ensureAuthSession()`
   - read local onboarding cache (`loadOnboardingForUser`)
   - configure RevenueCat for the user when available
4. Resolve birth profile source of truth:
   - try `fetchBirthProfile()`
   - if remote profile exists: overwrite local onboarding cache
   - if remote profile is missing: clear onboarding + natal chart local caches
5. Mark app ready:
   - `setHasOnboarded(Boolean(localProfile))`
   - `setIsReady(true)`
6. Route directly into the dark app shell after the startup loader clears.
   - app light theme and first-run theme selection are deferred to v2
   - onboarding and dashboard now mount directly under the dark runtime background without a theme handoff overlay
   - Android widgets keep their separate day/night resources and are not affected by this app-level dark-only decision
7. Trigger non-blocking background sync tasks:
   - `registerPushTokenForUser(userId)`
   - `syncRevenueCatSubscription()` + `updateCurrentSessionUser(...)`
   - `syncMorningBriefingCache()`

## Navigation Decision

- Default behavior:
  - if `hasOnboarded` -> `Dashboard`
  - else -> `Onboarding`
- Optional development override:
  - `EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY=true` keeps initial route on `Onboarding`
  - `EXPO_PUBLIC_FORCE_STARTUP_LOADER=true` keeps startup loader pinned for visual inspection
  - override is honored in development builds only

## Notification-Driven Navigation

- App listens to Expo notification responses during startup and runtime.
- If payload `type === burnout_alert` or `type === lunar_productivity_alert`, app navigates to `Dashboard` with an `alertFocus` param for the matching card.
- If navigation is not ready yet, the focused dashboard open is deferred until `NavigationContainer.onReady`.
- `Dashboard` waits for readiness, then scrolls to and briefly highlights the focused card when it is rendered.
- Foreground notification presentation is enabled through `Notifications.setNotificationHandler(...)`, so alert pushes can show banners while the app is open.
- Last notification response is cleared after handling.

## Session Update Points

- Session can be refreshed during authorized API calls via `authorizedFetch(...)`.
- Billing sync updates current session user snapshot using `updateCurrentSessionUser(...)`.
- Logout path clears local session and cached user-scoped artifacts.

## Failure Behavior

- Auth bootstrap failure does not crash startup; app falls back to onboarding-required state.
- Remote profile fetch failures keep local onboarding fallback.
- Background sync failures do not block rendering.

## Related Files

- `App.tsx`
- `src/services/authSession.ts`
- `src/services/astrologyApi.ts`
- `src/services/billingApi.ts`
- `src/services/pushNotifications.ts`
- `src/services/morningBriefingSync.ts`
- `src/utils/onboardingStorage.ts`
- `src/utils/natalChartStorage.ts`
