# Burnout Alert System - Feature Spec
**Version:** 0.2  
**Status:** In Progress  
**Owner:** Backend + Mobile

## 1. Goal
Ship a premium-only `Burnout Alert System` that sends proactive push notifications before predicted high-stress windows, using Saturn/Moon transit pressure plus existing daily transit signals.

Primary outcomes:
1. Warn before stress peak, not after it starts.
2. Keep alerts useful and non-spammy (cooldowns + quiet hours).
3. Keep gating aligned with existing `subscriptionTier` (`free|premium`).

## 2. Current State (March 21, 2026)
- `Burnout Alerts` is wired in settings UI with backend calls:
  - `PUT /api/notifications/push-token`
  - `PUT /api/notifications/burnout-settings`
  - `GET /api/notifications/burnout-plan`
- Dashboard burnout card now hydrates through `src/hooks/useDashboardInsights.ts`, using live `/api/notifications/burnout-plan` for premium users and frozen fallback snapshot data when the plan is unavailable or fetch fails.
- Mobile uses `src/services/dashboardInsightSnapshots.ts` as the adapter layer that converts `BurnoutPlanResponse` into dashboard-card snapshot shape.
- Backend scheduler is running for burnout planning + Expo dispatch.
- Existing backend already computes daily transit and morning briefing:
  - `GET /api/astrology/daily-transit`
  - `GET /api/astrology/morning-briefing` (premium-only)
- Current timing implementation uses `delay + quiet/workday/cooldown` and pushes one alert per local day.
- The intraday hourly re-scan model in section 7.2 is a target behavior, not yet implemented.

## 3. User Experience
1. Premium user enables `Burnout Alerts` in settings.
2. App registers push token and alert preferences on backend.
3. Backend scheduler predicts daily burnout risk + intraday stress peak.
4. If risk threshold is met, backend schedules one warning push before peak.
5. User receives context-specific warning with short action suggestion.
6. Free users can see locked row but cannot enable delivery.

## 4. Scope (v1)
Included:
- Premium gating.
- Deterministic burnout score (`0..100`).
- Deterministic push fire-time calculation in user local timezone.
- Quiet hours, cooldown, dedupe.
- Expo push delivery (with FCM/APNs credentials configured in project).

Not included:
- Multi-alert day strategy.
- ML personalization.
- In-app burnout analytics dashboard.

## 5. Data Inputs
Existing sources:
1. `daily_transits` (`../horojob-server/src/services/dailyTransit.ts`)
2. `birth_profiles` (location/profile hash)
3. `users.subscriptionTier` for premium gate

New user settings (planned):
- `enabled: boolean`
- `timezoneIana: string` (example `America/New_York`)
- `workdayStartMinute: number` (default `540` = 09:00)
- `workdayEndMinute: number` (default `1230` = 20:30)
- `quietHoursStartMinute: number` (default `1290` = 21:30)
- `quietHoursEndMinute: number` (default `480` = 08:00)

## 6. Burnout Risk Algorithm (`burnout-risk-v1`)

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

Weighted hard aspect counts:
```text
saturnHardCount = sum(orbWeight(a.type, a.orb)) for hard aspects involving Saturn
moonHardCount   = sum(orbWeight(a.type, a.orb)) for hard aspects involving Moon
saturnMoonHard  = max(orbWeight(...)) for hard Saturn<->Moon aspect, else 0
```

Risk tags from existing daily vibe tags (fallback `0` if absent):
- `riskTagContextSwitch` from label `context_switch` (`0..100`)
- `riskTagRushBias` from label `rush_bias` (`0..100`)

### 6.2 House pressure maps
Saturn house pressure:
- house `12` -> `14`
- house `10` -> `12`
- house `6` -> `10`
- house `8` -> `8`
- house `1` -> `6`
- otherwise -> `4`

Moon house pressure:
- house `12` -> `12`
- house `8` -> `10`
- house `6` -> `9`
- house `10` -> `8`
- house `3` -> `7`
- otherwise -> `4`

### 6.3 Score formula
Inputs from daily transit:
- `energy`, `focus`, `luck`
- `signals.positiveAspectStrength`
- `signals.momentum.energy/focus`
- dominant planet and retrograde state

```text
saturnLoad =
  20 * I(dominantPlanet == Saturn)
  + 12 * I(saturnRetrograde)
  + 7 * saturnMoonHard
  + 4 * saturnHardCount
  + saturnHousePressure

moonLoad =
  16 * I(dominantPlanet == Moon)
  + 3.5 * moonHardCount
  + 5 * saturnMoonHard
  + moonHousePressure
  + 0.9 * abs(momentum.energy - momentum.focus)

workloadMismatch =
  0.65 * max(0, energy - focus)
  + 0.40 * max(0, 60 - luck)
  + 1.10 * max(0, -momentum.focus)

tagPressure =
  0.20 * riskTagContextSwitch
  + 0.16 * riskTagRushBias

recoveryBuffer =
  0.35 * positiveAspectStrength
  + 0.22 * focus
  + 0.18 * luck

rawRisk = 12 + saturnLoad + moonLoad + workloadMismatch + tagPressure - recoveryBuffer
burnoutRiskScore = clamp(round(rawRisk), 0, 100)
```

### 6.4 Severity
- `< 55` -> `none` (no push)
- `55..69` -> `warn`
- `70..84` -> `high`
- `>= 85` -> `critical`

## 7. Push Fire-Time Algorithm (`burnout-timing-v1`)

### 7.1 Preconditions
Schedule push only if all are true:
1. `subscriptionTier === premium`
2. burnout alerts are enabled
3. valid push token exists
4. `burnoutRiskScore >= 55`

### 7.2 Intraday stress scan
To estimate stress peak time, sample transit chart in local timezone at fixed hours:
- `[08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00]`

For each sample hour `h`, call astrology provider with same day/location but `hour=h`.
Compute:
- `hourHardStrength(h)`
- `hourPositiveStrength(h)`
- `hourSaturnHard(h)`
- `hourMoonHard(h)`
- `hourSaturnMoonHard(h)`
- `hourSaturnHousePressure(h)`
- `hourMoonHousePressure(h)`

Hourly stress:
```text
hourlyStress(h) =
  clamp(
    burnoutRiskScore * 0.52
    + hourHardStrength(h) * 6
    + hourSaturnHard(h) * 8
    + hourMoonHard(h) * 7
    + hourSaturnMoonHard(h) * 10
    + hourSaturnHousePressure(h) * 0.9
    + hourMoonHousePressure(h) * 0.8
    - hourPositiveStrength(h) * 4,
    0, 100
  )
```

Peak slot:
- `peakHour = argmax(hourlyStress(h))`
- tie-breaker: earliest hour
- `predictedPeakLocal = peakHour + 30m` (slot center)

### 7.3 Lead time by severity
- `warn` -> `35` minutes before peak
- `high` -> `60` minutes before peak
- `critical` -> `90` minutes before peak

```text
candidateSendLocal = predictedPeakLocal - leadMinutes(severity)
```

### 7.4 Quiet hours and workday constraints
Apply in this order:
1. If `candidateSendLocal` inside quiet hours, move to `quietHoursEnd + 15m`.
2. Clamp into workday window `[workdayStart, workdayEnd]`.
3. Never send later than `predictedPeakLocal - 10m`.
4. If result is earlier than `now + 5m`, set to `now + 5m` if rule #3 still holds, otherwise skip for today.

If skipped for today:
- scheduler recalculates on next local day; no forced late-night delivery.

### 7.5 Dedupe and cooldown
- Max `1` burnout push per local date.
- Minimum `20h` between sends for same user.
- Do not send duplicate for same `{dateKey, severity}`.

## 8. Delivery Pipeline (Planned)
1. Mobile registers push token after permission grant.
2. Mobile saves burnout settings via backend API.
3. Backend scheduler (every 10 min) plans next 36h jobs.
4. Worker dispatches pushes at scheduled UTC timestamp.
5. Delivery result is persisted for retries/analytics.

## 9. Planned API Contracts

### 9.1 `PUT /api/notifications/push-token`
- Auth required.
- Body:
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "ios",
  "appVersion": "1.0.0"
}
```

### 9.2 `PUT /api/notifications/burnout-settings`
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

### 9.3 `GET /api/notifications/burnout-plan`
- Auth + premium required.
- Returns current computed risk and next planned fire time (for QA/support).

## 10. Data Model (Planned)
Collections:
1. `push_notification_tokens`
- `userId`, `token`, `platform`, `active`, `lastSeenAt`, `createdAt`, `updatedAt`
- unique index `{ token: 1 }`
- index `{ userId: 1, active: 1 }`

2. `burnout_alert_settings`
- `userId`, `enabled`, timezone/workday/quiet-hours fields
- unique index `{ userId: 1 }`

3. `burnout_alert_jobs`
- `userId`, `dateKey`, `severity`, `riskScore`, `predictedPeakAt`, `scheduledAt`, `status`, `providerMessageId`, `lastError`
- unique index `{ userId: 1, dateKey: 1 }`
- index `{ status: 1, scheduledAt: 1 }`

4. `burnout_alert_events`
- delivery and interaction events for QA and tuning

## 11. What Is Required From You (Current Status)

### 11.1 Firebase / Android
Provided and parsed:
1. `google-services.json`
2. FCM service-account JSON

Captured non-secret config:
- `project_id`: `horojob-e9f74` (`dev/preview`)
- `project_number`: `500068796496`
- Android package: `com.anonymous.horojob`
- `mobilesdk_app_id`: `1:500068796496:android:aaf97ee32646ab75fb2955`
- service account email: `firebase-adminsdk-fbsvc@horojob-e9f74.iam.gserviceaccount.com`

Still needed from your side:
1. Create production Firebase project: `horojob_prod`.
2. Provide production `google-services.json` when ready.
3. Provide production FCM service-account JSON when ready.

Confirmed on March 21, 2026:
- `Firebase Cloud Messaging API (V1)` is enabled.
- Current project `horojob-e9f74` is `dev/preview`.
- Future project `horojob_prod` is production target.

Migration note when switching to `horojob_prod`:
1. Update `android/app/google-services.json` with prod file.
2. Update backend FCM service account secret to prod.
3. Re-register push tokens in app (tokens from old project are not reusable).

### 11.2 Apple Push / iOS
Deferred by product decision for now.

When iOS phase starts, required inputs:
1. APNs Auth Key file (`.p8`)
2. APNs `Key ID`
3. Apple Developer `Team ID`
4. Confirm bundle id mapping

### 11.3 Expo/EAS access
Already provided envs:
1. `EXPO_DEV_USER`
2. `EXPO_DEV_PASSWORD`
3. `EXPO_DEV_PROJECT_NAME`
4. `EXPO_TOKEN`

Recommended additional item (for automation/security):
1. none at this stage

### 11.4 Product decisions
Confirmed:
1. Default quiet hours: `21:30-08:00` local.
2. Default workday window: `09:00-20:30` local.
3. Push copy approved (see section 13).

### 11.5 Security handling
- `google-services.json` must stay out of git history.
- Service-account JSON must stay outside this mobile repo and be stored in secret manager or secure local vault.
- Never commit `.p8` / service-account keys.

## 12. Rollout Plan
1. Build notification token registration + settings endpoints.
2. Implement risk and timing calculators in backend service.
3. Add scheduler + dispatch worker + persistence.
4. Wire settings toggle in mobile to real API.
5. QA with premium test user across at least 2 timezones.
6. Enable production with feature flag and monitor send success/error rates.

## 13. Approved Push Copy (v1)

### 13.1 `warn` (Low / Gentle Reminder)
- Headline: `Cosmic Battery: 40%`
- Body: `The stars suggest slowing down. Your Career Score is dipping today; maybe reschedule that big meeting for tomorrow?`

### 13.2 `high` (Serious Warning)
- Headline: `Burnout Risk: High`
- Body: `Mars is opposing your productivity. Don't try to outdo yourself today; save your strength for a breakthrough this Thursday.`

### 13.3 `critical` (Immediate Action)
- Headline: `System Overheat!`
- Body: `Your Energy Level is at a critical low. Close your laptop now. Even Saturn doesn't work 24/7, and neither should you.`
