# Dashboard Insight Cards Behavior
**Status:** Active  
**Last synced:** 2026-03-31

## Goal

Document real dashboard insight-card behavior to avoid confusion between feature specs and current shipped UI behavior.

## Current Render Topology

- `DashboardScreen` renders both insight cards in fixed order:
  1. `BurnoutInsightTile`
  2. `LunarProductivityInsightTile`
- Render is unconditional in current screen code.

## Data Source Reality (Current)

- `DashboardScreen` hydrates burnout/lunar cards through `src/hooks/useDashboardInsights.ts`.
- Premium path attempts live fetch from:
  - `GET /api/notifications/burnout-plan`
  - `GET /api/notifications/lunar-productivity-plan`
- Fallback policy is per-card:
  - `free` plan -> frozen snapshot + `PREVIEW` badge
  - `403` / `404` / transport failure -> frozen snapshot + `FALLBACK` badge for the affected card only
  - successful premium fetch -> live snapshot + `LIVE` badge
- Hydration is also per-card:
  - each card owns its own `SYNCING` state
  - retrying one fallback card does not block the other card
- Live/fallback cards may show a local `Updated ...` label based on the last successful live sync timestamp.
- `FALLBACK` cards now expose a `RETRY LIVE` action directly in-card.
- Refresh happens on screen focus, so returning from `Settings` re-runs snapshot hydration.
- Manual release validation lives in `docs/dashboard-insight-cards-smoke-checklist.md`.

## Contract Adapter Layer

- `src/services/dashboardInsightSnapshots.ts` is the mobile source of truth for dashboard-card snapshot shape.
- The module defines:
  - frozen fallback snapshots used by current dashboard cards
  - `toBurnoutInsightSnapshotFromPlan(payload)`
  - `toLunarProductivityInsightSnapshotFromPlan(payload)`
- Adapter intent:
  - keep `notificationsApi` transport shape out of card components
  - preserve current 4-metric card layout while mapping richer backend payloads
  - keep dashboard cards presentational while the hook owns data-source selection

Current metric compression rules:
- Burnout card collapses `workloadMismatch` + `tagPressure` into one dashboard metric: `Mismatch`.
- Lunar card collapses `focusResonance` + `circadianAlignment` into one dashboard metric: `Focus Resonance`.
- Settings continues to consume raw plan payloads for toggle/status behavior.
- Dashboard cards consume mapped snapshots only, never raw `notificationsApi` payloads.

## Theme Behavior

- Burnout card uses extracted explicit dark/light palette constants from `burnoutInsightVisuals.ts` and switches by `useThemeMode().isLight`.
- Lunar card uses extracted single-palette visual constants plus `useAppTheme()` for semantic lunar token access; it still does not have a dual-mode palette block.

## Premium/Gating Behavior

- Dashboard card rendering does not currently check `subscriptionTier`.
- Premium gating for burnout/lunar controls is enforced in Settings and API endpoints, not in dashboard tile visibility.
- For free users, current dashboard behavior is still "show card", but hydrate it from frozen fallback snapshots instead of live notification plans.

## Push Entry Coupling

- Notification tap currently opens dashboard for `burnout_alert`.
- No in-dashboard targeting exists yet (no auto-scroll/highlight to specific card).

## Follow-Up Decisions To Record Later

1. Should free users see full insight cards, preview cards, or locked cards?
2. Should fallback state show an explicit "preview" or "stale/fallback" badge?
3. Should alert tap open dashboard root or target card context directly?

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
