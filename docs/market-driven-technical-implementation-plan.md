# Market-Driven Technical Implementation Plan
**Status:** In progress  
**Created:** 2026-04-22  
**Owner:** Mobile + Backend

## Goal

Implement the market-driven career intelligence scope across backend and mobile while keeping provider credentials server-side, keeping raw public market facts free, and preserving premium value around personalized decision support.

This plan implements the product direction in `docs/market-driven-career-intelligence-plan.md`.

## Implementation Principles

- Keep CareerOneStop and O*NET credentials only in `../horojob-server`.
- Normalize provider payloads into Horojob contracts before sending data to mobile.
- Keep provider attribution metadata attached to every market-data response.
- Keep market facts visually separate from Horojob recommendations.
- Additive contracts first; avoid breaking the existing scanner until mobile has migrated.
- Cache provider responses aggressively enough to protect rate limits and UX.
- Treat Lite and Full scan depth as durable result metadata.
- Never auto-upgrade historical Lite scans into Full after purchase.

## Scope

### In Scope

- Backend market provider clients.
- Normalized occupation insight endpoint.
- Market-data caching collections and indexes.
- Job Posting Check Lite/Full split.
- New job usage limit model for Lite and Full quotas.
- Market enrichment inside scanner results.
- Lite/Full badges in result and history.
- Discover Roles market enrichment and ranking filter.
- Natal Chart market paths from chart-derived career vectors.
- Dashboard negotiation card.
- Mobile attribution/source footer component.
- Tests and docs for contracts, quotas, attribution, and provider fallback.

### Out Of Scope For First Implementation

- Deep comparison table for saved roles.
- Automatic conversion of old Lite history into Full.
- Saved job scans influencing natal/discover recommendations.
- Public web market snapshot outside the mobile/API architecture.
- Additional providers beyond CareerOneStop and O*NET.

## Provider Configuration

Backend env variables:

```text
CAREERONESTOP_BASE_URL=https://api.careeronestop.org
CAREERONESTOP_USER_ID=
CAREERONESTOP_TOKEN=
CAREERONESTOP_REQUEST_TIMEOUT_MS=10000
ONET_BASE_URL=https://api-v2.onetcenter.org
ONET_API_KEY=
ONET_TOKEN=
ONET_REQUEST_TIMEOUT_MS=10000
```

Runtime:

- CareerOneStop: `Authorization: Bearer <token>`, with `{userId}` in endpoint path.
- O*NET v2: `X-API-Key: <effective key>`.
- `ONET_API_KEY` is preferred; `ONET_TOKEN` remains a compatibility alias.
- `MARKET_CACHE_TTL_DAYS` controls normalized occupation insight cache retention; default `30`.

Validation:

- Provider smoke checks already pass through a static New York VPN path.
- Repeat validation from U.S.-hosted staging before release.

## Backend Architecture

### New Route Group

Add route group:

```text
/api/market
```

Initial endpoint:

```text
GET /api/market/occupation-insight?keyword=<title-or-soc>&location=<US|state|metro>
```

Implementation status:

- Implemented in backend as `GET /api/market/occupation-insight`.
- Query supports `keyword`, `location=US` default, and `refresh=true|false`.
- Endpoint returns normalized salary, outlook, skills, market labels, and source attribution.
- Endpoint requires the existing app auth session for now; raw market facts remain free within the app.

Auth decision:

- For app use, allow current anonymous sessions because the mobile app already creates anonymous auth.
- If provider terms require true public/no-login access for Web API tools, add a future public web-safe route or public mode that does not require explicit login.
- Do not gate raw market facts behind premium.

### Backend Modules

Add:

- `src/routes/market.ts`
- `src/services/marketData/careerOneStopClient.ts`
- `src/services/marketData/onetClient.ts`
- `src/services/marketData/occupationInsight.ts`
- `src/services/marketData/types.ts`
- `src/services/marketData/providerErrors.ts`

Keep provider-specific parsing inside provider clients. `occupationInsight.ts` should own the Horojob-facing normalized contract.

Current implementation keeps attribution, cache, and market scoring helpers inside `occupationInsight.ts`; split them later only if scanner/discover/natal reuse makes the file too broad.

### Normalized Types

Shared backend response shape:

```ts
type MarketSourceProvider = 'careeronestop' | 'onet';

type MarketSource = {
  provider: MarketSourceProvider;
  label: string;
  url: string | null;
  retrievedAt: string;
  attributionText: string;
  logoRequired: boolean;
};

type MarketSalaryRange = {
  currency: 'USD';
  period: 'annual' | 'hourly';
  min: number | null;
  max: number | null;
  median: number | null;
  year: string | null;
  confidence: 'high' | 'medium' | 'low';
  basis: 'posted_salary' | 'market_estimate';
};

type OccupationInsightResponse = {
  query: {
    keyword: string;
    location: string;
  };
  occupation: {
    onetCode: string | null;
    socCode: string | null;
    title: string;
    description: string | null;
    matchConfidence: 'high' | 'medium' | 'low';
  };
  salary: MarketSalaryRange | null;
  outlook: {
    growthLabel: string | null;
    projectedOpenings: number | null;
    projectionYears: string | null;
    demandLabel: 'high' | 'moderate' | 'low' | 'unknown';
  };
  skills: Array<{
    name: string;
    category: 'skill' | 'knowledge' | 'tool' | 'technology' | 'ability' | 'unknown';
    sourceProvider: MarketSourceProvider;
  }>;
  labels: {
    marketScore: 'strong market' | 'steady market' | 'niche market' | 'limited data';
    salaryVisibility: 'posted' | 'not_disclosed' | 'market_estimate' | 'unavailable';
  };
  sources: MarketSource[];
};
```

Mobile can map this into screen-specific cards and footers.

## Mongo Persistence

Add collections:

### `market_occupation_insights`

Cache normalized occupation insight results.

Fields:

- `_id`
- `cacheKey`
- `keyword`
- `normalizedKeyword`
- `location`
- `occupation`
- `salary`
- `outlook`
- `skills`
- `labels`
- `sources`
- `providerVersions`
- `retrievedAt`
- `expiresAt`
- `createdAt`
- `updatedAt`

Indexes:

- unique `cacheKey`
- TTL `expiresAt`
- helper `occupation.onetCode + location`
- helper `normalizedKeyword + location`

TTL:

- default 30 days for occupation insights, controlled by `MARKET_CACHE_TTL_DAYS`.
- This can be tuned after provider rate-limit review.

### `job_scan_results`

Optional but recommended for durable Lite/Full history and future history sync.

Current mobile history is local AsyncStorage. First implementation can keep local history, but backend persistence is cleaner for cross-device and premium upgrade behavior.

Fields:

- `_id`
- `userId`
- `scanDepth`: `lite | full`
- `source`
- `canonicalUrlHash`
- `jobContentHash`
- `profileHash`
- `marketInsightCacheKey`
- `analysisId` nullable for Lite
- `resultSnapshot`
- `createdAt`
- `updatedAt`

Indexes:

- `userId + createdAt desc`
- `userId + scanDepth + createdAt desc`
- `canonicalUrlHash + userId`

Decision:

- If implementation speed matters, defer backend `job_scan_results` and keep AsyncStorage history, but still add `scanDepth` to mobile saved entries.

### `job_usage_limits`

Evolve from current single counters to Lite/Full counters.

Add fields:

- `liteDateKey`
- `liteDailyCount`
- `fullDateKey`
- `fullDailyCount`
- keep legacy `freeWindowStartedAt`, `freeWindowSuccessCount`, `premiumDateKey`, `premiumDailyCount` until migration is complete.

Final quotas:

- free: 30 Lite/day, 1 Full/day.
- premium: 30 Lite/day, 10 Full/day.

Rules:

- Successful new Lite analysis increments Lite count.
- Successful new Full analysis increments Full count.
- Reopen from history does not increment.
- Cached Full analysis reopen does not increment if no new analysis work is performed.
- Lite reruns are treated as new Lite checks unless opened from saved local history.
- Screenshot Full consumes Full quota.

## Jobs API Contract Changes

### `GET /api/jobs/limits`

Add fields while preserving existing `limit`:

```json
{
  "plan": "free",
  "limit": {},
  "limits": {
    "lite": {
      "plan": "free",
      "period": "daily_utc",
      "limit": 30,
      "used": 0,
      "remaining": 30,
      "nextAvailableAt": null,
      "canProceed": true
    },
    "full": {
      "plan": "free",
      "period": "daily_utc",
      "limit": 1,
      "used": 0,
      "remaining": 1,
      "nextAvailableAt": null,
      "canProceed": true
    }
  }
}
```

Compatibility:

- Existing `limit` maps to Full limit during migration.
- Mobile should migrate to `limits.full` and `limits.lite`.

### `POST /api/jobs/preflight`

Request:

```json
{
  "url": "https://..."
}
```

Response additions:

```json
{
  "recommendedScanDepth": "lite | full",
  "limit": {},
  "limits": {
    "lite": {},
    "full": {}
  }
}
```

Behavior:

- Preflight is still a cheap cache and URL validation call; it does not consume quota.
- `recommendedScanDepth` is `full` when Full quota remains and `lite` when Full is exhausted but Lite remains.
- Existing `limit` maps to the recommended depth for compatibility.

### `POST /api/jobs/analyze`

Request:

```json
{
  "url": "https://...",
  "scanDepth": "auto | lite | full",
  "regenerate": false
}
```

Response additions:

```json
{
  "scanDepth": "lite | full",
  "requestedScanDepth": "auto | lite | full",
  "usage": {
    "depth": "lite | full",
    "limit": {},
    "limits": {
      "lite": {},
      "full": {}
    }
  },
  "market": {}
}
```

Lite response:

- Includes market, job summary, occupation match, role clarity, salary visibility, source footer metadata, tags, descriptors, and job preview.
- Does not require natal profile/chart.
- Returns zeroed score fields and an empty breakdown for compatibility; mobile hides those and shows locked Full panels.

Full response:

- Includes all Lite fields plus existing compatibility/risk/breakdown and personalized guidance.
- Cached Full analysis reopens without consuming Full quota.

### `POST /api/jobs/analyze-screenshots`

First implementation:

- Treat screenshot analysis as Full-only.
- Consume Full quota on successful screenshot parse/analysis.
- If Full unavailable, return limit state with upgrade path.

Later:

- Add Lite screenshot parse if product wants screenshot Lite checks.

## Market Scoring

Implement labels, not prominent numeric scores, in UI.

Backend can compute numeric internals but should send user-facing labels.

### Opportunity ROI Starting Weights

- Market opportunity: 35%
- Personal/natal fit: 30%
- Salary clarity and market pay: 15%
- Role clarity and application leverage: 10%
- AI replacement context: 5%
- Burnout/pressure context: 5%

### Market Score Starting Weights

- Salary percentile strength: 35%
- Growth/openings: 30%
- Skill accessibility: 15%
- Location/remote flexibility: 10%
- Pay transparency: 10%

### Application Priority Starting Weights

- Personal fit: 35%
- Market upside: 30%
- Salary clarity: 15%
- AI risk context: 5%
- Burnout/pressure context: 5%
- Role clarity and application leverage: 10%

AI risk and burnout/pressure should be visible as separate context and low-weight modifiers only.

## Mobile Architecture

### Services And Schemas

Add:

- `src/services/marketApiCore.ts` (implemented)
- `src/services/marketApi.ts` (implemented)
- `src/schemas/marketInsightSchema.ts`
- `src/hooks/queries/useMarketInsight.ts`

Implementation status:

- Mobile service-layer contract is implemented and tested through `src/services/marketApi.test.ts`.
- Scanner service/schema integration is implemented for `scanDepth`, `requestedScanDepth`, Lite/Full `limits`, and `market`.
- Discover, Natal Chart, Dashboard Negotiation Prep, and Full Blueprint integrations are now implemented in later market slices.

Update:

- `src/services/jobsApiCore.ts`
- `src/schemas/jobAnalysisSchema.ts`
- scanner runtime core and tests
- job scan history storage types

### Components

Add:

- `MarketSnapshotCard` (implemented for scanner)
- `MarketSourceFooter` (implemented for scanner)
- `SalaryRangeRow`
- `SalaryVisibilityBadge`
- `ScanDepthBadge` (implemented for scanner result/history)
- `LockedFullAnalysisPanel`
- `NegotiationPrepCard` (implemented for dashboard)
- `NegotiationPrepScreen` (implemented as free detail page)

Update:

- `JobProfileCard` to show posted salary and market estimate separately. (implemented)
- `ScannerAnalysisSection` to render Lite and Full paths. (implemented)
- `ScannerHistorySection` to show `Lite`/`Full` badges. (implemented)
- `JobCheckTile` copy to explain Lite checks and Full analysis.
- `PremiumPurchaseScreen` copy to balance more Full analyses with personalized decision support.

### Navigation

No new root route is required for first implementation.

Use existing:

- `Scanner`
- `ScannerHistory`
- `NatalChart`
- `DiscoverRoles`
- `Dashboard`
- `PremiumPurchase`

Add route params only if needed:

- `Scanner` may accept `scanDepth?: 'auto' | 'lite' | 'full'`.

### Scanner UX

Initial state:

- User pastes URL.
- If Full quota is available, default request is Full.
- If Full quota is exhausted, scan still runs as Lite if Lite quota remains.

First Full of the day:

- Show complete Full result.
- Save history with `scanDepth=full`.

After Full quota exhausted:

- Show Lite result with unlocked market cards.
- Render glass/blurred Full panels:
  - Compatibility Fit;
  - AI Risk;
  - Opportunity ROI;
  - Negotiation Angle.
- Show premium CTA with balanced message:
  - more Full analyses;
  - personalized decision support.

History:

- Show `Lite`/`Full` badges.
- Full history reopens Full.
- Lite history reopens Lite.
- Premium user opening old Lite result still sees Lite content, with `Run Full Analysis` action. (implemented)

### Market Attribution UX

Use one source footer per market-backed screen.

When any visible source has `provider=careeronestop` or `logoRequired=true`, the footer must show the compact CareerOneStop icon in the same row as the attribution copy.

Default text:

```text
Market data provided by CareerOneStop. Horojob guidance is independently generated.
```

Info modal/full text:

```text
Labor market data provided by CareerOneStop, U.S. Department of Labor. Horojob career guidance and astrological interpretations are independently generated and are not affiliated with or endorsed by CareerOneStop.
```

Footer placement:

- Scanner result: bottom of result screen below market cards.
- Discover Roles: bottom of recommendations/search result area.
- Natal Chart market paths: bottom of market-backed section.
- Negotiation Prep: bottom of card/page market guidance section.
- Full Career Blueprint: bottom of market-backed paths section.

Do not attach provider attribution to Horojob fit/recommendation cards.

## Feature Integration Plan

### 1. Provider Smoke And Env Hardening

Backend:

- Keep CareerOneStop and O*NET env schema.
- Add provider smoke script under backend scripts, without printing secrets.
- Add docs for expected smoke output.

Validation:

- U.S.-hosted staging smoke passes.
- Non-U.S. timeout behavior is documented as operational note.

### 2. Market Provider Clients

Backend:

- Implement CareerOneStop client.
- Implement O*NET client.
- Normalize errors:
  - `market_provider_unconfigured`
  - `market_provider_timeout`
  - `market_provider_unauthorized`
  - `market_provider_rate_limited`
  - `market_provider_unavailable`
  - `market_no_match`

Tests:

- provider client URL/header construction with injected fetch;
- timeout/error mapping;
- parser fixtures for known responses.

### 3. Occupation Insight Endpoint

Backend:

- Add `/api/market/occupation-insight`.
- Add cache collection and indexes.
- Add source metadata in every successful response.

Mobile:

- Add market API service and hook.
- Add simple dev/testing harness only if needed.

Tests:

- backend route validation;
- cache hit/miss behavior;
- mobile schema parsing.

### 4. Job Posting Lite/Full Backend

Backend:

- Add scan depth input.
- Add Lite/Full limit state.
- Add market enrichment after job parsing.
- Add scan-depth-specific response mapping.
- Keep old response fields for Full.

Tests:

- free Full quota is 1/day.
- free Lite quota is 30/day.
- premium Full quota is 10/day.
- premium Lite quota is 30/day.
- Full exhausted falls back to Lite when Lite remains.
- history/cache reopen does not increment quota.
- screenshot success consumes Full quota.

### 5. Job Posting Lite/Full Mobile

Status: implemented.

Mobile:

- Parse new `limits` and `scanDepth`.
- Add Lite/Full result rendering.
- Add locked premium panels.
- Add history badge behavior.
- Add premium CTA copy.
- Add market source footer.

Tests:

- scanner runtime fallback to Lite;
- Lite result hides Full-only sections and shows locked panels;
- Full result shows all sections;
- history badge rendering;
- premium user opening old Lite result still sees Lite result.

### 6. Discover Roles Market Enrichment

Status: implemented.

Backend:

- Enrich role catalog/recommendation responses with market fields by `onetCode`.
- Add ranking mode query:
  - `rankingMode=fit | opportunity`
- Default remains `fit`.

Mobile:

- Add top segmented control.
- Render market labels/chips.
- Keep fit score visually separate from market label.
- Add source footer for market-backed content.

Tests:

- default `fit` ranking unchanged.
- `opportunity` ranking changes order when market inputs differ.
- missing market data degrades to fit-only.

Current implementation also includes selected role market detail, checked search row enrichment,
local saved shortlist/compare, and shared source footer attribution for visible market-backed roles.

### 7. Natal Chart Market Paths

Status: implemented in current mobile/server slice.

Backend:

- Derive chart career vectors from natal chart prompt payload.
- Map vectors to role clusters/O*NET-backed market keywords.
- Enrich with market data through `/api/astrology/market-career-context`.
- Keep job scan history out of this algorithm for now.

Mobile:

- Natal Chart renders market-backed career paths asynchronously after chart load.
- Salary ranges, demand labels, and market gradients appear on development paths.
- Market source footer appears only inside the market-backed section.

Tests:

- market context helper degrades when provider enrichment fails.
- mobile service parser normalizes market paths and source data.
- arbitrary scanner history is not part of the market context endpoint.

### 8. Negotiation Prep Card And Page

Status: implemented as free deterministic guidance with dashboard card and detail page; premium timing, personalized scripts, and saved offer workflows remain later.

Backend:

- Generate deterministic negotiation prep from salary visibility and market estimate inside market career context.
- Payload includes anchor strategy, recruiter questions, baseline salary scripts, offer checklist, red flags, tradeoff levers, and next steps.
- Premium enhancement can use existing AI orchestration later.

Mobile:

- Dashboard card is placed after free career tools and AI Synergy, before premium Interview Strategy/calendar surfaces.
- Free guidance uses market range/pay-transparency context when available.
- Card links to `NegotiationPrep`, or `NatalChart` when prerequisites are missing.
- `NegotiationPrep` page links to `Scanner` for posting-specific checks.

Tests:

- service/parser tests cover the negotiation payload.
- dashboard placement is implemented in the static dashboard order.
- premium timing and personalized scripts are not exposed in this card/page.

### 9. Full Career Blueprint Market Context

Status: implemented in current mobile/server slice.

Backend:

- Full natal generation builds the same market career context and passes compact market paths into the LLM prompt.
- Full natal responses return market context and market career paths as top-level response fields.
- Prompt instructions explicitly guard against provider endorsement language.

Mobile:

- Role Fit Matrix cards can show matched salary range chips.
- Full Career Blueprint renders a market gradients section with salary ranges, demand labels, and source footer.

Tests:

- mobile runtime schema accepts market context fields.
- backend tests cover market prompt serialization and no-provider degradation.
- fixed source footer copy keeps provider attribution separate from Horojob guidance.

## Rollout Plan

### Release Slice A: Provider Foundation

- Env and smoke scripts. (done)
- Provider clients. (done)
- Occupation insight endpoint. (done)
- Cache collection/indexes. (done)
- Mobile service-layer contract. (done)
- Internal validation only. (done)

### Release Slice B: Scanner Lite/Full

- Backend scan depth and quotas. (done)
- Mobile Lite/Full rendering. (done)
- History badges. (done)
- Attribution footer. (done)
- This is the first user-visible market-data release.

### Release Slice C: Discover Roles

- Market fields in role cards. (done for recommendations and checked search rows)
- Ranking segmented control. (done: `Best Fit` / `Best Opportunity`)
- Source footer. (done for market-backed recommendations, selected role detail, and saved roles)
- Role detail market panel. (done)
- Skills/tools in opened role state. (done)
- Local saved shortlist/comparison. (done; AsyncStorage per user, cross-device sync deferred)

### Release Slice D: Natal/Blueprint/Negotiation

- Natal market paths.
- Dashboard negotiation card.
- Full Career Blueprint market context.

### Release Slice E: Negotiation Prep Detail

- Expanded deterministic negotiation payload. (done)
- Free `NegotiationPrep` page. (done)
- Dashboard card opens detail page. (done)
- Posting-specific checks still route to Scanner. (done)

## Validation Matrix

Backend:

- `npm run check`
- targeted provider client tests
- targeted market route tests
- targeted job limit tests
- `npm run verify:quiet`
- route smoke from U.S.-hosted staging

Mobile:

- `npm run typecheck`
- targeted service/schema tests
- targeted scanner runtime tests
- targeted RNTL tests for result/history rendering
- `npm run verify:quiet`

Manual smoke:

- Free user first URL scan -> Full.
- Free user second URL scan -> Lite + locked Full panels.
- Free user 31st Lite scan -> Lite quota state.
- Premium user -> 10 Full/day and 30 Lite/day.
- Screenshot success consumes Full quota.
- Full history reopens Full.
- Lite history reopens Lite after premium upgrade.
- Source footer appears on market-backed screens.
- No copy implies provider endorsement.

## Documentation Updates Required During Implementation

Backend:

- `../horojob-server/docs/backend-api-runtime-map.md`
- `../horojob-server/docs/jobs-api-contract.md`
- `../horojob-server/docs/mongo-collections-and-indexes.md`
- `../horojob-server/docs/skills-usage-log.md`

Mobile:

- `docs/job-position-check-feature.md`
- `docs/discover-roles-feature.md`
- `docs/full-natal-career-analysis-feature.md`
- `docs/navigation-map.md` only if routes change
- `docs/release-smoke-master-checklist.md`
- `docs/skills-usage-log.md`

## Key Risks

- Provider clarification now confirms that one public no-login website/tool is sufficient, and the first surface is now implemented in `../horojob-landing`.
- Provider rate limits may force longer cache TTLs or background refresh.
- Missing salary data can be misread as vacancy salary unless UI separates `Posted salary` and `Market estimate`.
- Lite/Full migration can break existing scanner assumptions if old `limit` handling is removed too early.
- Premium locked panels can feel punitive if Lite utility is too thin.
- Public no-login web surface now exists, but release still depends on U.S.-hosted smoke and provider runbook follow-through.

## Deferred TODOs Before Public Release

- [x] Add CareerOneStop logo asset/treatment to every CareerOneStop-backed market screen that uses the shared market footer.
- [x] Implement one public no-login web surface in `../horojob-landing` before public CareerOneStop-backed Web API tool launch.
- [ ] Re-run provider smoke checks from U.S.-hosted staging, not only the local static New York VPN path.
- [ ] Record CareerOneStop and O*NET rate limits/attribution requirements in provider runbook docs.
- [x] Separate posted salary from market estimate in `JobProfileCard`; backend now exposes nullable `job.salaryText` when extraction finds a posted salary.
- [x] Decide whether backend `job_scan_results` persistence is needed for cross-device scanner history. Decision: defer for first release; current implementation keeps scan history local on mobile.
- [x] Add a user action from Lite history to run a new Full analysis when product wants that conversion flow.

## Implementation Readiness Checklist

- [ ] Confirm U.S.-hosted staging can reach CareerOneStop and O*NET.
- [ ] Record CareerOneStop rate limits.
- [ ] Record O*NET rate limits and attribution requirements.
- [x] Document the public market surface route/files in `../horojob-landing` and cross-link them from mobile/backend docs.
- [x] Finalize backend normalized market response shape.
- [x] Decide whether `job_scan_results` backend persistence ships in first slice. Decision: defer; mobile history stores `scanDepth`.
- [x] Add provider client tests with fixtures.
- [x] Add market-data source footer component design.
- [x] Add compact CareerOneStop logo treatment to shared market footer.
- [x] Add Lite/Full quota migration strategy.
