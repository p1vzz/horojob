# Premium Widget - User Flow
**Version:** 0.1  
**Status:** Active for Android (multi-variant setup flow), iOS pending native widget extension  
**Owner:** Mobile + Backend

## Scope
- Feature: `Morning Career Briefing` home-screen widget (premium-only surface).
- Platforms: Android + iOS.
- Entry points: `PremiumPurchaseScreen`, `SettingsScreen`, and first app launch after premium activation.

## Platform Constraints
- Premium entitlement can be activated automatically after purchase validation.
- Widget enablement cannot be done silently by app code.
- Android supports system pin flow (`requestPinAppWidget`) with user confirmation.
- iOS supports only manual widget placement by user via Home Screen edit flow.

## Primary Flow (New Premium User)
1. User completes premium purchase.
2. App refreshes entitlement from backend session (`free` -> `premium`).
3. App shows setup prompt: `Enable Morning Career Briefing Widget`.
4. Android: user selects widget style (with in-app preview cards).
5. Android: app triggers system pin request for the selected style; if accepted, widget is placed.
5. iOS: open guided instructions (3 steps) for manual add.
6. App syncs widget payload to shared storage and asks native widget to reload.
7. Setup status is marked `enabled` and success confirmation is shown.

## Returning Premium User Flow
1. On app launch, detect premium + widget setup status.
2. If not configured, show reminder CTA in dashboard/settings.
3. If configured, silently refresh payload and keep widget up to date.
4. User can reopen style picker in Settings and choose another Android widget style.

## Setup State Model
- `not_eligible` (free plan)
- `eligible_not_prompted`
- `prompt_dismissed`
- `pin_requested` (android only)
- `enabled`
- `failed`

Keep state in local storage; mirror as analytics events for funnel analysis.

## Fallback Behavior
- If widget is not enabled, show the same briefing content as in-app card.
- If premium expires, widget shows locked/upgrade state on next refresh.
- If fresh data fetch fails, widget shows last successful payload with stale timestamp.

## Edge Cases
- Purchase succeeded but entitlement sync is delayed.
- User dismisses pin request.
- User logs out (clear widget payload and show signed-out placeholder).
- User timezone/day boundary changed (regenerate by local date key).

## Acceptance Criteria
- Premium activation and widget onboarding are separate but connected steps.
- Non-premium users never see unlocked widget content.
- Widget setup state is stable across app restarts and re-login.
- Android widget picker exposes all supported variant cards with previews.
