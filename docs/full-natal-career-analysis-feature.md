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

## 2. User Experience
1. User taps `DeepDiveTile` on Dashboard and opens `FullNatalCareerAnalysis` screen.
2. App calls `GET /api/astrology/full-natal-analysis`.
3. If analysis exists for current model+prompt version and profile hash, return cached payload.
4. If not, backend generates and stores analysis, then returns it.
5. If user is free, mobile shows premium-required state and CTA to `PremiumPurchase`.
6. Public mobile UI does not expose regenerate action. `POST /api/astrology/full-natal-analysis/regenerate` remains admin/reset flow.

## 2.1 Mobile Client Data Layer (Current)

- Current shipped runtime still uses the direct service path:
  - `DeepDiveTile` prefetches with `fetchFullNatalCareerAnalysis()`
  - `FullNatalCareerAnalysisScreen` loads the report with the same service call
- A parallel React Query layer now exists in `src/hooks/queries/useCareerAnalysis.ts`:
  - `useCareerInsights()`
  - `useFullNatalCareerAnalysis()`
  - `useRegenerateNatalAnalysis()`
- Those hooks validate payloads through `CareerInsightsResponseSchema` and `FullNatalCareerAnalysisResponseSchema`, then route retry and cache metrics through `src/services/aiOrchestration.ts`.
- Current cache policy in the hook layer:
  - career insights: `10m` stale, `1h` GC
  - full natal analysis: `30m` stale, `2h` GC, `retry: 1`
  - regenerate mutation writes the fresh payload back into `['fullNatalCareerAnalysis']`
- Impact: the typed/cached abstraction is ready for screen migration, but current user-visible behavior is unchanged until the active screen path switches from direct service calls to these hooks.

## 3. API Contract (v1)

### 3.1 `GET /api/astrology/full-natal-analysis?refresh=false`
- Auth required.
- Premium required (`403 premium_required` when free).
- Returns:
```json
{
  "cached": true,
  "model": "gpt-4o-mini",
  "promptVersion": "v1",
  "narrativeSource": "llm",
  "generatedAt": "2026-03-20T12:00:00.000Z",
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

### 3.2 `POST /api/astrology/full-natal-analysis/regenerate`
- Auth required.
- Premium required.
- Forces generation and upsert for current prompt/model.

## 4. Data Model
Collection: `full_natal_career_analysis`

Document keys:
- `userId`
- `profileHash`
- `promptVersion`
- `model`
- `narrativeSource` (`llm|template`)
- `analysis` (structured payload)
- `generatedAt`
- `createdAt`
- `updatedAt`

Indexes:
1. Unique `{ userId, profileHash, promptVersion, model }`
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
4. Generate strict JSON with LLM (`json_schema` response format).
5. Normalize and validate structure.
6. Persist and return.

Fallback path:
- If full-natal LLM pipeline is disabled or API key missing, return deterministic template payload (`narrativeSource=template`) to keep feature operational.

## 6. Prompting Strategy (v1)

### 6.1 System Prompt (v1)
```txt
You are a senior vocational astrologer and career strategy advisor.
Produce a practical long-range career blueprint from provided natal chart signals.
Use only provided inputs and evidence.
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
3. Add analytics events:
- request started
- cached hit
- generated success
- generation failed
- regenerate tapped
4. Add rate limit/cooldown for regenerate.
5. Run QA with users having different chart structures and entitlement states.
