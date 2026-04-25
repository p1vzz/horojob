# Discover Roles Expansion Plan
**Status:** In Progress (`current job`, deep role detail, decision support, and compare shipped; catalog/search upgrades remain)
**Last updated:** 2026-04-24

## Product Decisions

- Compliance/public-web work is deferred and not part of this plan.
- `Local Opportunity` is intentionally out of scope for this Discover Roles expansion.
- Personalization should not depend on scanner history or saved scans.
- Discover Roles will instead consume an optional `current job` user field from the shared profile/settings surface so the same signal can later personalize other career features.

## Goal

Turn Discover Roles from a ranked recommendation list into a compact career decision tool that answers:

- what roles fit me;
- what those roles are actually like;
- how hard they are to enter;
- what realistic alternatives exist;
- how my current job changes the recommendation.

## In Scope

- `Why This Role Fits`
- `Role Reality Check`
- `Entry Barrier`
- `Best Alternative`
- `Transition Map`
- `Compare Roles`
- better search and canonical role mapping
- optional `current job` personalization

## Out of Scope

- `Local Opportunity`
- scanner-linked personalization
- public web/compliance changes
- broad multi-screen redesign of Discover Roles into several routes

## Recommended Product Shape

Keep the screen centered on one selected role at a time.

The recommendation list remains the entry point, but the value should shift toward an inline deep-dive stack with:

- summary snapshot;
- why it fits;
- role reality;
- entry barrier;
- transition choices;
- alternative role;
- shortlist/compare actions.

This keeps the feature aligned with its purpose: choose a path, not browse an encyclopedia.

## Workstreams

### 1. Catalog and Search Quality

Goal: make search and recommendations feel current and canonical without losing human-readable titles.

Planned changes:

- refresh the backend role catalog from O*NET taxonomy inputs more systematically instead of relying only on the current static seed;
- keep the manual overlay for product-friendly roles such as `Product Manager`, `AI Engineer`, `Full Stack Engineer`, and similar titles that do not map cleanly to a single official occupation;
- expand aliases and alternate titles so search understands modern job-market language;
- preserve one canonical display role per card, but keep O*NET/SOC linkage underneath for enrichment and transitions.

Backend touchpoints:

- `../horojob-server/src/services/discoverRoles.ts`
- `../horojob-server/src/db/mongo.ts`
- `../horojob-server/src/services/astrology/astrologyDiscoverRolesRoutes.ts`
- `../horojob-server/docs/market-api-contract.md` if new market-backed role fields are returned

### 2. Optional `Current Job` Signal

Goal: personalize transition guidance without coupling Discover Roles to scanner activity.

Recommended shape:

- add an optional profile/preference field such as `currentJobTitle`;
- edit it from `Settings`, under birth/profile details, instead of adding another inline form to `Discover Roles`;
- optionally enrich it later into canonical fields like `currentJobSlug` or `currentJobOnetCode` after backend normalization.

Behavior when present:

- recommendation copy can mention transitions from the user's current role;
- `Best Alternative` can explain a more realistic adjacent role;
- `Transition Map` can anchor paths around the current role rather than only around natal/profile fit.

Behavior when absent:

- Discover Roles remains fully usable and defaults to fit + market reasoning.

Recommended contract approach:

- keep `GET /api/astrology/discover-roles` backward-compatible;
- store the current-job signal in shared user profile state and let the route consume it server-side by default;
- add an override request field only if product later needs temporary experimentation.

Preferred path:

- persist the field in user/profile state and let the route consume it automatically, with an override only if product later needs experimentation.

### 3. Role Detail Enrichment

Goal: make each opened role card useful enough to support a decision.

Planned detail modules:

- `Why This Role Fits`
  - deeper reasoning from traits, skills, work styles, and related descriptors
- `Role Reality Check`
  - typical tasks
  - work context
  - tools/technology themes
  - what the work feels like day to day
- `Entry Barrier`
  - preparation level / job zone
  - education/training intensity
  - licensing or credential complexity when available
  - a single plain-language barrier label
- `Best Alternative`
  - one nearby role when the primary recommendation has weaker opportunity or a higher barrier
- `Transition Map`
  - up to three bounded paths
  - suggested framing: `Best Match`, `Easier Entry`, `Faster Payoff`

Important constraint:

- list cards should stay compact; deep content belongs in the selected-role panel, not on every recommendation row.

### 4. Compare Roles

Goal: help the user choose between realistic options without leaving the screen.

Planned behavior:

- continue using shortlist as the save/staging surface;
- let the user compare a small number of roles, ideally two at a time for clarity on mobile;
- compare fit, market signal, entry barrier, day-to-day profile, and transition framing in one compact stacked comparison module.

Do not build:

- a wide desktop-style matrix;
- a separate wizard flow for compare.

### 5. Single-Screen UX Refactor

Goal: fit the new decision-support layers into one mobile screen without turning it into noise.

Primary UX rule:

- only one deep role should be expanded at a time.

Implementation should follow:

- `docs/discover-roles-single-screen-ux-plan.md`

### 6. Documentation

Mobile docs to update when implementation starts:

- `docs/specs.md`
- `docs/discover-roles-feature.md`
- `docs/release-smoke-master-checklist.md`

Backend docs likely to update:

- `../horojob-server/docs/backend-api-runtime-map.md`
- `../horojob-server/docs/market-api-contract.md`
- any route-specific discover roles contract doc added during implementation

## Delivery Order

### Slice 1. Foundations

- define final product scope and contract additions;
- improve canonical role mapping and aliases;
- add optional `current job` storage on the shared profile and expose its edit entry point in `Settings`;
- update docs before behavior diverges.

### Slice 2. Deep Role Detail

- ship `Why This Role Fits`;
- ship `Role Reality Check`;
- ship `Entry Barrier`;
- keep list cards mostly unchanged and concentrate richness in the selected-role panel.

### Slice 3. Decision Support

- shipped:
  - `Best Alternative`
  - `Transition Map`
  - `current job`-aware transition framing and alternative-role copy

### Slice 4. Compare

- shipped:
  - shortlist upgraded into compare staging
  - inline two-role compare module on the same screen
  - compare stays intentionally compact and mobile-first

## Testing Plan

### Mobile

- service contract tests for any new discover-role payload fields in `src/services/astrologyApi.test.ts`;
- parser normalization tests for optional/null role-insight fields;
- RNTL coverage for:
  - guidance with and without stored `current job`;
  - selected-role detail expansion;
  - compare-ready shortlist state;
  - search result opening into the same detail panel.

Likely touchpoints:

- `src/services/astrologyApiCore.ts`
- `src/services/astrologyApi.test.ts`
- `src/screens/DiscoverRolesScreen.tsx`
- `src/screens/*.rntl.test.tsx` or a new Discover Roles screen test file

### Backend

- route tests for additive discover-role response fields;
- service tests for canonical mapping, transition selection, and fallback behavior when current job is absent;
- backward-compat checks so older mobile builds keep working if rollout overlaps.

Likely touchpoints:

- `../horojob-server/src/routes/astrology.test.ts`
- `../horojob-server/src/services/discoverRoles.test.ts`

### Smoke / QA

- verify `Best Fit` and `Best Opportunity` still switch cleanly;
- verify market attribution stays attached only to market blocks;
- verify `current job` changes guidance copy but does not block the screen when empty;
- verify search, shortlist, and compare all still function in one pass.

## Success Criteria

- the user can understand why a role is recommended without reading several cards;
- the user can judge realism, not only desirability;
- the user can compare at least two roles without navigating away;
- adding `current job` meaningfully changes transition guidance but does not become mandatory;
- Discover Roles remains a single-screen mobile flow rather than a mini-app inside the app.
