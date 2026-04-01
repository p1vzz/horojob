# Release Smoke Master Checklist
**Version:** 0.1  
**Status:** Active  
**Owner:** Mobile QA + Backend QA

## Purpose

Unified pre-release smoke checklist for the highest-risk user flows across onboarding, session bootstrap, scanner, billing, theme, strategy, and widgets.

## Preconditions

- Backend API (`../horojob-server`) is running and reachable from mobile app.
- Test accounts are available:
  - one `free` user
  - one `premium` user
- Physical Android device is available (required for widget checks).
- iOS device/simulator is optional for app-level checks (native iOS widget extension is still pending).
- App is launched from dev client or release build (not Expo Go).

## Critical Path Checks

### 1. Startup and session bootstrap
- [ ] App launches without red screen/crash.
- [ ] Session bootstrap completes (`Preparing Session` loader exits).
- [ ] Existing onboarded user is routed to dashboard flow.
- [ ] Missing profile user is routed to onboarding flow.

### 2. Onboarding and profile save
- [ ] City search suggestions appear for valid city input.
- [ ] `Unknown birth time` path works and still allows completion.
- [ ] Submit persists profile and routes to dashboard.
- [ ] App restart keeps onboarded state for same user.

### 3. Theme and dashboard rendering
- [ ] Light theme toggle works in Settings.
- [ ] Theme persists after app restart.
- [ ] Core dashboard tiles render in both light and dark modes without contrast regressions.
- [ ] Burnout and lunar dashboard cards hydrate live for premium user, or gracefully fall back without crash when plan fetch fails/unavailable.
- [ ] Returning from `Settings` refreshes burnout/lunar dashboard card content on `Dashboard`.

### 4. Scanner and job analysis
- [ ] URL preflight + analyze success path works from `Scanner`.
- [ ] Screenshot analyze flow works from `JobScreenshotUpload`.
- [ ] Known error states are mapped (blocked/login wall/not found/limit) without crash.

### 5. Billing and premium gating
- [ ] Paywall offerings load in `PremiumPurchase`.
- [ ] Purchase/restore sandbox flow syncs subscription with backend.
- [ ] Premium-only surface unlocks after successful sync.
- [ ] Free user remains gated.

### 6. Interview strategy and calendar sync
- [ ] Premium user can generate strategy plan from Settings.
- [ ] `Add to Calendar` works with permission granted.
- [ ] Permission denied path shows graceful UX and no crash.

### 7. Android widget flow
- [ ] Variant picker shows available widget variants.
- [ ] Pin flow works from app and widget renders payload.
- [ ] Widget updates after manual refresh.
- [ ] Light/Dark system themes keep text readable.

### 8. Notification/deep-link behavior
- [ ] Push response with `burnout_alert` type routes to `Dashboard`.
- [ ] No duplicate or looping navigation from stale responses.

### 9. Logout/offline resilience
- [ ] Logout clears user-bound data and premium state.
- [ ] Brief offline run does not crash app.
- [ ] Stale cached data is handled gracefully until reconnect.

## Linked Detailed Checklists

- `docs/dashboard-insight-cards-smoke-checklist.md`
- `docs/job-position-check-smoke-checklist.md`
- `docs/interview-strategy-smoke-checklist.md`
- `docs/premium-widget-smoke-checklist.md`
- `docs/device-android-session-playbook.md`

## Pass/Fail Reporting Format

Use this structure for release sign-off:

- `PASS`: fully verified and stable.
- `FAIL`: reproducible blocker with path + expected/actual.
- `NOT TESTED`: explicitly mark skipped area.

Minimum output:
- build identifier
- tested devices/platforms
- checklist summary (`PASS/FAIL/NOT TESTED` per section)
- blocker list
- final ship signal (`GO` or `NO-GO`)
