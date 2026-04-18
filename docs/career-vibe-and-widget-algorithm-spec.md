# Career Vibe and Morning Widget Algorithm Spec
**Version:** 1.2
**Status:** Active (`v2` is primary)  
**Owner:** Backend + Mobile

## 1. Purpose
This document defines:
- current deterministic calculation logic for `Career Vibe` on dashboard;
- how `Morning Career Briefing` widget payload is built;
- how Android widget variants derive display values;
- where dashboard and widget values can diverge;
- current `v2` algorithm behavior for richer signals, tags, and narrative variety.

## 2. Scope and Source of Truth
Implementation sources:
- Backend:
  - `../horojob-server/src/services/dailyTransit.ts`
  - `../horojob-server/src/services/aiSynergy.ts`
  - `../horojob-server/src/services/careerVibePlan.ts`
  - `../horojob-server/src/services/morningBriefing.ts`
  - `../horojob-server/src/routes/astrology.ts`
- Mobile:
  - `src/components/DailyAstroStatus.tsx`
  - `src/screens/CareerVibePlanScreen.tsx`
  - `src/components/AiSynergyTile.tsx`
  - `src/services/astrologyApi.ts`
  - `src/services/morningBriefingSync.ts`
  - `src/components/MorningBriefingWidgetVariantPicker.tsx`
- Android widget:
  - `android/app/src/main/java/com/anonymous/horojob/MorningBriefingWidgetModule.kt`
  - `android/app/src/main/java/com/anonymous/horojob/MorningBriefingWidgetProvider.kt`

If this doc conflicts with code, code wins and this doc must be updated.

## 3. End-to-End Data Flow
### 3.1 Dashboard `Career Vibe` card
1. Mobile calls `GET /api/astrology/career-vibe-plan?refresh=false`.
2. Backend returns a tool-like daily plan with metrics, best-use categories, avoid items, peak window, strategies, and explainability notes.
3. Free users receive deterministic template copy; premium users can receive LLM-polished narrative copy when the backend LLM flag and API key are enabled.
4. `DailyAstroStatus` renders the plan headline, primary action, summary, `bestFor`, `avoid`, and metrics. It labels `luck` as user-facing `Opportunity`.
5. The `Open full plan` action navigates to `CareerVibePlanScreen`.
6. If live fetch fails and a saved plan exists, the card shows the saved plan with a `Saved` label and inline stale-sync copy.
7. If no saved plan exists, the card shows a clearly labeled sample plan instead of silently presenting placeholder data as live guidance.

### 3.1.1 Career Vibe detail tool
1. `CareerVibePlanScreen` calls `GET /api/astrology/career-vibe-plan?refresh=false` on entry.
2. Manual refresh calls the same endpoint with `refresh=true` only on non-production technical surfaces.
3. The screen renders the full plan contract:
  - `primaryAction`
  - `peakWindow`
  - `focusStrategy`
  - `communicationStrategy`
  - `aiWorkStrategy`
  - `riskGuardrail`
  - `bestFor`
  - `avoid`
  - `explanation.drivers`
  - `explanation.cautions`
  - `explanation.metricNotes`
4. It saves successful payloads in per-user local storage.
5. It keeps the previous successful plan visible if a manual refresh fails and shows the refresh error inline.
6. `401` and `404` responses clear the local plan cache so a signed-out or profile-missing user does not keep seeing stale personalized guidance.
7. Production UI hides raw cache/source/model/prompt/schema labels; non-production UI keeps them visible under `EXPO_PUBLIC_APP_ENV`.

### 3.2 Dashboard `AI Synergy` tile
1. Same `daily-transit` response may include `aiSynergy`.
2. `AiSynergyTile` renders `aiSynergy.score`, narrative, and recommendations.
3. If `aiSynergy` is missing, tile falls back to local static placeholder values.

### 3.3 Morning widget pipeline
1. Mobile sync layer calls `GET /api/astrology/morning-briefing` (premium-only).
2. Backend composes morning payload from daily transit + AI synergy.
3. Mobile writes payload into native widget storage via `syncMorningBriefing`.
4. Android widget provider reads stored snapshot and computes derived display fields (`vibeDelta`, `trend`, `peakWindow`, etc.).
5. Variant layout renders different subsets of snapshot + derived fields.
6. Tapping any Android widget variant opens the full in-app `CareerVibePlan` route through `horojob://career-vibe-plan`.

## 4. Current Daily Transit Vibe Algorithm (`daily-vibe-v2`)
All metric outputs are integer percentages in `[10..99]`.

### 4.1 Dominant transit selection
For each transit planet in a house:

```text
planetTransitScore =
  houseWeight(houseId)
  + planetWeight(planetName)
  + (retrograde ? -1.2 : +1.1)
  + dignityDelta(planet, sign) * 0.72
  + phaseWeight(planet) * 0.18
```

Dominant transit = max `planetTransitScore`.

### 4.2 Orb-weighted aspect signal
Aspect buckets:
- positive: `trine`, `sextile`
- hard: `square`, `opposition`, `quincunx`

Each aspect contributes weighted strength:

```text
strength = baseWeight(type) * orbFactor
orbFactor = clamp(1 - min(orb, maxOrb(type))/maxOrb(type), 0.12, 1)
```

Output signal:
- `positiveCount`, `hardCount`
- `positiveStrength`, `hardStrength`

### 4.3 Secondary house + momentum
- Secondary house is derived from transit house density excluding dominant house.
- `secondaryHouseBoost` is added to all metric formulas.
- Cross-day momentum uses previous day metrics:

```text
momentum.energy = clamp((baseEnergy - prevEnergy) * 0.18, -6, 6)
momentum.focus  = clamp((baseFocus  - prevFocus)  * 0.16, -6, 6)
momentum.luck   = clamp((baseLuck   - prevLuck)   * 0.14, -5, 5)
```

### 4.4 Metric formulas (`v2`)
```text
baseEnergy =
  53
  + houseWeight * 1.95
  + planetWeight * 1.15
  + positiveStrength * 1.82
  - hardStrength * 2.08
  + dignity * 0.9
  + phaseBoost * 0.54
  + secondaryHouseBoost * 0.72

baseFocus =
  49
  + houseFocusBonus
  + retrogradeFocusModifier
  + positiveStrength * 1.3
  - hardStrength * 1.72
  + dignity * 1.08
  + phaseFocusModifier
  + secondaryHouseBoost * 0.5

baseLuck =
  47
  + luckPlanetBonus
  + positiveStrength * 2.08
  - hardStrength * 1.24
  + dignity * 0.72
  + phaseBoost * 0.4
  + secondaryHouseBoost * 0.44

energy = clamp(round(baseEnergy + momentum.energy), 10, 99)
focus  = clamp(round(baseFocus  + momentum.focus),  10, 99)
luck   = clamp(round(baseLuck   + momentum.luck),   10, 99)
```

### 4.5 Explainability additions
`transit` payload now includes additive:
- `algorithmVersion`
- `signals`
- `tags`
- `drivers`
- `cautions`

## 5. Current AI Synergy Algorithm (`ai-synergy-v2`)
`aiSynergy` is generated by backend and returned in `daily-transit`.

### 5.1 Inputs
- `vibe.metrics.energy/focus/luck`
- dominant transit planet/house/sign/retrograde
- orb-weighted aspect strengths (`positiveStrength`, `hardStrength`)
- secondary house density signal
- `vibe` momentum signal
- natal chart biases:
  - `natalTechnicalBias`
  - `natalCommunicationBias`

### 5.2 Component formulas (`v2`)
```text
cognitiveFlow =
  clamp(
    21
    + focus * 0.58
    + natalCommunicationBias * 0.22
    + planetBoost * 1.4
    + positiveStrength * 2.4
    - hardStrength * 2.05
    + phaseModifier * 0.65
    + dignityBalance * 0.8
    + momentumScore * 0.8,
    24, 98
  )

automationReadiness =
  clamp(
    19
    + energy * 0.34
    + natalTechnicalBias * 0.42
    + houseBoost * 1.6
    + planetBoost * 1.2
    + positiveStrength * 2.15
    - hardStrength * 1.45
    + secondaryHouseDensity * 1.25
    + secondaryHouseBonus
    + dignityBalance * 0.5,
    22, 98
  )

decisionQuality =
  clamp(
    23
    + focus * 0.44
    + luck * 0.18
    + natalTechnicalBias * 0.18
    + dominantHouseBonus
    + positiveStrength * 2.05
    - hardStrength * 2.2
    + dignityBalance * 0.92
    - momentumScore * 0.6,
    20, 97
  )

collaborationWithAI =
  clamp(
    18
    + energy * 0.24
    + luck * 0.22
    + natalCommunicationBias * 0.45
    + collaborationHouseBonus
    + collaborationPlanetBonus
    + positiveStrength * 1.95
    - hardStrength * 1.28
    + secondaryHouseCollabBonus,
    20, 98
  )
```

### 5.3 Final score, confidence, and enrichments
```text
score =
  clamp(
    cognitiveFlow * 0.31
    + automationReadiness * 0.30
    + decisionQuality * 0.23
    + collaborationWithAI * 0.16,
    18, 98
  )
```

Band thresholds:
- `peak`: `score >= 88`
- `strong`: `score >= 76`
- `stable`: `score >= 64`
- `volatile`: else

Confidence:
- `confidenceBreakdown.dataQuality`
- `confidenceBreakdown.coherence`
- `confidenceBreakdown.stability`
- final `confidence` = weighted blend of these three.

Additive fields:
- `narrativeVariantId`
- `styleProfile`
- `tags`
- `drivers`
- `cautions`
- `actionsPriority`
- `signals` now includes weighted aspect and momentum details

### 5.4 Narrative layer
- Deterministic planner builds structured payload (scores + tags + drivers + actions).
- Deterministic template draft uses style profile and variant id.
- Optional LLM rewrite is schema-validated and cannot modify numeric fields.

## 6. Morning Briefing Payload (`/morning-briefing`)
Premium users only (`403` for free users).

Payload construction:
- `energy/focus/luck` = clamped daily transit vibe metrics.
- `aiSynergy`:
  - use `transit.aiSynergy.score` if available;
  - else fallback:

```text
fallbackAi =
  clamp(
    energy * 0.34
    + focus * 0.44
    + luck * 0.22
    + (focus - energy) * 0.06,
    10, 99
  )
```

- `headline`:
  - `transit.aiSynergy.headline` if present and non-empty;
  - else `transit.vibe.title`.
- `summary`:
  - `transit.aiSynergy.summary` if present and non-empty;
  - else `transit.vibe.summary`.
- `modeLabel` = `transit.vibe.modeLabel`.
- additive `insights` object includes:
  - `insights.vibe` (`algorithmVersion`, `drivers`, `cautions`, `tags`)
  - `insights.aiSynergy` (`algorithmVersion`, `band`, `confidence`, `confidenceBreakdown`, `tags`, `drivers`, `cautions`, `actionsPriority`, `narrativeVariantId`, `styleProfile`)
- additive `plan` snapshot includes widget-safe fields:
  - `headline`
  - `summary`
  - `primaryAction`
  - `peakWindow`
  - `riskGuardrail`

`morning-briefing-v2` keeps the original headline, summary, mode label, and metrics fields intact while adding `plan`. The Android widget uses `plan.primaryAction` and `plan.peakWindow` when present; older cached payloads without `plan` still fall back to the legacy derived presentation.

## 6.1 Career Vibe Plan Payload (`/career-vibe-plan`)
Authenticated users only. Premium is not required for the endpoint itself.

Query params:
- `refresh=true|false` bypasses the daily cache when true.

Payload construction:
- `metrics.energy/focus/luck` come from `daily-transit`.
- `metrics.opportunity` mirrors `luck` for user-facing career timing copy.
- `metrics.aiSynergy` uses `transit.aiSynergy.score` when available, otherwise the same weighted fallback used by morning briefing.
- `plan` contains `headline`, `summary`, `primaryAction`, `bestFor`, `avoid`, `peakWindow`, `focusStrategy`, `communicationStrategy`, `aiWorkStrategy`, and `riskGuardrail`.
- `explanation` contains `drivers`, `cautions`, and `metricNotes`.
- `sources` records daily vibe and AI synergy date/algorithm versions.

LLM behavior:
- Deterministic scoring and deterministic plan fields are always built first.
- LLM is attempted only for premium users when `OPENAI_CAREER_VIBE_PLAN_ENABLED=true` and `OPENAI_API_KEY` is set.
- The LLM may rewrite plan text only; it cannot change metrics, dates, or peak window.
- Invalid or failed LLM output falls back to deterministic template copy.

## 7. Android Widget Derived Presentation Model
Snapshot fields persisted from morning payload:
- `headline`, `summary`, `modeLabel`
- `energy`, `focus`, `luck`, `ai`
- `dateKey`
- `generatedAt`, `staleAfter`
- optional plan fields: `planHeadline`, `primaryAction`, `peakWindowOverride`, `riskGuardrail`

Derived fields:
```text
daySeed = lastTwoDigits(dateKey) or 11

vibeDelta =
  clamp(
    round((energy + focus + ai) / 3 - 70),
    -25, +25
  )

trendLabel = Rising if vibeDelta >= 3
          = Cooling if vibeDelta <= -3
          = Steady otherwise

energyDelta =
  clamp(
    energy - (61 + ((focus + daySeed) % 19)),
    -12, +12
  )

moonPhase = moonPhases[(energy + focus + ai + daySeed) % moonPhases.length]
mercuryLabel = ((ai + daySeed) % 5 == 0) ? "Mercury Rx" : "Mercury Dir"

startHour24 = 9 + ((energy + focus + luck + daySeed) % 9)
endHour24 = min(startHour24 + 2, 21)
peakWindow = to12Hour(startHour24) + "-" + to12Hour(endHour24) + ("PM" if endHour24 >= 12 else "AM")
```

Variant data usage:
- `small_vibe`: `vibeDelta`, `primaryAction` when available, otherwise `trendLine`
- `small_score`: `ai`, `moonPhase`, `mercuryLabel`
- `small_energy_arc`: `energy`, `energyDelta`
- `small_energy_value`: `energy`
- `small_ring_score`: `ai`
- `medium_vibe`: `planHeadline`, `vibeDelta`, `trendLine`, `primaryAction`, formatted date
- `strip_peak`: `vibeDelta`, `primaryAction`, `peakWindow`
- `strip_minimal`: `vibeDelta`, `peakWindow`

When `staleAfter` is in the past, action-heavy fields switch to muted/stale refresh copy while preserving the last numeric snapshot.

## 8. In-App Style Picker Preview Logic (Not 1:1 with Native Widget)
The settings preview component uses local approximation logic. Known differences from native widget renderer:
- Uses 5 moon phases in preview vs 6 in native widget.
- `small_energy_arc` "from yesterday" text in preview is synthetic and differs from native `energyDelta`.
- `small_score` preview uses neutral "Timing cue" copy; native still computes the compact timing label from seed.
- Medium date label preview may show raw `dateKey`, native formats verbose date.

This is expected for quick visual preview, but not exact parity.

## 9. Relationship Between Metrics
Base relation graph:
```text
transit chart -> daily vibe (energy/focus/luck + dominant)
daily vibe + natal/transit features -> aiSynergy score
daily vibe + aiSynergy -> career-vibe-plan tool output
daily vibe + aiSynergy -> morning briefing payload
morning payload -> widget snapshot -> derived display values (delta/trend/window)
```

Practical interpretation:
- `energy`, `focus`, `luck` are the common source shared between dashboard and widgets.
- Dashboard labels timing quality as `Opportunity`; backend keeps `luck` for compatibility.
- `aiSynergy` depends on those metrics plus extra chart-derived features.
- Widget `vibeDelta` is not a direct backend score; it is a display aggregate from `energy + focus + ai`.

## 10. Known Divergence Scenarios
- Dashboard can show fresher `daily-transit` than widget if widget sync has not run yet.
- Widget can show last cached payload when network fails.
- Free users and profile-missing users get locked/placeholder widget states.
- Picker preview can differ slightly from final native widget rendering.

## 11. Algorithm v2 (Implemented, Primary)
### 11.1 Backend version status
- `dailyTransit.transit.algorithmVersion = daily-vibe-v2`
- `aiSynergy.algorithmVersion = ai-synergy-v2`
- `morningBriefing.schemaVersion = morning-briefing-v2`
- `careerVibePlan.schemaVersion = career-vibe-plan-v1`

### 11.2 Implemented deterministic upgrades
- Aspect strength now uses `orb`-weighted intensity (not count-only buckets).
- Dominant signal now includes dignity/phase adjustments.
- Secondary house density is part of both vibe and AI synergy signals.
- Cross-day momentum is included via previous-day metric deltas.
- Confidence is decomposed into:
  - `dataQuality`
  - `coherence`
  - `stability`

### 11.3 Implemented structured explainability
- `daily-transit.transit` now includes additive:
  - `signals`
  - `tags`
  - `drivers`
  - `cautions`
- `aiSynergy` now includes additive:
  - `narrativeVariantId`
  - `styleProfile`
  - `confidenceBreakdown`
  - `tags`
  - `drivers`
  - `cautions`
  - `actionsPriority`
- `morning-briefing` now includes additive `insights`:
  - `insights.vibe`
  - `insights.aiSynergy`

### 11.4 Implemented LLM narrative diversity constraints
- Deterministic scoring remains source of truth for all numeric fields.
- LLM may only rewrite narrative text.
- LLM output is schema-validated.
- Any LLM failure falls back to deterministic narrative payload.

### 11.5 Implemented P1 tool surface
- Dashboard card remains compact and action-oriented.
- Detail screen exposes the complete plan, strategies, explainability, and manual refresh.
- The detail screen uses the same `career-vibe-plan-v1` contract; no separate mobile-only interpretation layer is introduced.

### 11.6 Implemented P2 local resilience
- Successful `career-vibe-plan` responses are persisted per user in `career-vibe-plan:v1:<userId>`.
- Dashboard and detail screen both use the same cache sync service.
- Transient network/API failures fall back to the saved plan when available.
- Auth/profile errors clear the cache to avoid showing stale user-bound guidance.

## 12. Next Improvements (v3 Candidates)
- Calibrate orb weights with empirical quality metrics by aspect family.
- Add lightweight per-user preference priors (optional, additive only).
- Add narrative anti-repetition memory across rolling 14-day window.
- Add explicit contribution percentages for top 3 drivers in API.

## 13. Non-goals
- No LLM-generated raw numeric score as single source of truth.
- No breaking response contract for existing widget variants.
- No hard dependency on extra user-entered profile fields for baseline pipeline.
