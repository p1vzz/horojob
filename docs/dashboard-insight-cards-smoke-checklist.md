# Dashboard Insight Cards Smoke Checklist
**Version:** 0.1  
**Status:** Active  
**Owner:** Mobile QA

## Purpose

Verify the highest-risk dashboard behavior for burnout and lunar insight cards after live hydration was added with per-card frozen fallback.

## Preconditions

- Backend API (`../horojob-server`) is running and reachable.
- Test accounts are available:
  - one `free` user
  - one `premium` user
- Premium user can access `Settings` and save burnout/lunar alert preferences.
- App is launched from dev client or release build (not Expo Go).

## Expected Runtime Model

- `Dashboard` fetches live data only for `premium` users.
- `free` users always see frozen fallback snapshots.
- Fallback is per-card:
  - if burnout plan fails, lunar card may still render live
  - if lunar plan fails, burnout card may still render live
- Badge semantics:
  - `PREVIEW` -> free-plan frozen snapshot
  - `FALLBACK` -> premium fallback snapshot after failed/unavailable plan fetch
  - `LIVE` -> successful premium plan hydration
- Sync semantics:
  - a premium card being refreshed may show `SYNCING`
  - cards may show `Updated ...` after a successful live sync
  - fallback cards may show `RETRY LIVE`
- Returning to `Dashboard` should refresh cards on screen focus.

## Smoke Steps

### 1. Free User Fallback Baseline

- Sign in as `free` user and open `Dashboard`.
- Verify `BurnoutInsightTile` and `LunarProductivityInsightTile` both render.
- Verify no crash, blank gap, or infinite loading state.
- Expected fallback baselines:
  - Burnout card shows `85`, `Critical`, `System Strain Detected`
  - Lunar card shows `78`, `High`, `Lunar Focus Window Shifting`
  - both cards show `PREVIEW`

### 2. Premium Live Hydration

- Sign in as `premium` user.
- Open `Settings` and ensure burnout + lunar settings are enabled/saved.
- Navigate back to `Dashboard`.
- Verify both cards still render immediately and refresh without manual reload.
- Expected:
  - cards may differ from frozen fallback values
  - score/severity/date label reflect current backend plan mapping
  - algorithm version row remains visible
  - each card may briefly show `SYNCING` independently during fetch
  - cards show `LIVE` when plan fetch succeeds

### 3. Per-Card Fallback Isolation

- Use a premium scenario where one plan is unavailable while the other still succeeds.
- Acceptable ways to simulate:
  - backend temporarily returns `404`/`403` for one plan
  - one feature is unavailable for the current premium profile while the other remains configured
- Expected:
  - affected card falls back to frozen snapshot and shows `FALLBACK`
  - affected card exposes `RETRY LIVE`
  - unaffected card still renders live snapshot and shows `LIVE`
  - unaffected card should not be forced back into `SYNCING` when retrying the failed card manually
  - dashboard does not crash or blank the whole insight section

### 4. Settings-to-Dashboard Refresh

- From premium `Dashboard`, open `Settings`.
- Change burnout or lunar settings and save.
- Navigate back to `Dashboard`.
- Verify screen-focus refresh happens automatically.
- Expected:
  - updated live snapshot is shown when backend responds successfully
  - fallback snapshot is shown if backend plan remains unavailable
  - last successful card sync is reflected in `Updated ...` label

### 5. Theme and Contrast

- Repeat dashboard check once in dark mode and once in light mode.
- Verify both cards remain readable in:
  - live snapshot state
  - frozen fallback state
- Verify percentage, severity label, headline, reasons, and metric bars remain legible.

## Reporting Format

Use:

- `PASS`
- `FAIL`
- `NOT TESTED`

Minimum summary rows:

- `Free fallback baseline`
- `Premium live hydration`
- `Per-card fallback isolation`
- `Settings-to-dashboard refresh`
- `Theme and contrast`
