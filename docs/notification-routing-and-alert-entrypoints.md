# Notification Routing And Alert Entry Points
**Status:** Active  
**Last synced:** 2026-03-29

## Goal

Capture what push payloads are currently handled by mobile navigation, and what is still missing for insight-specific entry points.

## Runtime Ownership

- Notification response handling lives in `App.tsx`.
- Settings toggles and alert planning state live in `src/screens/SettingsScreen.tsx` + `src/services/notificationsApi.ts`.

## Handled Push Payloads (Current)

1. `type = burnout_alert`
   - Action: open `Dashboard`.
   - If navigation is not ready yet, action is deferred and executed in `NavigationContainer.onReady`.
   - Last notification response is cleared after handling.

## Not Handled Yet (Current)

1. `type = lunar_productivity_alert` routing behavior is not implemented in `App.tsx`.
2. No payload-aware deep link to a specific dashboard block (for example, auto-focus to burnout/lunar card).
3. No local "entry context" state on `Dashboard` (for example `openedFromPush: burnout`).

## Practical Consequences

- Burnout push can bring user into app, but lands on generic dashboard root.
- Lunar push delivery can exist on backend side, but mobile tap action will not navigate by payload type unless explicitly added.

## Suggested Next Increment

1. Add payload routing matrix in `App.tsx` for all supported `type` values.
2. Extend `RootStackParamList` and `DashboardScreen` with optional alert entry param.
3. Add deterministic dashboard anchor behavior:
   - `burnout_alert` -> highlight/scroll to burnout card.
   - `lunar_productivity_alert` -> highlight/scroll to lunar card.

## Related Files

- `App.tsx`
- `src/types/navigation.ts`
- `src/screens/DashboardScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/services/notificationsApi.ts`

