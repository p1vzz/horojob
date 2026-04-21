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
3. App shows a premium activation prompt with an `Add Widget` action.
4. `Add Widget` navigates to Settings with `openWidgetSetup` route params.
5. Android: Settings opens the widget style picker automatically for premium users.
6. Android: user selects widget style (with in-app preview cards).
7. Android: app triggers system pin request for the selected style; if accepted, widget is placed.
8. iOS: open guided instructions (3 steps) for manual add.
9. App syncs widget payload to shared storage and asks native widget to reload.
10. Setup status is marked `enabled` and success confirmation is shown.

## Returning Premium User Flow
1. On app launch, detect premium + widget setup status.
2. If not configured, show reminder CTA in dashboard/settings.
3. If configured, silently refresh payload and keep widget up to date.
4. User can reopen style picker in Settings and choose another Android widget style.
5. Tapping an Android widget opens the full Career Vibe plan inside the app.

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
- If Career Vibe plan fetch fails in-app without a saved payload, the dashboard card shows unavailable/preparing copy and does not display sample guidance.

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
- Android widgets render the plan primary action and peak window when `morning-briefing-v2` payload includes `plan`.
- Android widget tap opens `CareerVibePlan` through the `horojob://career-vibe-plan` deep link.
