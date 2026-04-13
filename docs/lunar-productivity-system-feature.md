# Lunar Productivity System - Feature Spec
**Version:** 0.1  
**Status:** In Progress  
**Owner:** Backend + Mobile

## 1. Goal
Ship a premium-only `Lunar Productivity` feature that spots disruptive and supportive work windows from moon-driven transit signals and turns them into action-ready guidance.

Primary outcomes:
1. Protect deep work on disruptive lunar days before focus starts to break.
2. Help users use unusually strong focus windows on supportive lunar days.
3. Reuse the proven burnout delivery pipeline (gating, quiet hours, dedupe, cooldown).
4. Keep API and settings ergonomics symmetric with `Burnout Alerts`.

## 2. Current State (April 13, 2026)
- Mobile app includes `Lunar Productivity` in premium surfaces:
  - Dashboard insight card (`LunarProductivityInsightTile`) in lunar-white theme.
  - Settings premium row with enable/disable flow and push-token checks.
  - Premium paywall feature card.
- Mobile API client contracts are wired for:
  - `PUT /api/notifications/lunar-productivity-settings`
  - `GET /api/notifications/lunar-productivity-plan`
  - `POST /api/notifications/lunar-productivity-seen`
- Dashboard lunar card now hydrates through `src/hooks/useDashboardInsights.ts`, using live `/api/notifications/lunar-productivity-plan` for premium users. Regular dashboard opens keep the card hidden when the plan is unavailable; lunar push-entry can show a degraded unavailable state if live hydration fails.
- Mobile uses `src/services/dashboardInsightSnapshots.ts` as the adapter layer that converts `LunarProductivityPlanResponse` into dashboard-card snapshot shape.
- Backend now ships:
  - lunar risk calculation (`lunar-productivity-risk-v1`)
  - lunar planner/dispatcher scheduler (`lunar-productivity-timing-v1`)
  - Mongo-backed `lunar_productivity_jobs` persistence with current-day timing lookup
  - Expo push delivery using direction-aware action copy for supportive and disruptive windows
  - in-app acknowledge route that cancels same-day unsent lunar pushes once the dashboard card has already been surfaced
  - scheduler startup guard that disables lunar planning/dispatch when the server has no global Expo push access token

## 3. User Experience
1. Premium user enables `Lunar Productivity` in settings.
2. App validates push permission/token and saves lunar settings.
3. Backend computes current moon-adapted productivity score and next planned push time.
4. If threshold is met, backend schedules one proactive push before the selected disruptive or supportive work window.
5. User receives short guidance to either protect deep-focus work or use the next strong focus block.
6. Free users see the locked premium row and are redirected to paywall.

## 4. Scope (v1)
Included:
- Premium gating (`subscriptionTier === premium`).
- Deterministic moon-adapted score (`0..100`).
- Deterministic local send-time planning.
- Quiet hours, cooldown, dedupe.
- Expo push delivery (same infra as burnout).
- Direction-aware dashboard card display (`Supportive Window` / `Disruptive Window`) only when the current-day score is inside the shipped display range.
- In-app suppression of same-day unsent lunar pushes after the dashboard card has already been shown.

Not included:
- Multi-alert per day strategy.
- Personalized behavioral learning model.
- Historical analytics dashboard for lunar cycles.

## 5. Data Inputs
Existing sources:
1. `daily_transits` (`../horojob-server/src/services/dailyTransit.ts`)
2. `birth_profiles` (timezone + location context)
3. `users.subscriptionTier` for premium gate

User settings (same shape as burnout):
- `enabled: boolean`
- `timezoneIana: string`
- `workdayStartMinute: number` (default `540`)
- `workdayEndMinute: number` (default `1230`)
- `quietHoursStartMinute: number` (default `1290`)
- `quietHoursEndMinute: number` (default `480`)

## 6. Lunar Productivity Risk Algorithm (`lunar-productivity-risk-v1`)

### 6.1 Signal extraction
Hard aspects set:
- `square`, `opposition`, `quincunx`

Orb weight:
```text
orbWeight(type, orb) =
  clamp(1 - min(abs(orb), maxOrb(type)) / maxOrb(type), 0.20, 1.00)
```

Where:
- `maxOrb(square|opposition)=8`
- `maxOrb(quincunx)=6`

Weighted counts:
```text
moonHardCount      = sum(orbWeight(a.type, a.orb)) for hard aspects involving Moon
moonSaturnHard     = max(orbWeight(...)) for Moon<->Saturn hard aspect, else 0
moonMercuryHard    = max(orbWeight(...)) for Moon<->Mercury hard aspect, else 0
```

Phase map (`phaseLoadBase`):
- `new_moon` -> `14`
- `waxing_crescent` -> `10`
- `first_quarter` -> `12`
- `waxing_gibbous` -> `9`
- `full_moon` -> `16`
- `waning_gibbous` -> `8`
- `last_quarter` -> `11`
- `waning_crescent` -> `7`

### 6.2 Score formula
Inputs:
- `energy`, `focus`, `luck`
- `signals.positiveAspectStrength`
- `signals.momentum.energy/focus`
- `moonPhase`, `illuminationPercent`
- risk tags `context_switch`, `rush_bias` (`0..100`)

```text
phaseLoad =
  phaseLoadBase(moonPhase)
  + 0.18 * abs(illuminationPercent - 50)

emotionalTide =
  4.8 * moonHardCount
  + 8.0 * moonSaturnHard
  + 5.5 * moonMercuryHard
  + 0.75 * abs(momentum.energy - momentum.focus)

focusResonanceDrag =
  0.62 * max(0, energy - focus)
  + 0.36 * max(0, 60 - luck)
  + 0.90 * max(0, -momentum.focus)

circadianAlignmentPenalty =
  0.19 * riskTagContextSwitch
  + 0.17 * riskTagRushBias

recoveryBuffer =
  0.33 * positiveAspectStrength
  + 0.24 * focus
  + 0.17 * luck

rawRisk =
  11 + phaseLoad + emotionalTide + focusResonanceDrag + circadianAlignmentPenalty - recoveryBuffer

lunarProductivityScore = clamp(round(rawRisk), 0, 100)
```

### 6.3 Risk Severity
- `< 55` -> `none` (no push)
- `55..69` -> `warn`
- `70..84` -> `high`
- `>= 85` -> `critical`

Risk severity remains risk-oriented and still describes negative lunar load. Push eligibility is broader and may also trigger on strongly supportive low-risk days.

## 7. Push Fire-Time Algorithm (`lunar-productivity-timing-v1`)

### 7.1 Preconditions
Schedule push only if all are true:
1. `subscriptionTier === premium`
2. lunar productivity alerts are enabled
3. valid push token exists
4. `lunarProductivityScore <= 25` or `lunarProductivityScore >= 80`

Impact direction:
- `<= 25` -> `supportive`
- `26..79` -> no lunar push
- `>= 80` -> `disruptive`

### 7.2 Intraday lunar scan
Sample local hours:
- `[07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00]`

Hourly dip score:
```text
hourlyDip(h) =
  clamp(
    lunarProductivityScore * 0.54
    + hourMoonHard(h) * 8
    + hourMoonSaturnHard(h) * 10
    + hourMoonMercuryHard(h) * 7
    + hourPhaseLoad(h) * 2
    - hourPositiveStrength(h) * 4,
    0, 100
  )
```

Window selection:
- `disruptive`: `dipHour = argmax(hourlyDip(h))` (tie-breaker: earliest hour)
- `supportive`: `focusHour = argmin(hourlyDip(h))` (tie-breaker: earliest hour)
- predicted local event time is `selectedHour + 20m`

### 7.3 Lead time by severity
- `warn` -> `30` minutes
- `high` -> `55` minutes
- `critical` -> `80` minutes

```text
candidateSendLocal = predictedEventLocal - leadMinutes(severity)
```

Implementation note:
- `disruptive` windows use the risk severity bands above.
- `supportive` windows currently schedule as a gentle `warn` push.

### 7.4 Quiet hours + workday constraints
Apply in order:
1. If inside quiet hours -> move to `quietHoursEnd + 15m`.
2. Clamp into `[workdayStart, workdayEnd]`.
3. Never send later than `predictedDipLocal - 10m`.
4. If result `< now + 5m`, set to `now + 5m` only if rule #3 still holds; otherwise skip.

### 7.5 Dedupe + cooldown
- Max `1` lunar productivity push per local date.
- Minimum `20h` between sends for same user.
- No duplicate for same `{dateKey, severity}`.

## 8. API Contracts

### 8.1 `PUT /api/notifications/push-token`
- Shared with burnout/interview flows.

### 8.2 `PUT /api/notifications/lunar-productivity-settings`
- Auth required.
- Premium required (`403 premium_required` for free users).
- Body:
```json
{
  "enabled": true,
  "timezoneIana": "America/New_York",
  "workdayStartMinute": 540,
  "workdayEndMinute": 1230,
  "quietHoursStartMinute": 1290,
  "quietHoursEndMinute": 480
}
```

### 8.3 `GET /api/notifications/lunar-productivity-plan`
- Auth + premium required.
- Returns:
  - `settings`
  - `risk` (`algorithmVersion`, `score`, `severity`, lunar components/signals)
  - `timing` (`algorithmVersion`, `nextPlannedAt`, status metadata)

## 9. Data Model
1. `lunar_productivity_settings`
- `userId`, settings fields, `updatedAt`
- unique index `{ userId: 1 }`

2. `lunar_productivity_jobs`
- `userId`, `dateKey`, `severity`, `score`, `predictedDipAt`, `scheduledAt`, `status`, `providerMessageId`, `lastError`
- unique index `{ userId: 1, dateKey: 1 }`
- index `{ status: 1, scheduledAt: 1 }`

3. `lunar_productivity_events`
- send and delivery events for QA/tuning

## 10. Approved Push Copy (v1)

### 10.1 Supportive `warn`
- Headline: `Start Your Priority Task Soon`
- Body: `A supportive focus window is opening. Use the next block for hard work before meetings or admin.`

### 10.2 Supportive `high`
- Headline: `Protect Your Best Work Block`
- Body: `Focus conditions are unusually supportive soon. Put your hardest task first and keep interruptions out.`

### 10.3 Supportive `critical`
- Headline: `Use Your Strongest Focus Window`
- Body: `Today's clearest work block is approaching. Start the task that needs your best thinking and guard it.`

### 10.4 Disruptive `warn`
- Headline: `Protect Your Next Focus Block`
- Body: `A weaker focus stretch is coming. Finish one priority task now and push admin or chat later.`

### 10.5 Disruptive `high`
- Headline: `Finish Priority Work Early`
- Body: `Focus conditions are getting noisier. Close the main task now and avoid extra context switching.`

### 10.6 Disruptive `critical`
- Headline: `Shield Deep Work Now`
- Body: `A disruptive focus stretch is close. Stop adding new tasks, wrap the priority item, and leave recovery space.`

## 11. Rollout Plan
1. Verify mobile settings row + dashboard card with premium test users.
2. Validate push delivery across at least 2 timezones.
3. Decide whether dashboard/settings should expose next planned send time more explicitly.
4. Monitor send success, disabled-token churn, and opt-out rate after release.
