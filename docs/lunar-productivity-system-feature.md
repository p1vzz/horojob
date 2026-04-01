# Lunar Productivity System - Feature Spec
**Version:** 0.1  
**Status:** In Progress  
**Owner:** Backend + Mobile

## 1. Goal
Ship a premium-only `Lunar Productivity` feature that predicts low-focus windows from moon-driven transit signals and sends proactive push notifications before productivity dips.

Primary outcomes:
1. Protect deep work by warning before lunar focus drops.
2. Reuse the proven burnout delivery pipeline (gating, quiet hours, dedupe, cooldown).
3. Keep API and settings ergonomics symmetric with `Burnout Alerts`.

## 2. Current State (March 22, 2026)
- Mobile app includes `Lunar Productivity` in premium surfaces:
  - Dashboard insight card (`LunarProductivityInsightTile`) in lunar-white theme.
  - Settings premium row with enable/disable flow and push-token checks.
  - Premium paywall feature card.
- Mobile API client contracts are wired for:
  - `PUT /api/notifications/lunar-productivity-settings`
  - `GET /api/notifications/lunar-productivity-plan`
- Dashboard lunar card now hydrates through `src/hooks/useDashboardInsights.ts`, using live `/api/notifications/lunar-productivity-plan` for premium users and frozen fallback snapshot data when the plan is unavailable or fetch fails.
- Mobile uses `src/services/dashboardInsightSnapshots.ts` as the adapter layer that converts `LunarProductivityPlanResponse` into dashboard-card snapshot shape.
- Backend route implementation is pending and should mirror burnout route patterns.

## 3. User Experience
1. Premium user enables `Lunar Productivity` in settings.
2. App validates push permission/token and saves lunar settings.
3. Backend computes current moon-adapted productivity score and next planned push time.
4. If threshold is met, backend schedules one proactive push before expected dip.
5. User receives short guidance to protect deep-focus windows.
6. Free users see the locked premium row and are redirected to paywall.

## 4. Scope (v1)
Included:
- Premium gating (`subscriptionTier === premium`).
- Deterministic moon-adapted score (`0..100`).
- Deterministic local send-time planning.
- Quiet hours, cooldown, dedupe.
- Expo push delivery (same infra as burnout).

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

### 6.3 Severity
- `< 55` -> `none` (no push)
- `55..69` -> `warn`
- `70..84` -> `high`
- `>= 85` -> `critical`

## 7. Push Fire-Time Algorithm (`lunar-productivity-timing-v1`)

### 7.1 Preconditions
Schedule push only if all are true:
1. `subscriptionTier === premium`
2. lunar productivity alerts are enabled
3. valid push token exists
4. `lunarProductivityScore >= 55`

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

Peak dip slot:
- `dipHour = argmax(hourlyDip(h))` (tie-breaker: earliest hour)
- `predictedDipLocal = dipHour + 20m`

### 7.3 Lead time by severity
- `warn` -> `30` minutes
- `high` -> `55` minutes
- `critical` -> `80` minutes

```text
candidateSendLocal = predictedDipLocal - leadMinutes(severity)
```

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

## 8. Planned API Contracts

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

## 9. Data Model (Planned)
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

### 10.1 `warn`
- Headline: `Lunar Focus Dip Ahead`
- Body: `Your moon cycle suggests lighter focus soon. Protect your next deep-work block.`

### 10.2 `high`
- Headline: `Lunar Productivity Risk: High`
- Body: `Moon pressure is climbing. Finish priority tasks now and reduce context switching.`

### 10.3 `critical`
- Headline: `Focus Shield Needed`
- Body: `A sharp lunar dip is approaching. Pause new tasks and recover before your next sprint.`

## 11. Rollout Plan
1. Implement backend `lunar-productivity-settings` + `lunar-productivity-plan` routes.
2. Add lunar score/timing calculators and scheduler jobs.
3. Verify mobile settings row + dashboard card with premium test users.
4. Validate push delivery across at least 2 timezones.
5. Release behind feature flag and monitor send success + opt-out rate.
