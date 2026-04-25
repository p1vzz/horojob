# Market-Driven Career Intelligence Plan
**Status:** Product and technical plan  
**Created:** 2026-04-22  
**Last updated:** 2026-04-25  
**Owner:** Mobile + Backend

## Purpose

Horojob is evolving from a primarily astrology-guided career app into a market-driven career intelligence product: career guidance should combine natal/profile signals, AI-assisted interpretation, and reliable United States labor-market data.

The product promise becomes:

> Help users understand which career moves fit them personally and make sense in the current U.S. labor market.

Labor-market facts are not the premium product by themselves. Premium value comes from personalized synthesis, prioritization, timing, saved workflows, and decision support built on top of those facts.

Technical execution plan: `docs/market-driven-technical-implementation-plan.md`.

## Current Session Outcomes

- CareerOneStop API credentials were received and stored in backend local env only.
- Backend env support now includes:
  - `CAREERONESTOP_BASE_URL`
  - `CAREERONESTOP_USER_ID`
  - `CAREERONESTOP_TOKEN`
  - `CAREERONESTOP_REQUEST_TIMEOUT_MS`
- Credentials were not added to mobile `EXPO_PUBLIC_*` env because those values are public in client bundles.
- Initial local network testing showed `api.careeronestop.org:443` timing out from the non-U.S. development network, while `www.careeronestop.org` was reachable.
- After switching to a static New York VPN endpoint, CareerOneStop smoke checks succeeded:
  - occupation endpoint returned `200`;
  - `Software Developers` resolved from O*NET-SOC `15-1252.00`;
  - wage year `2024`, wages, skills, and metadata were present.
- O*NET Web Services v2 smoke checks succeeded:
  - `/about/` returned `200` and API version `2.0.0`;
  - `/online/search?keyword=software developer` returned `200`, total `566`, and first result `15-1252.00 Software Developers`.
- Backend env support should use `ONET_BASE_URL`, `ONET_API_KEY`, `ONET_TOKEN` as a compatibility alias, and `ONET_REQUEST_TIMEOUT_MS`. Production code should send the effective key through the `X-API-Key` header.
- Slice A provider foundation is implemented: normalized `/api/market/occupation-insight`, cached market occupation insights, and mobile market API parsing.
- Slice B scanner foundation is implemented: Job Posting Check supports Lite/Full scan depth, daily Lite/Full quotas, market enrichment, result/history badges, and locked Full panels for Lite scans.
- Slice C Discover Roles foundation is implemented: recommendations support `Best Fit` / `Best Opportunity`, market labels, source footer, and checked search-row market enrichment.
- Slice D Natal Chart, Negotiation Prep, and Full Career Blueprint market context is implemented.
- CareerOneStop logo treatment is implemented in the shared market source footer for CareerOneStop-backed market facts.
- Negotiation Prep now has a free detail page with market anchor, recruiter questions, baseline scripts, offer checklist, red flags, tradeoff levers, and next steps.

## Deferred Compliance And Release TODOs

- Re-run the implemented public web market tool surface from U.S.-hosted staging.
- Validate CareerOneStop and O*NET again from U.S.-hosted staging.
- Record provider rate limits and attribution requirements in operational docs.
- Keep raw provider facts free/public; premium copy must continue selling personalized synthesis and workflows, not access to public labor-market facts.

## Compliance Boundary

CareerOneStop response constraints from the API approval email:

- Web API services launched on the site must be available to the public.
- They must be available at no cost.
- They must not require login.
- CareerOneStop logo must be displayed on all pages containing CareerOneStop Web API tools.
- Data should be used as part of a value-added application, not redistributed as a standalone data product.

Product interpretation:

- Free/public layer can show factual labor-market data: salary ranges, job outlook, demand, skills, qualifications, and source metadata.
- Premium layer should not sell raw CareerOneStop facts.
- Premium layer can sell personalized interpretation, natal/profile synthesis, prioritization, saved comparisons, negotiation scripts, calendar timing, and deeper action plans.
- Any production implementation must include source attribution and the CareerOneStop logo wherever CareerOneStop-backed market data appears.
- Public web requirement decision: Horojob now serves one public no-login web page/tool in `../horojob-landing` at `app/market-tools/role-outlook/page.tsx`. This is the current compliance surface for shared CareerOneStop-backed public facts.

### Provider Clarification Recorded On April 25, 2026

Follow-up email answers from CareerOneStop clarified:

- `1.` If Horojob provides a public, free, no-login website version of the CareerOneStop-backed tool, the same API data may also be used inside the mobile app.
- `2.` Mobile app screens may require login, as long as the same underlying tool/data is available publicly on the website at no cost and without login.
- `3.` The CareerOneStop logo should be displayed on all pages, but if it does not fit, that is acceptable.
- `4.` One public website/tool is sufficient; each distinct app experience does not need its own separate public web page.

Operational implication:

- the compliance surface can be satisfied by a single public web tool in `../horojob-landing`;
- the existing mobile surfaces may continue using the same provider-backed data once that public website version exists;
- public website scope should stay minimal and factual, while the app continues to carry the richer personalized/mobile-only UX.

### Compliance Copy Rules

Market data and Horojob guidance must stay visually and semantically separate.

Data layer labels:

- `Market data`
- `Posted salary`
- `Market estimate`
- `Occupation outlook`
- `Skills from labor-market sources`

Horojob interpretation labels:

- `Horojob fit note`
- `Profile-based guidance`
- `Opportunity ROI`
- `Negotiation angle`
- `Timing guidance`

Do not imply provider endorsement or a scientific relationship between labor-market sources and astrology/profile interpretation.

Forbidden copy:

- `CareerOneStop recommends this career for your chart.`
- `Department of Labor-backed astrology.`
- `CareerOneStop validates this role for Leo traits.`
- `Our U.S. labor-market research` when the block is provider-sourced.

Allowed copy:

- `Market data provided by CareerOneStop.`
- `Horojob guidance is generated independently from market data and your profile.`
- `This role may be worth exploring based on your profile and current market context.`
- `The posting does not disclose pay, so we show a market estimate for similar roles.`

Default screen footer for CareerOneStop-backed market screens:

```text
Market data provided by CareerOneStop, U.S. Department of Labor. Horojob career guidance and astrological interpretations are independently generated and are not affiliated with or endorsed by CareerOneStop.
```

Footer visual treatment:

- Render a compact CareerOneStop icon in the same row as the attribution copy when any visible source has `provider=careeronestop` or `logoRequired=true`.
- Keep the icon attached to market data sections only; do not place it on Horojob fit, astrology, or premium synthesis cards.
- Current mobile surfaces covered by the shared footer: Natal Chart market paths, Job Posting Check Lite/Full, Discover Roles, Negotiation Prep card, and Full Career Blueprint market gradients.

Compact UI footer when space is limited:

```text
Market data provided by CareerOneStop. Horojob guidance is independently generated.
```

## Product Decisions

### Core Positioning

Horojob should be described as a career intelligence app that combines:

- labor-market data for the U.S. market;
- natal/profile-based career fit signals;
- AI-assisted coaching and synthesis;
- daily timing and productivity loops.

### Free vs Premium Principle

Use this boundary consistently:

- **Free/Public = facts and basic utility.**
- **Premium = decisions and personalized strategy.**

### Job Posting Check Direction

Current implemented direction:

- Free users get 1 Full analysis per day.
- Free users get 30 Lite checks per day.
- Premium users get 10 Full analyses per day.
- Premium users get 30 Lite checks per day.
- Any successful new analysis consumes the matching Lite or Full quota.
- Reopening history or serving an unchanged cached result should not consume quota.
- Screenshot Full analysis consumes the same Full quota as URL Full analysis.
- Scan history is available to all users.
- Lite scan history remains Lite after a user upgrades; do not automatically backfill Lite scans into Full scans. A premium user can explicitly run a new Full analysis from a Lite history item, consuming Full quota.

Lite check should include:

- job title/company/location summary;
- occupation/SOC match when available;
- salary range or salary visibility state;
- market salary percentiles;
- job outlook/demand;
- required skills/qualifications;
- basic red flags and pay transparency notes;
- CareerOneStop attribution/logo when backed by CareerOneStop data.

Full analysis should include:

- compatibility score;
- AI replacement risk;
- opportunity ROI;
- natal/career fit breakdown;
- personalized tradeoffs;
- "should I apply?" verdict;
- negotiation angles;
- saved result/history;
- comparison workflows;
- screenshot fallback full scoring;
- deeper explanation and premium route tie-ins.

Result badges:

- Every scan result must carry `Lite` or `Full`.
- The badge appears on the result screen and in history.
- Full history entries always reopen as Full.
- Lite history entries reopen as Lite. If the user currently has premium, the old Lite result still shows only Lite content and can offer a `Run Full Analysis` action.

### Discover Roles Direction

Discover Roles should move from fit-only recommendations to fit + market recommendations.

Default ranking:

- Default view is `Best Fit`.
- Add a top segmented control/filter for ranking mode, including at least `Best Fit` and `Best Opportunity`.

Free layer:

- role title/domain;
- salary band;
- growth/outlook;
- annual openings or demand proxy;
- key skills/tools;
- market snapshot attribution.

Premium layer:

- personalized role ranking;
- fit + market opportunity synthesis;
- roadmap and skill priorities;
- saved shortlist;
- natal/profile-specific reasons and tradeoffs.

### Natal Chart Direction

Implementation status: active in app. Natal Chart now requests backend market career context after the chart is available and renders market-backed paths with salary ranges, gradients, and source attribution.

Market facts can appear inside the natal chart experience, but the raw facts must remain free where they are CareerOneStop-backed.

The natal chart should not be influenced by arbitrary job scans by default. Job scanner activity remains a neighboring utility unless a later opt-in feature explicitly lets users use saved scans as recommendation signals.

Current natal-market algorithm:

1. Build a trait/profile vector from the natal chart.
2. Derive several career vectors from that profile.
3. Map career vectors to role clusters and O*NET/SOC occupations.
4. Enrich those role clusters with salary ranges, outlook, demand, and skills.
5. Present the user's possible development paths with market gradients and salary ranges.

Free layer:

- market facts for roles shown in the chart/career sections;
- source attribution/logo.

Premium layer:

- personalized interpretation of which market paths fit the user's chart/profile;
- what to prioritize next;
- blind spots and tradeoffs;
- longer-term roadmap.

### Negotiation Prep Direction

Implementation status: active as a dashboard card plus free detail page. The page uses deterministic market-context guidance; premium personalized scripts, timing slots, and saved offer workflows remain later.

Free layer:

- general negotiation guidance based on market range;
- questions to ask recruiters;
- salary expectation framing;
- pay transparency red flags.
- baseline scripts and offer checklist.

Premium layer:

- personalized scripts;
- role-specific leverage points;
- follow-up templates;
- lucky/timing slots and calendar planning;
- offer comparison and decision support.

### Dashboard Direction

Dashboard can carry market-driven insight cards, but avoid turning it into a generic labor-market dashboard.

Decided dashboard candidate:

- Negotiation guidance card.
- Placement: near the bottom of free feature cards and above the first premium-gated card, which is currently the calendar/interview strategy area.
- Card opens the `NegotiationPrep` page; posting-specific checks route from that page to Scanner.

Other possible future candidates:

- daily/weekly negotiation prompt;
- market opportunity spotlight;
- saved role market movement;
- one free Full scan availability reminder;
- premium "compare saved roles" CTA.

## Technical Implementation Plan

### Phase 0: Access Validation

1. Keep final provider validation on a U.S.-hosted backend/staging environment because local non-U.S. access previously timed out.
2. Use CareerOneStop with server-side `Authorization: Bearer <token>` and `{userId}` in the endpoint path.
3. Use O*NET Web Services v2 with `https://api-v2.onetcenter.org` and server-side `X-API-Key`.
4. Record provider rate limits, attribution/logo requirements, and endpoint shapes before product rollout.

### Phase 1: Backend Market Data Foundation

Add a backend market-data integration layer.

Suggested modules:

- `src/services/marketData/careerOneStopClient.ts`
- `src/services/marketData/occupationInsight.ts`
- `src/routes/market.ts`

Suggested endpoint:

```text
GET /api/market/occupation-insight?keyword=<title-or-soc>&location=<state-or-us>
```

Response shape should normalize provider details into a stable Horojob contract:

```json
{
  "query": {
    "keyword": "Software Developer",
    "location": "US"
  },
  "occupation": {
    "onetCode": "15-1252.00",
    "title": "Software Developers",
    "description": "..."
  },
  "wages": {
    "currency": "USD",
    "period": "annual",
    "p10": 0,
    "p25": 0,
    "median": 0,
    "p75": 0,
    "p90": 0,
    "year": "2024"
  },
  "outlook": {
    "growthLabel": "Faster than average",
    "projectedOpenings": 0,
    "projectionYears": "2022-2032"
  },
  "skills": [],
  "source": {
    "provider": "CareerOneStop",
    "attributionText": "...",
    "logoRequired": true,
    "retrievedAt": "ISO"
  }
}
```

Implementation notes:

- Keep provider tokens server-side only.
- Add request timeout and stable error mapping.
- Cache responses to reduce provider load.
- Store only value-added/cache data needed by the app; do not build a standalone data redistribution surface.
- Include provider metadata and freshness timestamps in responses.
- Keep endpoint additive and versionable.

### Phase 2: Job Posting Check Lite + Full Split

Backend:

- Add scan depth semantics:
  - `lite`: parser + market enrichment + basic deterministic signals;
  - `full`: existing compatibility/risk/deep analysis path.
- Update limits from one generic scan counter to separate counters:
  - Free Lite checks: 30 per day;
  - Premium Lite checks: 30 per day;
  - Free Full checks: 1 per day;
  - Premium Full checks: 10 per day.
- Preserve compatibility for existing `/api/jobs/limits` until mobile migrates.
- Extend `/preflight` to return Full availability and Lite fallback availability.
- Extend scan responses with market insight blocks and source metadata.

Mobile:

- Scanner starts with Lite utility instead of hard blocking when Full quota is exhausted.
- Result screen shows market snapshot as unlocked.
- Full-only panels show locked previews when quota is exhausted:
  - compatibility;
  - AI risk;
  - opportunity ROI;
  - personalized negotiation angle;
  - saved compare/history.
- Copy should frame the upgrade around repeated Full analysis, not around access to public market facts.
- After the free Full quota is used, the next scan renders a Lite result with unlocked market data and blurred/glass premium panels.
- Premium upsell copy should balance two messages equally:
  - more Full analyses;
  - personalized decision support.

### Phase 3: Discover Roles Market Enrichment

Backend:

- Map existing role catalog entries to O*NET/SOC codes where possible.
- Add market fields to role recommendations/search results.
- Cache market enrichment by occupation/location/source version.

Mobile:

- Add market chips to role cards:
  - median pay;
  - outlook;
  - demand/openings;
  - key skill count or top skill.
- Add a market detail panel when a role is opened or checked.
- Keep natal fit score visually distinct from market score.

### Phase 4: Negotiation Prep

Status: implemented for the free baseline.

Backend:

- Added deterministic negotiation baseline from salary visibility and public market range in `/api/astrology/market-career-context`.
- Expanded payload includes anchor strategy, recruiter questions, baseline scripts, offer checklist, red flags, tradeoff levers, and next steps.
- Premium path can add personalized scripts via existing AI orchestration.

Mobile:

- Free dashboard/card guidance:
  - "Ask for range before the second interview";
  - "Use P75 as your anchor if your experience supports it";
  - "This posting does not disclose pay."
- The negotiation card belongs on the dashboard near the bottom of the free feature area, above the calendar/interview strategy premium section.
- Premium path:
  - scripts;
  - timing slots;
  - follow-ups;
  - saved offer notes.

### Phase 5: Full Career Blueprint + Dashboard Integration

Status: implemented for Full Career Blueprint market paths and dashboard Negotiation Prep.

Backend:

- Full natal generation receives compact market path context in the LLM prompt.
- Prompt guard requires that provider data is not framed as CareerOneStop/O*NET/provider endorsement.
- Keep AI guidance framed as career coaching, not financial prediction.

Mobile:

- Added market gradients section to Full Career Blueprint.
- Added dashboard Negotiation Prep card only as a clear next action.

## Scoring Weights

These are the product-approved starting weights for implementation. They can be tuned after real usage and quality review.

### Opportunity ROI

- Market opportunity: 35%
- Personal/natal fit: 30%
- Salary clarity and market pay: 15%
- Role clarity and application leverage: 10%
- AI replacement context: 5%
- Burnout/pressure context: 5%

Notes:

- Opportunity ROI should be slightly more important than pure personal fit.
- AI replacement and burnout/pressure should remain low-weight context, not primary decision drivers.
- Users should be able to interpret AI risk and burnout risk separately.

### Market Score

- Salary percentile strength: 35%
- Growth/openings: 30%
- Skill accessibility: 15%
- Location/remote flexibility: 10%
- Pay transparency: 10%

For early-career users, market demand should outweigh salary in narrative emphasis even if the numeric market score keeps the same base weights.

### Application Priority

- Personal fit: 35%
- Market upside: 30%
- Salary clarity: 15%
- AI risk context: 5%
- Burnout/pressure context: 5%
- Role clarity and application leverage: 10%

## Resolved Product Decisions

### Monetization

1. Free users get 1 Full analysis per day.
2. Any successful Full analysis consumes the Full quota, including screenshot Full analysis.
3. Lite checks are capped at 30 per day.
4. Premium users get 10 Full analyses per day and 30 Lite checks per day.
5. Scan history is available to all users.
6. Cache/history reopen does not consume quota.

### Scoring Weights

1. Opportunity ROI should slightly outweigh pure personal fit.
2. Missing posted salary should not be harshly penalized. Treat it as a negotiation opportunity and show a market estimate when role/location confidence is sufficient.
3. AI risk should have minimal score weight and remain a separate user-interpreted context signal.
4. Burnout/pressure should have minimal score weight and remain a separate context signal.
5. Market demand should matter strongly for early-career users and can outweigh salary in narrative emphasis.

### Product Surface

1. Market facts appear inside feature pages, not as a standalone dashboard data table.
2. Natal Chart can show market facts after deriving career vectors from the chart; arbitrary job searches do not influence natal recommendations by default.
3. Discover Roles defaults to `Best Fit` and adds a top ranking filter/segmented control.
4. Negotiation guidance gets a dashboard card near the bottom of free features, above the first premium calendar/interview strategy section.
5. Full Career Blueprint can include salary ranges/gradients for possible development paths.

### UI/UX

1. Lite result uses a full result screen with unlocked market data and locked premium panels.
2. Locked Full panels are blurred/glassmorphism blocks consistent with premium dashboard cards.
3. CareerOneStop attribution should be a screen footer, not repeated inside every card.
4. Market score should render as a label, not a numeric score.
5. Salary should render as a simple range for casual users, not percentile labels.
6. Missing salary should be framed as a negotiation opportunity.
7. Do not build deeper comparison tables in the first implementation.
8. Premium upsell should balance "more Full analyses" and "personalized decision support."

## Remaining Open Questions

1. Exact provider rate limits and any additional attribution/logo placement requirements after final provider/legal review.
2. Whether production hosting in the U.S. removes all CareerOneStop connectivity issues without support escalation.
3. Whether a future opt-in should allow saved job scans to influence Discover Roles or Natal Chart recommendations.

## Near-Term Action Items

1. [x] Implement one public no-login compliance surface in `../horojob-landing` at `app/market-tools/role-outlook/page.tsx`, backed by `GET /api/public/market/occupation-insight`.
2. [ ] Validate both providers again from U.S.-hosted backend/staging.
3. [ ] Record provider rate limits and attribution constraints.
4. [x] Define Lite vs Full response contracts using the resolved quota rules.
5. [x] Add backend market-data client and normalized occupation insight endpoint.
6. [x] Add mobile market snapshot UI component with attribution/logo support.
7. [x] Update Job Posting Check limit logic to support Lite + Full.
8. [x] Add scan `Lite`/`Full` badges in result and history.
9. [x] Add docs and tests for limit semantics, attribution, and source metadata.
