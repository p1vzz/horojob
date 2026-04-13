# Dashboard Insight Cards Smoke Checklist
**Version:** 0.1  
**Status:** Active  
**Owner:** Mobile QA

## Purpose

Verify the highest-risk dashboard behavior for burnout and lunar insight cards after live hydration, the full-screen dashboard readiness gate, and in-app push suppression were added.

## Preconditions

- Backend API (`../horojob-server`) is running and reachable.
- Test accounts are available:
  - one `free` user
  - one `premium` user
- Premium user can access `Settings` and save burnout/lunar alert preferences.
- App is launched from dev client or release build (not Expo Go).

## Expected Runtime Model

- `Dashboard` fetches live data only for `premium` users.
- `free` users do not see dashboard alert cards because live threshold state is not available.
- `Dashboard` stays behind a full-screen loader until all current async sections needed for the screen are ready.
- Fallback is per-card:
  - if burnout plan fails, lunar card may still render live
  - if lunar plan fails, burnout card may still render live
- Sync semantics:
  - a premium card being refreshed may show `SYNCING`
  - cards may show `Updated ...` after a successful live sync
  - push-entry fallback cards show unavailable copy and may show `Try Again`
- Returning to `Dashboard` should refresh cards on screen focus.
- Tapping a burnout/lunar push should open `Dashboard`, wait for readiness, then scroll to and briefly highlight the matching card.
- Burnout card renders only when current-day burnout severity is `warn`, `high`, or `critical`, or as a degraded unavailable card if a burnout push opened the dashboard and live hydration fails.
- Lunar card renders when the current-day score is inside the supportive/disruptive display range, or as a degraded unavailable card if a lunar push opened the dashboard and live hydration fails before the range can be known.
- Burnout card renders before lunar when both are visible and uses action-oriented guidance copy.
- Burnout card should not show QA-only source badges, algorithm-version pills, derived-model footnotes, or the old background glow sphere.
- If burnout card renders while a same-day burnout push is still pending and the current risk is in threshold, the pending push should be cancelled for that `dateKey`.
- If lunar card renders before a same-day lunar push is sent, the pending push should be cancelled for that `dateKey`.

## Smoke Steps

### 1. Free User Baseline

- Sign in as `free` user and open `Dashboard`.
- Verify the dashboard loader appears first and clears only after the screen is fully ready.
- Verify `BurnoutInsightTile` and `LunarProductivityInsightTile` do not render because threshold state is unavailable for free users.
- Verify no crash, blank gap, or infinite loading state.

### 2. Premium Live Hydration

- Sign in as `premium` user.
- Open `Settings` and ensure burnout + lunar settings are enabled/saved.
- Navigate back to `Dashboard`.
- Verify the dashboard stays gated until all current async sections are ready, then reveals a stable fully built screen.
- Verify burnout card renders first only when current-day burnout severity is `warn`, `high`, or `critical`.
- Verify lunar card renders only when current-day lunar score is inside the supportive/disruptive range.
- Expected:
  - visible cards may differ from previous-day or fixture values
  - score/direction/date label reflect current backend plan mapping
  - lunar copy reads like guidance for the current workday, not raw model diagnostics
  - each card may briefly show `SYNCING` independently during fetch

### 2a. Push Entry Targeting

- Send or simulate a push response with `type=burnout_alert` while burnout is in threshold.
- Expected:
  - app opens `Dashboard`
  - dashboard loader remains until the screen is fully ready
  - screen scrolls to the burnout card and shows a brief focus ring
  - dev logs include `dashboard_alert_opened_from_push` and `dashboard_alert_push_target_focused` with `alertFocus=burnout`
- Send or simulate a push response with `type=lunar_productivity_alert` while the lunar card is visible.
- Expected:
  - app opens `Dashboard`
  - screen scrolls to the lunar card and shows a brief focus ring
  - dev logs include `dashboard_alert_opened_from_push` and `dashboard_alert_push_target_focused` with `alertFocus=lunar`
  - if targeted live hydration fails, the app can show the degraded unavailable card with `Try Again`

### 3. Per-Card Fallback Isolation

- Use a premium scenario where one plan is unavailable while the other still succeeds.
- Acceptable ways to simulate:
  - backend temporarily returns `404`/`403` for one plan
  - one feature is unavailable for the current premium profile while the other remains configured
- Expected:
  - regular dashboard opens keep the affected alert card hidden if threshold cannot be confirmed
  - push-entry opens may show affected unavailable copy instead of frozen score/severity/metrics
  - push-entry fallback exposes `Try Again`
  - if push-entry hydration succeeds below threshold, dev logs include `dashboard_alert_push_target_hidden`
  - unaffected card still renders live snapshot
  - unaffected card should not be forced back into `SYNCING` when retrying the failed card manually
  - dashboard does not crash or blank the whole insight section

### 4. Settings-to-Dashboard Refresh

- From premium `Dashboard`, open `Settings`.
- Change burnout or lunar settings and save.
- Navigate back to `Dashboard`.
- Verify screen-focus refresh happens automatically.
- Expected:
  - updated live snapshot is shown when backend responds successfully
  - alert card stays hidden if backend plan remains unavailable on a regular dashboard open
  - last successful card sync is reflected in `Updated ...` label

### 5. Lunar Push Suppression

- Use a premium account with lunar alerts enabled and a current-day lunar score inside the shipped display range.
- Make sure the server has a same-day lunar job in `planned` state.
- Open `Dashboard` before the push send time.
- Expected:
  - lunar card becomes visible after the dashboard is ready
  - same-day pending lunar push is acknowledged in-app and is no longer sent later
  - opening `Dashboard` again on the same `dateKey` does not re-arm the push

### 6. Burnout Push Suppression

- Use a premium account with burnout alerts enabled and a current-day burnout score at or above the shipped alert threshold.
- Make sure the server has a same-day burnout job in `planned` state.
- Open `Dashboard` before the push send time.
- Expected:
  - burnout card is visible after the dashboard is ready only for in-threshold risk
  - same-day pending burnout push is acknowledged in-app and is no longer sent later
  - opening `Dashboard` again on the same `dateKey` does not re-arm the push

### 7. Theme and Contrast

- Validate dashboard contrast in the default dark app theme.
- Verify both cards remain readable in:
  - live snapshot state
  - degraded unavailable state
- Verify percentage, direction label, headline, reasons, and metric bars remain legible.

## Reporting Format

Use:

- `PASS`
- `FAIL`
- `NOT TESTED`

Minimum summary rows:

- `Free baseline`
- `Premium live hydration`
- `Push entry targeting`
- `Per-card fallback isolation`
- `Settings-to-dashboard refresh`
- `Lunar push suppression`
- `Burnout push suppression`
- `Theme and contrast`
