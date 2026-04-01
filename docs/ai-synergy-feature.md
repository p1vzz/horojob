# AI Synergy Score
**Status:** Active (`ai-synergy-v2` in production flow)

**Current algorithm version:** `ai-synergy-v2` (primary)

## What It Is

`AI Synergy Score` is a daily metric for how effectively a user can collaborate with AI right now, based on:

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

## Narrative Templates

Descriptions are built from large template pools (headline/openers/tech/collab/risk/recommendation banks) and selected by deterministic seeded hashing per user+day. `v2` adds `styleProfile` and `narrativeVariantId` to increase deterministic variety while keeping scores fixed.

## Optional LLM Polishing

If enabled, deterministic draft text is polished by OpenAI and stored in history.

- env toggle: `OPENAI_AI_SYNERGY_ENABLED=true|false`
- model: `OPENAI_AI_SYNERGY_MODEL`
- prompt version: `OPENAI_AI_SYNERGY_PROMPT_VERSION`
- limits: `OPENAI_AI_SYNERGY_MAX_TOKENS`, `OPENAI_AI_SYNERGY_TEMPERATURE`

Stored metadata:

- `narrativeSource` (`template` or `llm`)
- `llmModel`
- `llmPromptVersion`

Fallback behavior:

- any LLM error automatically falls back to deterministic template narrative (score history still persists).
