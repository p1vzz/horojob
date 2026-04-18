# Premium Widget - Architecture
**Version:** 0.1  
**Status:** Active (Android multi-variant widget implemented, iOS extension pending)  
**Owner:** Mobile + Backend

## Goal
Expose a compact `Morning Career Briefing` on the OS home screen, backed by the same daily career plan used by the in-app Career Vibe card.

## High-Level Components
1. Backend endpoint returns widget-ready briefing payload.
2. Mobile API client (`src/services/astrologyApi.ts`) fetches and validates payload.
3. App-side sync layer normalizes data and writes it into shared widget storage.
4. Android native widget providers read shared payload and render selected variant.
5. Android widget root taps launch the in-app `CareerVibePlan` route through `horojob://career-vibe-plan`.
6. iOS widget extension will reuse the same payload schema later.

## Android Variant Set (Implemented)
- `SMALL 2x2`
  - Career Vibe
  - Career Score
  - Energy Arc
  - Energy Value
  - Ring Score
- `MEDIUM 4x2`
  - Today's Career Vibe
- `STRIP 4x1`
  - Peak Strip
  - Minimal Strip

All Android variants support system Light/Dark theme via resource qualifiers.

## Data Source Strategy
- Reuse existing computed sources:
  - `daily-transit` response
  - `aiSynergy` object
- Use `career-vibe-plan` as the in-app tool contract:
  - deterministic plan for all authenticated users
  - optional LLM-polished plan for premium users when backend config allows it
- Keep widget payload compact and deterministic:
  - date key
  - headline
  - short summary
  - primary scores (`energy`, `focus`, `luck`, `aiSynergy.score`)
  - widget-safe plan snapshot (`headline`, `summary`, `primaryAction`, `peakWindow`, `riskGuardrail`)
  - generated/stale timestamps

## Sync and Refresh Model
- Trigger sync on:
  - app launch
  - purchase/entitlement upgrade
  - manual refresh action in app
  - daily boundary change (local user timezone)
- Minimum freshness target: once per local day.
- If network fails: keep last payload and mark stale.
- Android native rendering uses plan action copy when available and switches to refresh copy when `staleAfter` has passed.

## Storage and Contract Versioning
- Shared storage key: `widget.morningBriefing.v1`.
- Setup state key: `widget.morningBriefing.setupState`.
- Include payload `schemaVersion` to support future field changes.
- Never store auth tokens in widget-accessible storage.
- `morning-briefing-v2` adds `plan` without changing the shared storage key because the native module persists individual fields and keeps legacy fallbacks.

## Premium Gating
- Backend enforces premium access for widget payload endpoint.
- App may still show in-app preview card for free users, but widget sync must be blocked.

## Failure Handling
- `401`: signed out -> clear payload.
- `403 premium_required`: keep placeholder/locked widget state.
- `404 profile_missing`: show action state (`Complete profile`).
- `5xx/network`: keep last success payload, surface stale timestamp.

## Rollout Sequence
1. Android multi-variant release (provider set + pin flow + shared storage sync).
2. Post-purchase Android setup handoff from Premium activation to Settings style picker.
3. iOS widget extension with same payload schema.
4. Add background refresh improvements only after baseline reliability is confirmed.
