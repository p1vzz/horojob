# Notification Routing And Alert Entry Points
**Status:** Active  
**Last synced:** 2026-04-13

## Goal

Capture what push payloads are currently handled by mobile navigation, and what is still missing for insight-specific entry points.

## Runtime Ownership

- Notification response handling lives in `App.tsx`.
- Settings toggles and alert planning state live in `src/screens/SettingsScreen.tsx` + `src/services/notificationsApi.ts`.

## Handled Push Payloads (Current)

1. `type = burnout_alert`
   - Action: open `Dashboard` with `alertFocus=burnout`.
   - If navigation is not ready yet, action is deferred and executed in `NavigationContainer.onReady`.
   - After dashboard readiness completes, the screen scrolls to the burnout card and briefly highlights it.
   - Analytics records the push open and whether the dashboard focused or hid the target card.
   - Last notification response is cleared after handling.
2. `type = lunar_productivity_alert`
   - Action: open `Dashboard` with `alertFocus=lunar`.
   - If navigation is not ready yet, action is deferred and executed in `NavigationContainer.onReady`.
   - After dashboard readiness completes, the screen scrolls to the lunar card and briefly highlights it when the card is visible.
   - Analytics records the push open and whether the dashboard focused or hid the target card.
   - Last notification response is cleared after handling.

## Analytics Events

- `dashboard_alert_opened_from_push`: emitted when a supported notification response is handled.
- `dashboard_alert_push_target_focused`: emitted after the target card is visible, measured, scrolled to, and highlighted.
- `dashboard_alert_push_target_hidden`: emitted if live dashboard state no longer confirms that the target card should render.

Shared properties:
- `source = push`
- `alertFocus = burnout | lunar`
- `notificationType = burnout_alert | lunar_productivity_alert`
- `alertFocusKey`
- `outcome = opened | focused | hidden`
- `reason`, only populated for hidden outcomes.

## Threshold Guardrails

- If a push opens the app but live hydration succeeds below threshold, the targeted alert card stays hidden because current backend state no longer confirms that the card should be shown.

## Practical Consequences

- Burnout and lunar pushes bring the user into the relevant dashboard card instead of landing only on the generic dashboard root.
- Dashboard readiness gating keeps the screen hidden until current async sections are ready, so alert taps reveal a fully built dashboard rather than partially loaded cards.
- If targeted live hydration fails after a push tap, dashboard can show a degraded unavailable card with `Try Again` instead of showing stale/frozen percentages.

## Related Files

- `App.tsx`
- `src/types/navigation.ts`
- `src/screens/DashboardScreen.tsx`
- `src/screens/dashboardAlertEntryCore.ts`
- `src/screens/SettingsScreen.tsx`
- `src/services/notificationsApi.ts`
