# Discover Roles
**Status:** Active (market-enriched mobile + backend contract integrated; two-tab single-screen decision stack shipped)

## Scope

- Screen: `DiscoverRoles`
- API: `GET /api/astrology/discover-roles`
- Data source: curated O*NET role catalog + manual general role extensions
- Market enrichment: recommendations can include U.S. labor-market facts and market scoring from CareerOneStop/O*NET. Provider smoke checks pass from a U.S. VPN path; validate again from U.S.-hosted staging before rollout. See `docs/market-driven-career-intelligence-plan.md`.

## Mobile Readiness

- `DashboardScreen` preloads the natal chart with `syncNatalChartCache()` while the dashboard readiness gate is visible.
- This moves first-time natal chart generation before the user opens `Career Matchmaker`, so `DiscoverRoles` can normally read the required chart from backend storage.
- `DiscoverRolesScreen` still handles direct entry defensively: if `/discover-roles` returns `Natal chart not found`, the screen runs the same natal chart sync once and retries the recommendation request.
- If sync cannot prepare a chart, the screen shows user-facing copy instead of the raw backend instruction to generate a natal chart manually.
- The screen now has two top-level tabs:
  - `Recommended For You`
  - `Market Opportunities`
- `Recommended For You` keeps the recommendation-specific segmented control:
  - `Best Fit`
  - `Best Opportunity`
- Search now lives only inside `Market Opportunities`.
- Search uses deferred scoring:
  - the first search request passes `deferSearchScores=true`, so results render without match percentages
  - tapping any search row immediately adds that role into the market stack and opens it inline
  - if the row still needs scoring/enrichment, the inline role slot shows a loader while the backend resolves `scoreSlug=<role-slug>`
- The market-search dropdown now opens downward inline under the input instead of as an upward overlay.
- `Best Fit` keeps the chart/profile fit ranking as the default.
- `Best Opportunity` re-ranks a bounded candidate pool by market opportunity blended with personal fit.
- Search does not request market data for every keystroke; it enriches only the tapped row to protect provider limits and latency.
- The screen now consumes an optional persisted `current job` field from the shared birth-profile/settings surface.
- `Current job` is stored on the same user profile document as birth data for broader personalization, but it remains outside `profileHash` and does not participate in birth-profile edit locks or recalculation rules.
- When present, recommendation reason copy becomes lightly personalized around the user's current work; ranking remains unchanged in this slice.
- Opening a recommendation or market-stack role now renders a sectioned inline detail stack with:
  - `Why This Role Fits`
  - `Reality Check`
  - `Entry Barrier`
  - `Transition Map`
  - `Best Alternative`
  - compact market/salary/demand facts plus skills/tools when available
- `Market Opportunities` now acts as the lightweight compare surface for the current session:
  - it is pre-seeded with the union of `Best Fit` and `Best Opportunity` roles
  - search selections are added into the same stack
  - roles can be removed locally
  - this comparison stack resets when the user leaves and re-enters the screen

## Backend Storage

### `discover_role_catalog`

Role dictionary used by recommendations and search.

Fields:

- `slug` (unique)
- `title`
- `domain`
- `majorGroup` (SOC major group prefix when available)
- `onetCode` (unique when present)
- `source` (`onetonline` | `manual`)
- `sourceUrl`
- `aliases[]`
- `keywords[]`
- `tags[]`
- `traitWeights` (`analytical`, `creative`, `leadership`, `technical`, `people`, `business`, `operations`, `detail`, `research`, `communication`)
- `active`
- `createdAt`, `updatedAt`

Indexes:

- unique: `slug`
- unique partial: `onetCode` (only string values)
- query helpers: `(active, title)`, `(domain, title)`

### `discover_role_recommendations`

Per-user cached recommendation snapshots by profile and algorithm version.

Fields:

- `userId`
- `profileHash`
- `algorithmVersion`
- `traitProfile` (same 10 trait vector)
- `signals[]`
- `recommended[]` (`roleSlug`, `score`, `reason`, `tags[]`)
- `generatedAt`
- `createdAt`, `updatedAt`

Indexes:

- unique: `(userId, profileHash, algorithmVersion)`
- helper: `(userId, updatedAt desc)`

### `birth_profiles.currentJobTitle`

Optional user-level current-role anchor stored alongside birth profile data.

Fields:

- `currentJobTitle`
- `currentJobUpdatedAt`

Notes:

- kept on the shared profile so other personalized career surfaces can reuse it;
- excluded from `profileHash`;
- excluded from birth-profile edit-lock/recalculation rules.

## Recommendation Algorithm (v2)

1. Build user trait vector from natal chart:
   - ASC/MC sign bonuses
   - house activity bonuses
   - planet placement bonuses
2. Normalize trait vector.
3. Compute role fit score as weighted dot product between user traits and `roleCatalog.traitWeights`.
4. Produce:
   - top `recommended` roles (score + reason + tags)
   - `search` roles for query (runtime match ranking + same score model)

Notes:

- Dropdown data is computed in runtime from `discover_role_catalog`; no separate dropdown table is used.
- Recommendations are cached in `discover_role_recommendations` and can be refreshed with `refresh=true`.
- Search role scores are deterministic and are intentionally not cached client-side.

## Market Enrichment Contract

`GET /api/astrology/discover-roles` accepts:

- `rankingMode=fit | opportunity`, default `fit`.

Response additions:

- top-level `rankingMode`;
- top-level `context.currentJob` (optional persisted current-role anchor with best-effort catalog match, sourced from the shared profile/settings field);
- `recommended[].market` (`OccupationInsightResponse | null`);
- `recommended[].detail` (`DiscoverRoleDetail | null`);
- `recommended[].opportunityScore`;
- `search[].market` (`OccupationInsightResponse | null`);
- `search[].detail` (`DiscoverRoleDetail | null`);
- `search[].opportunityScore | null`.

Behavior:

- Market enrichment failure does not fail Discover Roles; role cards still render with fit-only data.
- Recommended cards show compact salary/demand/market labels when market data is present.
- A source footer appears when visible recommendations or the visible market stack/search results contain provider-backed market data.
- Provider attribution stays attached to market facts only, not to Horojob fit reasoning.
- Tapping a recommended role opens an inline role detail panel with:
  - a compact summary ribbon (`fit`, `market`, `entry barrier`)
  - `Why This Role Fits`
  - `Reality Check`
  - `Entry Barrier`
  - `Transition Map` with bounded adjacent path cards
  - `Best Alternative` when there is a more practical nearby bet
  - market score, salary estimate, demand, skills, and tools
- Search rows on the market tab open the same detail panel by tap; no extra `Check` button remains in the UI.
- Users can save roles to a per-user shortlist that now syncs through the backend for cross-device compare, with AsyncStorage kept as migration/fallback cache.
- Shortlist entries now preserve the same `detail` snapshot so saved roles reopen with the same depth as fresh recommendations/search rows.
- The shortlist remains a cross-device saved-role list, while on-screen comparison now happens through the local market stack instead of a saved-role pair picker.

## Remaining Market Backlog

Discover Roles should evolve from fit-only recommendations to fit + market recommendations.

Implemented free market fields:

- salary band or percentile summary;
- growth/outlook;
- annual openings or demand proxy;
- source metadata and attribution.

Still planned:

- deeper role-market synthesis for premium surfaces;

Premium value-added fields:

- personalized role-market synthesis;
- fit + opportunity ranking;
- roadmap and skill priorities;
- deeper saved shortlist and comparison synthesis;
- natal/profile-specific tradeoffs.

Ranking decision:

- default recommendations use `Best Fit`;
- add a top segmented control/filter for ranking mode, including at least `Best Fit` and `Best Opportunity`.

## Planned Expansion Direction

Discover Roles should evolve from a recommendation list into a compact decision-support screen that helps the user choose a realistic next role without leaving the page.

Shipped expansion slices:

- `current job` persisted personalization anchor, edited from `Settings`
- `Why This Role Fits`
- `Role Reality Check`
- `Entry Barrier`
- `Transition Map`
- `Best Alternative`
- market-tab comparison stack seeded from `Best Fit` + `Best Opportunity`
- sectioned single-screen selected-role stack

Still planned:

- Better search and canonical role mapping using O*NET taxonomy/alternate titles plus the existing manual overlay for product-friendly titles.

Personalization rule:

- Discover Roles now accepts an optional persisted `current job` user field from `Settings -> Birth Details` that changes copy and will later expand into stronger transition framing and alternative-role guidance.
- This signal is not derived from scanner history or saved job scans; scanner remains a separate tool.

Explicitly deferred from this expansion:

- `Local Opportunity` / location-first opportunity ranking.
- Any coupling between Discover Roles and scanner history.
- Compliance/public-web work tracked elsewhere.

Planning docs:

- implementation roadmap: `docs/discover-roles-expansion-plan.md`
- single-screen UX/layout plan: `docs/discover-roles-single-screen-ux-plan.md`
