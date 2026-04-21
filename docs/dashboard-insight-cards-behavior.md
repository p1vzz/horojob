# Dashboard Insight Cards Behavior
**Status:** Active  
**Last synced:** 2026-04-21

## Goal

Document real dashboard insight-card behavior to avoid confusion between feature specs and current shipped UI behavior.

## Current Render Topology

- `DashboardScreen` renders both insight cards in fixed order:
  1. `BurnoutInsightTile` when current-day burnout severity is in threshold (`warn`, `high`, or `critical`), or when a burnout push opened the dashboard and live hydration failed
  2. `LunarProductivityInsightTile` when current-day lunar score is inside the shipped supportive/disruptive display range, or when a lunar push opened the dashboard and live hydration failed
- `DashboardScreen` keeps a full-screen readiness gate visible until all current async dashboard sections report ready.

## Data Source Reality (Current)

- `DashboardScreen` hydrates burnout/lunar cards through `src/hooks/useDashboardInsights.ts`.
- Premium path attempts live fetch from:
  - `GET /api/notifications/burnout-plan`
  - `GET /api/notifications/lunar-productivity-plan`
- If a premium user sees an in-threshold same-day insight before the corresponding push is sent, the dashboard acknowledge path calls:
  - `POST /api/notifications/burnout-seen`
  - `POST /api/notifications/lunar-productivity-seen`
- Unavailable-state policy is per-card:
  - `free` plan -> frozen snapshot data kept in state, but alert cards stay hidden because no live threshold can be confirmed
  - regular dashboard `403` / `404` / transport failure -> affected alert card stays hidden because threshold cannot be confirmed
  - push-entry `403` / `404` / transport failure -> degraded unavailable state for the targeted alert card only
  - successful premium fetch -> live snapshot
- Hydration is also per-card:
  - each card owns its own `SYNCING` state
  - retrying one unavailable card does not block the other card
- Live cards and push-entry unavailable cards may show a local `Updated ...` label based on the last successful live sync timestamp.
- Unavailable cards do not show frozen percentages, severity labels, reasons, or metric bars. They show a plain unavailable message and a `Try Again` action.
- Refresh happens on screen focus, so returning from `Settings` re-runs snapshot hydration.
- When the burnout plan is in threshold or the lunar plan is inside the display range and a same-day push is still pending, the dashboard acknowledge path suppresses that pending push after the card is surfaced.
- Manual release validation lives in `docs/dashboard-insight-cards-smoke-checklist.md`.

## Contract Adapter Layer

- `src/services/dashboardInsightSnapshots.ts` is the mobile source of truth for dashboard-card snapshot shape.
- The module defines:
  - frozen preview snapshots used by preview/default state
  - `toBurnoutInsightSnapshotFromPlan(payload)`
  - `toLunarProductivityInsightSnapshotFromPlan(payload)`
- Adapter intent:
  - keep `notificationsApi` transport shape out of card components
  - preserve current 4-metric card layout while mapping richer backend payloads
  - keep dashboard cards presentational while the hook owns data-source selection

Current metric compression rules:
- Burnout card collapses `workloadMismatch` + `tagPressure` into one dashboard metric: `Workload Friction`.
- Lunar card collapses `focusResonance` + `circadianAlignment` into one dashboard metric: `Focus Drag`.
- Settings continues to consume raw plan payloads for toggle/status behavior.
- Dashboard cards consume mapped snapshots only, never raw `notificationsApi` payloads.

## Card Copy And QA Surface

- Burnout and lunar cards show user-facing guidance, not raw model diagnostics.
- Burnout no longer renders the source badge, algorithm-version pill, derived-model footnote, or decorative background glow sphere.
- Unavailable/retry behavior remains available through `Try Again` only for push-entry recovery states, without showing a misleading risk score.

## Theme Behavior

- Burnout card uses extracted explicit dark/light palette constants from `burnoutInsightVisuals.ts` and switches by `useThemeMode().isLight`.
- Lunar card uses extracted explicit dark/light palette constants from `lunarProductivityInsightVisuals.ts` and switches by `useThemeMode().isLight`.

## Premium/Gating Behavior

- Dashboard alert-card rendering depends on premium live hydration because threshold state is only trusted from backend plans.
- Premium gating for burnout/lunar controls is enforced in Settings and API endpoints, not in dashboard tile visibility.
- For free users, alert cards stay hidden on the dashboard because no live threshold is available.
- Burnout card visibility is gated by `risk.severity !== 'none'`, so below-threshold burnout days do not render the burnout tile.
- Lunar card visibility is additionally gated by `impactDirection !== null`, so middle-range lunar days do not render the lunar tile even for premium users.

## Push Entry Coupling

- Notification tap opens dashboard for both `burnout_alert` and `lunar_productivity_alert`.
- Push entry carries `alertFocus` route params:
  - `burnout_alert` -> `alertFocus=burnout`
  - `lunar_productivity_alert` -> `alertFocus=lunar`
- After dashboard readiness completes and the target card layout is measured, the screen scrolls to the target card and briefly highlights it.
- If targeted live hydration fails after a push tap, the app can show the targeted degraded state so the user has a retry path. If live hydration succeeds and the score is outside the display range, the targeted card remains hidden.
- Push entry emits lightweight analytics events:
  - `dashboard_alert_opened_from_push` when the notification response is handled
  - `dashboard_alert_push_target_focused` when the dashboard scroll/highlight succeeds
  - `dashboard_alert_push_target_hidden` when live state no longer confirms that the target card should be shown

## Follow-Up Decisions To Record Later

1. Should unavailable state show an explicit "temporarily unavailable" badge?

## Related Files

- `src/screens/DashboardScreen.tsx`
- `src/components/BurnoutInsightTile.tsx`
- `src/components/LunarProductivityInsightTile.tsx`
- `src/hooks/useDashboardInsights.ts`
- `src/hooks/useDashboardInsightsCore.ts`
- `src/services/dashboardInsightSnapshots.ts`
- `src/screens/SettingsScreen.tsx`
- `src/services/notificationsApi.ts`
- `docs/dashboard-insight-cards-smoke-checklist.md`
