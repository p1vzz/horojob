# App Startup And Session Lifecycle
**Status:** Active  
**Last synced:** 2026-03-29

## Goal

Document how app startup resolves session state, onboarding state, and background sync tasks.

## Entry Point

- Root composition: `App.tsx`
- Providers:
  - `ThemeModeProvider`
  - `GestureHandlerRootView`
  - `SafeAreaProvider`
  - `NavigationContainer`

## Startup Sequence

1. Initialize notification response listeners.
2. Show neutral brand startup loader while bootstrap runs.
   - visual asset: `assets/horojob-logo-lockup.png`
   - background: neutral theme-agnostic splash color
3. Run auth bootstrap:
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
6. Trigger non-blocking background sync tasks:
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
- If payload `type === burnout_alert`, app navigates to `Dashboard`.
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
