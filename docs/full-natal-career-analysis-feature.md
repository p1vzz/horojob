# Full Natal Career Analysis - Feature Spec
**Version:** 0.1  
**Status:** Active (backend + mobile UI integrated)  
**Owner:** Backend + Mobile

## 1. Goal
Create a premium-only, one-time deep career blueprint generated from natal chart data and enriched with AI narrative generation.

Key requirements:
1. One deep analysis per user profile (`profileHash`) with cache reuse.
2. Premium-only access.
3. Structured phased plan (0-6, 6-18, 18-36 months).
4. Output must be machine-valid JSON for consistent mobile rendering.
5. Report generation is a one-shot action for the active profile. Users must not be offered a regenerate button because the product framing is a saved "golden" career blueprint, not a rerollable response.

## 2. User Experience
1. Dashboard `DeepDiveTile` calls `GET /api/astrology/full-natal-analysis?cacheOnly=true`.
2. If a saved analysis exists for current prompt version and profile hash, Dashboard renders the summary metrics.
3. If no saved analysis exists, Dashboard renders a CTA to generate the full report instead of placeholder scores.
4. User opens `FullNatalCareerAnalysis` screen.
5. App calls `GET /api/astrology/full-natal-analysis`.
6. If analysis exists, return cached payload. If not, backend generates and stores analysis, then returns it.
7. If user is free, mobile shows premium-required state and CTA to `PremiumPurchase`.
8. Public mobile UI does not expose regenerate action, and the public regenerate endpoint has been removed for v1.
9. First generation shows a server-driven staged loader with user-facing copy.
10. PDF export is deferred to v2. The v1 screen keeps a code TODO where the top-right action can be restored.
11. Reports include reflective/coaching guidance copy. They must not read as guaranteed career predictions.
12. If the active birth profile changed after a previous full report, the backend regenerates for the new `profileHash`; mobile shows a three-day notice using the birth profile `updatedAt` returned by the API.
13. Production UI does not show source/provider/model details. Development technical surfaces may expose model/prompt metadata for QA.

## 2.1 Mobile Client Data Layer (Current)

- Current shipped runtime still uses the direct service path:
  - `DeepDiveTile` checks saved reports with `fetchCachedFullNatalCareerAnalysis()`
  - `FullNatalCareerAnalysisScreen` loads or generates the report with `fetchFullNatalCareerAnalysis()`
- A parallel React Query layer now exists in `src/hooks/queries/useCareerAnalysis.ts`:
  - `useCareerInsights()`
  - `useFullNatalCareerAnalysis()`
- Those hooks validate payloads through `CareerInsightsResponseSchema` and `FullNatalCareerAnalysisResponseSchema`, then route retry and cache metrics through `src/services/aiOrchestration.ts`.
- Current cache policy in the hook layer:
  - career insights: `10m` stale, `1h` GC
  - full natal analysis: `30m` stale, `2h` GC, `retry: 1`
- Impact: the typed/cached abstraction is ready for screen migration, but current user-visible behavior is unchanged until the active screen path switches from direct service calls to these hooks.

## 3. API Contract (v1)

### 3.1 `GET /api/astrology/full-natal-analysis?cacheOnly=false`
- Auth required.
- Premium required (`403 premium_required` when free).
- `cacheOnly=true` returns only an existing cached analysis and does not generate a new report.
- When `cacheOnly=true` and no report exists yet, returns `404`:
```json
{
  "error": "Full natal analysis has not been generated yet.",
  "code": "full_natal_analysis_not_ready"
}
```
- Returns:
```json
{
  "cached": true,
  "model": "gpt-4o-mini",
  "promptVersion": "v1",
  "narrativeSource": "llm",
  "generatedAt": "2026-03-20T12:00:00.000Z",
  "profileUpdatedAt": "2026-03-20T11:00:00.000Z",
  "profileChangeNotice": {
    "profileUpdatedAt": "2026-03-20T11:00:00.000Z",
    "expiresAt": "2026-03-23T11:00:00.000Z"
  },
  "analysis": {
    "schemaVersion": "full_natal_analysis.v1",
    "headline": "Full Natal Career Blueprint",
    "executiveSummary": "...",
    "careerArchetypes": [],
    "strengths": [],
    "blindSpots": [],
    "roleFitMatrix": [],
    "phasePlan": [],
    "decisionRules": [],
    "next90DaysPlan": []
  }
}
```

### 3.2 `GET /api/astrology/full-natal-analysis/progress`
- Auth required.
- Premium required.
- Returns a generic operation progress snapshot that future loaders can reuse.
- Copy is user-facing and must not mention LLMs, vendors, prompt versions, or internal infrastructure.
- Example:
```json
{
  "operation": "full_natal_career_analysis",
  "status": "running",
  "title": "Building Career Blueprint",
  "subtitle": "Preparing your one-time career report from your birth details.",
  "activeStageKey": "building_blueprint",
  "stages": [
    {
      "key": "preparing_profile",
      "title": "Preparing your birth details",
      "detail": "We are checking the details needed to build your report.",
      "state": "complete"
    },
    {
      "key": "building_blueprint",
      "title": "Building your career blueprint",
      "detail": "We are shaping the long-form report and career map.",
      "state": "active"
    }
  ],
  "updatedAt": "2026-04-20T12:00:00.000Z",
  "expiresAt": "2026-04-20T12:10:00.000Z"
}
```

## 4. Data Model
Collection: `full_natal_career_analysis`

Document keys:
- `userId`
- `profileHash`
- `promptVersion`
- `model`
- `narrativeSource` (`llm`; first release starts with an empty production DB, so no legacy template compatibility is required)
- `analysis` (structured payload)
- `generatedAt`
- `createdAt`
- `updatedAt`

Indexes:
1. Unique `{ userId, profileHash, promptVersion }`
2. `{ userId, updatedAt: -1 }`

## 5. Generation Pipeline
1. Load user birth profile and natal chart.
2. Build normalized chart prompt payload:
   - asc sign, mc sign
   - placements
   - aspects
3. Load optional enrichment context:
   - latest AI synergy score/band
   - latest premium career insights summary
4. Generate strict JSON with the primary provider.
5. If the primary provider fails and a backup provider is configured, switch to the backup path during the same generation request.
6. Normalize and validate structure.
7. Persist and return only if the generated payload is valid.

Error path:
- Full report generation must not return deterministic/template replacement content.
- System failures are logged with stable internal codes.
- API responses expose stable `code` values for mobile mapping:
  - `full_natal_llm_unavailable`
  - `full_natal_llm_unconfigured`
  - `full_natal_llm_timeout`
  - `full_natal_llm_rate_limited`
  - `full_natal_llm_invalid_response`
  - `full_natal_llm_upstream_error`
  - `natal_chart_missing`
  - `birth_profile_missing`
- Mobile maps these codes to human-readable copy and shows retry or natal-chart generation actions.
- User retry is limited to one attempt. That retry also uses the primary provider plus backup provider path when configured.

## 6. Prompting Strategy (v1)

### 6.1 System Prompt (v1)
```txt
You are a senior vocational astrologer and career strategy advisor.
Produce a practical long-range career blueprint from provided natal chart signals.
Use only provided inputs and evidence.
Frame guidance as reflective career coaching: practical, specific, and useful for planning, without promising guaranteed results or treating astrological signals as certainty.
No deterministic predictions, no guaranteed outcomes.
Avoid medical/legal/financial claims.
Output strict JSON only.
```

### 6.2 User Prompt Template (v1)
```txt
Generate Full Natal Career Blueprint.

Requirements:
- executiveSummary: 2-4 focused sentences
- careerArchetypes: 3-4 entries with score and evidence
- strengths: exactly 4
- blindSpots: exactly 3 with mitigation
- roleFitMatrix: exactly 5
- phasePlan: exactly 3 phases (0_6_months, 6_18_months, 18_36_months)
- decisionRules: exactly 6
- next90DaysPlan: exactly 6
- Tone: strategic, practical, not mystical

Input JSON:
{ chartPayload, context, requiredSchemaVersion }
```

## 7. Suggested Model Inputs Expansion (v2+)
To make outputs less trivial and more diverse:
1. Add deterministic feature vectors:
- cognitive_style
- risk_appetite
- authority_style
- collaboration_mode
- learning_velocity
- execution_stability

2. Add richer chart-derived tags:
- house-emphasis tags
- aspect-pressure tags
- modality balance (cardinal/fixed/mutable)
- element balance (fire/earth/air/water)

3. Add controlled style diversification:
- `styleProfile`: `operator|strategist|builder|advisor`
- deterministic seed per user/profile for narrative variation without factual drift

4. Add quality gates:
- minimum evidence references per section
- minimum actionable items count
- reject/retry if response is generic or under-specified

## 8. Rollout
1. Ship backend routes + storage (done in v1 backend).
2. Build premium screen and rendering UI on mobile (done).
3. Analytics events currently emitted:
- `full_natal_report_dashboard_cta_tapped`
- `full_natal_report_opened`
- `full_natal_report_generation_started`
- `full_natal_report_generation_succeeded`
- `full_natal_report_generation_failed`
- `full_natal_report_retry_tapped`
- `full_natal_report_natal_chart_cta_tapped`
- `full_natal_report_premium_required`
- `full_natal_report_pdf_export_tapped` is deferred with the v2 PDF feature.

## 9. Next Release TODO
- Keep the no-template-fallback policy enforced as new LLM-backed guidance features are added. If the primary LLM vendor fails, prefer explicit error states or a true provider fallback, not fabricated replacement narratives.
- Extend the shared provider fallback abstraction to new LLM-backed guidance surfaces without changing mobile contracts.
- Add production analytics sink for the full report events listed above.
- Add release QA coverage that distinguishes network timeout, backend timeout, provider timeout, provider unavailable, and validation failure in user-facing error copy.
- Add cooldown/rate-limit policy for the one-time generate action near release hardening.
- Restore PDF export in v2 after first release, including share/save QA on iOS and Android.
- Run QA with users having different chart structures and entitlement states.
