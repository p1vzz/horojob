# Interview Strategy - Feature Implementation Plan
**Version:** 0.5
**Status:** Active (server-authoritative)
**Owner:** Backend + Mobile

## 1. Feature Goal
Premium-only `Interview Strategy` that:
1. computes interview windows on backend,
2. stores rollout timing on backend,
3. keeps a rolling horizon with daily cron refill,
4. lets mobile sync server-generated slots into device calendar.

## 2. Confirmed Product Decisions
- No dedicated `Interview Strategy` screen.
- Full control remains in `SettingsScreen`.
- Scoring logic is server-side.
- Refill timing logic is server-side.
- Start time of calendar autofill is stored on server.
- Premium users are auto-enabled once when no saved Interview Strategy setting exists.
- Manual opt-out is respected; auto-enable does not turn the feature back on after the user disables it.
- User confirmation is calendar-specific: backend windows are automatic, device calendar sync is explicit.
- `Optional auto-regeneration reminder every 7 days` is removed by product decision.

## 3. Architecture (Current)
### 3.1 Backend authority
- Backend persists:
  - `interview_strategy_settings`
  - `interview_strategy_slots`
- Backend endpoints:
  - `PUT /api/notifications/interview-strategy-settings`
  - `GET /api/notifications/interview-strategy-plan?refresh=true|false`
- Backend scheduler:
  - `startInterviewStrategyScheduler`
  - daily cycle checks enabled premium users with confirmed autofill
  - if remaining horizon `<= 14 days`, generates `+14 days`.

### 3.2 Mobile responsibility
- Dashboard and Settings call the shared plan sync helper.
- Dashboard holds its ready gate until natal chart preload succeeds, then mounts Interview Strategy.
- If backend settings are still `source=default`, mobile prepares the natal chart, enables Interview Strategy, then fetches the rolling plan.
- If backend settings are saved with `enabled=false`, mobile hides the dashboard card and does not auto-enable.
- Mobile renders backend windows in Dashboard and `Settings`; the normal flow has no manual `Generate` button.
- Dashboard card uses qualitative timing labels only. The green accent is reserved for the best slot among the visible windows, not every high internal score.
- Mobile syncs backend slots to device calendar via `expo-calendar` only after explicit `Add to Calendar`.
- Mobile creates calendar entries as reminder-style events with `availability=free`, so Horojob windows do not block free/busy time.
- Mobile creates/uses a dedicated local `Horojob` calendar on Android when possible. Google Calendar may still require the user to enable that local calendar in its own UI; account-backed calendar creation was avoided because Google Calendar can show the calendar shell without reliably displaying inserted events.
- Settings shows a small calendar visibility hint near `Target calendar`: Apple Calendar normally shows Horojob reminders immediately, while Google Calendar may require turning on the local `Horojob` calendar manually.
- Mobile keeps local `slotId -> calendarEventId` map for idempotent calendar operations and device-local synced state.
- Mobile can remove Horojob-created calendar events from all writable device calendars by local map, recognized event title, and legacy note marker scan.

## 4. Server Scoring (`interview-strategy-v1`)
The server now requires the active birth profile and natal chart before planning.

Internal score `0..100` blends:
- transit-to-natal communication aspects
- natal communication bias
- career-house emphasis
- daily career momentum
- neutral AI-synergy prior
- small weekday/time quality weights

Rules:
- Generate one candidate range per eligible day.
- Range duration is backend-selected from 1 to 3 hours.
- Select up to 4-5 strongest windows per 30-day horizon, with spacing to avoid calendar spam.
- Do not backfill weak days below `INTERVIEW_STRATEGY_MIN_SCORE` (`68` by default).
- First-release safety heuristic: if the normal threshold produces zero selected windows, backend may temporarily use a safety floor for that generation only until one window clears `INTERVIEW_STRATEGY_ZERO_RESULT_SAFETY_MIN_SCORE` (`62`). The safety floor is not persisted per user and the next rolling month starts from the normal threshold again.
- Legacy weekday/duration/workday request fields remain accepted for rollout compatibility, but mobile no longer exposes manual range settings.
- Each slot includes `explanation`, `explanationSource`, and short `calendarNote`; user-facing copy avoids percentages and numeric ratings.
- The deterministic explanation is part of the slot-scoring algorithm. Optional provider polish can replace it, but only then is `explanationSource=llm`.

## 5. Autofill Lifecycle
1. Premium user opens Dashboard or Settings.
2. If settings are default, mobile enables Interview Strategy automatically.
3. Backend stores `autoFillConfirmedAt` and `autoFillStartAt`.
4. Mobile calls the plan endpoint; backend bootstraps the initial horizon there (default 30 days).
5. Daily scheduler checks horizon tail (`filledUntilDateKey`).
6. If tail is near (<=14 days), backend appends next 14 days.
7. Mobile can always fetch latest plan and sync to local calendar.
8. Toggle off saves `enabled=false`, hides dashboard/settings details, and removes Horojob-created calendar events from this device.

## 6. Data and Contracts
### 6.1 Settings payload
- `enabled`
- `timezoneIana`
- legacy optional fields still accepted by backend: `slotDurationMinutes`, `allowedWeekdays`, `workdayStartMinute`, `workdayEndMinute`, `quietHoursStartMinute`, `quietHoursEndMinute`, `slotsPerWeek`

### 6.2 Returned settings metadata
- `autoFillConfirmedAt`
- `autoFillStartAt`
- `filledUntilDateKey`
- `lastGeneratedAt`

### 6.3 Calendar state
- Calendar sync state is device-local for the first release.
- New events created by Horojob are marked as free time and keep notes user-facing only.
- Remove scans all writable calendars for recognized Horojob interview reminders and legacy markers, and also uses the local `slotId -> calendarEventId` map.
- Backend slots remain available after toggle off until normal rolling-window cleanup removes expired rows.

## 7. Scheduler Config (Backend env)
- `INTERVIEW_STRATEGY_AUTOFILL_ENABLED`
- `INTERVIEW_STRATEGY_CHECK_INTERVAL_SECONDS`
- `INTERVIEW_STRATEGY_INITIAL_HORIZON_DAYS`
- `INTERVIEW_STRATEGY_REFILL_THRESHOLD_DAYS`
- `INTERVIEW_STRATEGY_REFILL_DAYS`
- `INTERVIEW_STRATEGY_MIN_SCORE`

## 8. Implementation Backlog
### P0 (MVP launch)
- [x] Settings integration and premium gate.
- [x] Server-side scoring and plan generation endpoint.
- [x] Server-side settings persistence and autofill start timestamp.
- [x] Calendar sync on mobile with idempotent event mapping.
- [x] Basic analytics events.

### P1 (Stability)
- [x] Smoke checklist for denied/granted/conflict-heavy calendars.
- [x] Recovery for stale calendar mapping links.
- [x] Empty-state UX when no slots pass threshold.
- [x] Daily backend refill scheduler (2-week threshold -> +2 weeks).
- [x] Device-local calendar removal for Horojob-created interview events.

### P2 (Post-MVP)
- [ ] Deeper backend personalization from historical slot outcomes.
- [ ] Interview type presets (`HR`, `Technical`, `Manager`).

## 9. QA Artifacts
- `docs/interview-strategy-smoke-checklist.md`
