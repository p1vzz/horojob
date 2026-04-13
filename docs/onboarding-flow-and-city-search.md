# Onboarding Flow And City Search
**Version:** 0.1  
**Status:** Active  
**Last synced:** 2026-04-11

## Scope

This document covers the onboarding form lifecycle, city autocomplete behavior, payload submission, and local persistence contracts.

## Primary Files

- `src/screens/OnboardingScreen.tsx`
- `src/hooks/useOnboardingForm.ts`
- `src/services/citiesApi.ts`
- `src/services/astrologyApi.ts`
- `src/utils/onboardingStorage.ts`
- `App.tsx`

## User Flow

1. User opens `OnboardingScreen`.
2. Full form appears immediately.
3. User fills:
   - name
   - birth date
   - birth time (or marks unknown time)
   - birth city from autocomplete list
4. Submit sends profile to backend.
5. On success:
   - profile is saved locally per user
   - navigation replaces onboarding with `Dashboard`

## Completion Rule

Form is considered complete when all 4 conditions are met:

1. `name` is non-empty
2. `birthDate` exists
3. `birthTime` exists OR `unknownTime` is true
4. city is selected from city results (`citySelected === true`)

## City Search Pipeline

### Input behavior

- Minimum query length: `2`
- Debounce: `280ms`
- Blur close delay: `160ms`
- Result limit in onboarding hook: `6`

### Request behavior

- Hook uses `useDeferredValue(cityQuery)` and `startTransition(...)` for non-blocking UI updates.
- In-flight request ordering is protected via monotonic `requestId` (`citySearchRequestRef`).
- When user selects a city:
  - keyboard dismisses
  - fetch is suppressed for next render cycle (`suppressCityFetch`)
  - selection metadata is stored (`latitude`, `longitude`, `country`, `admin1`)

### API contract (`searchCities`)

- Endpoint: `GET /api/cities/search`
- Query params:
  - `query` (trimmed)
  - `count` (default `6`, clamped to `1..20`)
  - `language` (default `en`)
- Local in-memory cache:
  - key: `query|count|language`
  - TTL: `5 minutes`

## Date/Time Behavior

- Date and time are selected via `GlassDatePicker` and `GlassTimePicker`.
- When `unknownTime` is enabled:
  - `birthTime` is cleared
  - time picker cannot be opened
- Submission payload maps time as:
  - `birthTime: null` when `unknownTime === true`
  - otherwise actual `HH:mm` string

## Submit Contract

### Backend write

- API call: `upsertBirthProfile(...)`
- Endpoint: `PUT /api/astrology/birth-profile`
- Payload fields:
  - `name`
  - `birthDate`
  - `birthTime | null`
  - `unknownTime`
  - `city`
  - `latitude | null`
  - `longitude | null`
  - `country | null`
  - `admin1 | null`

### Local persistence

- After successful server write:
  - ensure active session (`ensureAuthSession`)
  - save profile in per-user storage key `onboarding:v2-by-user`
- Local save failure does not block successful onboarding completion.

## Future Birth Profile Edit

- If Settings adds birth data/profile editing, it must use the same backend write path: `PUT /api/astrology/birth-profile`.
- Do not treat local onboarding storage as the source of truth for edits. Local cache should be updated only after the backend write succeeds.
- After a birth profile edit, dependent backend-derived features must be refreshed from backend data rather than reused locally. This includes lunar productivity plan/card/push timing, daily transit, natal chart, morning briefing, AI synergy, and other `profileHash`-scoped outputs.
- Lunar productivity same-day timing is intentionally scoped to the active backend `profileHash`, so stale viewed/planned jobs from the previous profile should not suppress the newly computed card.

## Error Handling

- API 5xx -> generic temporary server message.
- API 4xx -> backend payload message if available.
- non-API errors -> network/fallback message.
- Submit errors are shown inline on onboarding screen.

## UI/Interaction Notes

- While city input is focused:
  - date/time block collapses
  - form is lifted above keyboard with adaptive offsets
- City dropdown is rendered above input and keeps tap handling active (`keyboardShouldPersistTaps="handled"`).
- Onboarding visuals use screen-brightness adaptation:
  - inputs, labels, helper text, and city dropdown map onto `text/border/glow` channels
  - the zodiac wheel uses the `intensity` channel for reveal/pulse strength and `text/border/glow` for symbols/rings
  - implementation reference: `docs/brightness-adaptation-system.md`

## Related Startup Behavior

- `App.tsx` supports an optional development-only onboarding override via `EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY=true`.
- After force flag removal, onboarding route depends on stored/remote profile availability.
