# Release Smoke Master Checklist
**Version:** 0.1  
**Status:** Active  
**Owner:** Mobile QA + Backend QA

## Purpose

Unified pre-release smoke checklist for the highest-risk user flows across onboarding, session bootstrap, scanner, billing, theme, strategy, and widgets.

## Preconditions

- Backend API (`../horojob-server`) is running and reachable from mobile app.
- Release/prod build uses `EXPO_PUBLIC_APP_ENV=production`; preview QA builds use `EXPO_PUBLIC_APP_ENV=staging`.
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

### 3. App theme and dashboard rendering
- [ ] Startup loader and onboarding open on dark backgrounds without a light flash.
- [ ] Settings does not expose the deferred app theme toggle in v1.
- [ ] Core dashboard tiles render in the default dark app theme without contrast regressions.
- [ ] `Career Vibe` opens the full plan screen and returns to dashboard.
- [ ] `Career Vibe Plan` manual refresh updates or preserves the last successful plan with an inline error.
- [ ] Career Vibe shows a saved plan, not sample copy, when network/API is temporarily unavailable after one successful sync.
- [ ] Logout or missing profile does not keep showing a previous user's saved Career Vibe plan.
- [ ] Burnout and lunar dashboard cards hydrate live for premium user, or gracefully fall back without crash when plan fetch fails/unavailable.
- [ ] Returning from `Settings` refreshes burnout/lunar dashboard card content on `Dashboard`.
- [ ] `Career Matchmaker` opens Discover Roles, `Best Fit` and `Best Opportunity` switch without crash, and market-backed recommendations show attribution footer with CareerOneStop logo when CareerOneStop data is present.
- [ ] Discover Roles shortlist can stage two saved roles into the inline compare module, compare rows render on one screen, and opening either compared role returns to the same detail stack without crash.

### 4. Scanner and job analysis
- [ ] URL preflight + analyze success path works from `Scanner`.
- [ ] Free user's first daily scan returns `Full scan`; next scan returns `Lite scan` with market snapshot/locked Full panels when Full quota is exhausted.
- [ ] Market-backed scanner result shows attribution footer with CareerOneStop logo and without provider endorsement copy.
- [ ] Scanner `History` opens saved scans and tapping an item restores the full saved result.
- [ ] Scanner history rows show the saved `Lite`/`Full` badge.
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

### 6a. Market-backed career surfaces
- [ ] Natal Chart market paths show salary ranges/gradients and attribution footer with CareerOneStop logo when CareerOneStop data is present.
- [ ] Dashboard `Negotiation Prep` card shows free market guidance and opens `NegotiationPrep`.
- [ ] `NegotiationPrep` page shows anchor strategy, recruiter questions, baseline scripts, offer checklist, red flags, tradeoff levers, next steps, and attribution footer with CareerOneStop logo when CareerOneStop data is present.
- [ ] `NegotiationPrep` page `Check a Posting` action opens `Scanner`.
- [ ] Full Career Blueprint market gradients show salary ranges/gradients and attribution footer with CareerOneStop logo when CareerOneStop data is present.
- [ ] Market attribution/footer appears only on market-backed blocks, not on Horojob fit or astrology interpretation cards.

### 7. Android widget flow
- [ ] Variant picker shows available widget variants.
- [ ] Pin flow works from app and widget renders payload.
- [ ] Widget updates after manual refresh.
- [ ] Tapping the widget opens the full Career Vibe plan screen.
- [ ] Light/Dark system themes keep text readable.

### 8. Notification/deep-link behavior
- [ ] Push response with `burnout_alert` type routes to `Dashboard`, waits for readiness, then scrolls/highlights the burnout card.
- [ ] Push response with `lunar_productivity_alert` type routes to `Dashboard`, waits for readiness, then scrolls/highlights the lunar card when visible.
- [ ] Foreground notification banners appear for alert pushes on device.
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
