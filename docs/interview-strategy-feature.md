# Interview Strategy - Feature Implementation Plan
**Version:** 0.3  
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
- User confirmation is one-time: after enable/confirm, backend keeps refilling automatically.
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
- Mobile provides settings input and one-time confirmation intent.
- Mobile fetches plan from backend and renders it in `Settings`.
- Mobile syncs backend slots to device calendar via `expo-calendar`.
- After one-time permission grant, mobile performs silent auto-sync on plan refresh/open (no repeated user confirmation).
- Mobile keeps local `slotId -> calendarEventId` map for idempotent calendar operations.

## 4. Server Scoring (`interview-strategy-v1`)
Score `0..100` for each slot:

```text
score =
  0.40 * dailyCareerScore
  + 0.25 * aiSynergyScore
  + 0.20 * weekdayWeight
  + 0.15 * hourWeight
```

Rules:
- Deterministic date/user jitter around transit baseline.
- Filter by user settings (weekdays, work window, quiet hours).
- Drop slots below threshold (`INTERVIEW_STRATEGY_MIN_SCORE`, default `55`).
- Keep top `N` per week (`slotsPerWeek`).

## 5. Autofill Lifecycle
1. Premium user enables Interview Strategy in Settings.
2. Backend stores `autoFillConfirmedAt` and `autoFillStartAt`.
3. Backend bootstraps initial horizon (default 30 days).
4. Daily scheduler checks horizon tail (`filledUntilDateKey`).
5. If tail is near (<=14 days), backend appends next 14 days.
6. Mobile can always fetch latest plan and sync to local calendar.

## 6. Data and Contracts
### 6.1 Settings payload
- `enabled`
- `timezoneIana`
- `slotDurationMinutes` (`30|45|60`)
- `allowedWeekdays` (`0..6`)
- `workdayStartMinute`
- `workdayEndMinute`
- `quietHoursStartMinute`
- `quietHoursEndMinute`
- `slotsPerWeek`

### 6.2 Returned settings metadata
- `autoFillConfirmedAt`
- `autoFillStartAt`
- `filledUntilDateKey`
- `lastGeneratedAt`

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

### P2 (Post-MVP)
- [ ] Deeper backend personalization from historical slot outcomes.
- [ ] Interview type presets (`HR`, `Technical`, `Manager`).

## 9. QA Artifacts
- `docs/interview-strategy-smoke-checklist.md`
