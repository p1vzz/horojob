# AI Synergy Score
**Status:** Active (`ai-synergy-v2` in production flow)

**Current algorithm version:** `ai-synergy-v2` (primary)

## What It Is

`AI Synergy Score` is a daily metric for how effectively a user can collaborate with AI today, based on:

- natal chart baseline
- daily transit chart
- existing daily vibe metrics (`energy`, `focus`, `luck`)

It is recalculated daily and persisted as history.

## Storage

Mongo collection: `ai_synergy_daily`

Key fields:

- `userId`
- `profileHash`
- `dateKey`
- `algorithmVersion`
- `score`
- `band` (`peak` | `strong` | `stable` | `volatile`)
- `confidence`
- `confidenceBreakdown`:
  - `dataQuality`
  - `coherence`
  - `stability`
- `components`:
  - `cognitiveFlow`
  - `automationReadiness`
  - `decisionQuality`
  - `collaborationWithAI`
- `signals`:
  - dominant transit planet + house
  - MC / ASC signs
  - positive/hard aspect counts + weighted strengths
  - secondary house density signal
  - dignity/momentum signals
  - natal technical + communication bias
- `tags[]` (`work_mode`, `ai_mode`, `risk`, `timing`, `industry_bias`)
- `drivers[]`
- `cautions[]`
- `actionsPriority[]`
- `narrativeVariantId`
- `styleProfile`
- `headline`
- `summary`
- `description`
- `recommendations[]`
- `generatedAt`, `createdAt`, `updatedAt`

Indexes:

- unique: `(userId, profileHash, dateKey, algorithmVersion)`
- history: `(userId, dateKey desc)`

## API

- `GET /api/astrology/daily-transit`
  - now includes `aiSynergy` payload
- `GET /api/astrology/ai-synergy/history?days=30&limit=30`
  - returns stored history items

## Mobile Client Runtime (Current)

- `DashboardScreen` renders `AiSynergyTile`, and that tile now loads its data through `src/hooks/queries/useAiSynergy.ts` instead of keeping request state in component-local `useEffect` code.
- `useAiSynergy()` calls `fetchDailyTransit()`, validates the full payload with `DailyTransitResponseSchema`, and then returns the extracted `aiSynergy` object used by the tile.
- Query policy for the tile is `['aiSynergy', 'today']` with `5m` stale time, `30m` GC, refetch on mount, and refetch on reconnect.
- Request retry and cache-hit/cache-miss reporting flow through `src/services/aiOrchestration.ts` and `src/services/aiTelemetry.ts`.
- `src/hooks/queries/useAiSynergy.ts` also exports `useDailyTransit()` for future consumers that need the full transit payload rather than only the synergy slice.
- `AiSynergyTile` is wrapped in `React.memo(...)` because it sits inside the dashboard's animated tile stack and no longer needs to re-render for unrelated parent updates.

## Narrative Generation

The score, band, components, signals, tags, drivers, cautions, and action-priority metadata are deterministic. User-facing headline, summary, description, and recommendations are stored only when a real provider returns schema-valid narrative output.

If narrative generation is unavailable or fails, the backend persists the deterministic score payload with `narrativeStatus` and `narrativeFailureCode`; the mobile tile shows a bounded unavailable/preparing state instead of fabricated copy.

- env toggle: `OPENAI_AI_SYNERGY_ENABLED=true|false`
- model: `OPENAI_AI_SYNERGY_MODEL`
- prompt version: `OPENAI_AI_SYNERGY_PROMPT_VERSION`
- limits: `OPENAI_AI_SYNERGY_MAX_TOKENS`, `OPENAI_AI_SYNERGY_TEMPERATURE`

Stored metadata:

- `narrativeSource` (`llm` or `null`)
- `narrativeStatus` (`ready`, `pending`, `unavailable`, or `failed`)
- `narrativeFailureCode` when generation fails
- `llmModel`
- `llmPromptVersion`
