# Public Web Market Surface Plan
**Status:** Implemented
**Primary implementation repo:** `../horojob-landing`
**Linked repos:** `horojob`, `../horojob-server`
**Recorded on:** 2026-04-25

## Objective

Implement the minimal public, free, no-login website surface required for CareerOneStop-backed Web API compliance without rebuilding the full mobile product on the web.

This website surface should:

- satisfy the provider requirement with one public web tool;
- expose raw market facts in a compliant, attribution-safe way;
- leave personalized interpretation, astrology, saved workflows, and premium depth in the mobile app.

## Provider Constraint Summary

Based on the recorded CareerOneStop clarification:

- one public website/tool is sufficient;
- the same provider-backed data may also appear in the mobile app;
- mobile app screens may require login if the website version exists publicly for free;
- logo should be shown on pages containing the tool, but lack of fit is acceptable;
- raw public data must remain free.

## Current `horojob-landing` Snapshot

The current repository is a generated Next.js landing site with:

- Next.js `app` router;
- single main route in [../horojob-landing/app/page.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/app/page.tsx);
- one additional policy route in [../horojob-landing/app/privacy-policy/page.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/app/privacy-policy/page.tsx);
- shared landing composition via:
  - [../horojob-landing/components/landing/header.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/header.tsx)
  - [../horojob-landing/components/landing/footer.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/footer.tsx)
  - [../horojob-landing/components/landing/hero-section.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/hero-section.tsx)
- a large pre-generated `components/ui/*` set from v0 that should be reused rather than re-platformed for this slice.

Current implementation:

- public tool page: [../horojob-landing/app/market-tools/role-outlook/page.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/app/market-tools/role-outlook/page.tsx)
- landing composition shell: [../horojob-landing/components/market-tools/role-outlook-shell.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/role-outlook-shell.tsx)
- server-side fetch/parsing: [../horojob-landing/lib/market-tool.ts](C:/Users/p1vzz/WebstormProjects/horojob-landing/lib/market-tool.ts)
- provider footer/logos: [../horojob-landing/components/market-tools/market-source-footer.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/market-source-footer.tsx)
- public backend contract: [../horojob-server/src/routes/publicMarket.ts](C:/Users/p1vzz/WebstormProjects/horojob-server/src/routes/publicMarket.ts)
- required envs: [../horojob-landing/.env.example](C:/Users/p1vzz/WebstormProjects/horojob-landing/.env.example)

Planning assumption:

- do not refactor the landing foundation first;
- add the public tool as an isolated route and a small set of new components inside the current codebase.

## Recommended Compliance Surface

Use one focused route:

- `app/market-tools/role-outlook/page.tsx`

This page should be public, indexable if desired, and reachable from the main landing header/footer.

Minimum user flow:

1. user lands on the public tool page;
2. user enters role keyword and optional location;
3. user gets factual market output;
4. page shows provider attribution and logos;
5. page links to the mobile app for personalized guidance.

## Scope For V1

### Must Ship

- public route with no auth and no paywall
- role keyword input
- location input with default `US`
- market facts:
  - salary range / median when available
  - outlook / growth label
  - openings / demand
  - top skills / tools when available
- CareerOneStop and O*NET attribution/footer
- CTA into Horojob mobile app

### Must Not Be Required For V1

- natal chart personalization
- login
- saved roles
- compare workflows
- premium upsell gates on provider facts
- full parity with mobile Discover Roles / Scanner / Negotiation surfaces

## Current-Codebase Implementation Strategy

### Slice 1. Route Foundation In `horojob-landing`

Add a dedicated public route instead of overloading the landing homepage.

Recommended files:

- `app/market-tools/role-outlook/page.tsx`
- `components/market-tools/role-outlook-shell.tsx`
- `components/market-tools/role-outlook-form.tsx`
- `components/market-tools/role-outlook-result.tsx`
- `components/market-tools/market-source-footer.tsx`

Reuse:

- existing `components/ui/*`
- current `app/layout.tsx`
- current landing header/footer composition

Header/footer changes:

- add a nav entry to the public tool from [../horojob-landing/components/landing/header.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/header.tsx);
- add the same route in [../horojob-landing/components/landing/footer.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/footer.tsx).

### Slice 2. Public Result Model

Keep the tool factual and compact.

Recommended page sections:

1. hero / purpose line
2. form block
3. loading / empty / error state
4. result card
5. attribution footer
6. CTA into app

Recommended result fields:

- occupation title
- salary band / median
- market label
- openings / demand
- growth label
- top skills
- source retrieval note

### Slice 3. Backend Integration

Do not call CareerOneStop/O*NET directly from `horojob-landing`.

Use `../horojob-server` as the only provider owner.

Recommended backend shape:

- either expose one public-safe route such as `GET /api/public/market/occupation-insight`
- or expose a public-safe web surface route that wraps the normalized market response already used by mobile

Requirements:

- no provider credentials in the landing repo
- same normalized source attribution model as mobile
- public endpoint must allow anonymous access
- responses should be cached server-side to protect provider limits

### Slice 4. Compliance Treatment

On the public tool page:

- show CareerOneStop and O*NET attribution in a dedicated footer block;
- keep provider facts visually separate from Horojob marketing copy;
- avoid wording that implies provider endorsement;
- keep the tool itself free and accessible without login.

### Slice 5. Mobile/App Linkage

The web tool should deliberately hand off to the app for value-add.

Recommended CTA framing:

- `Get personalized career guidance in the HoroJob app`
- `See how this role fits your profile in the app`

Do not gate the raw public facts behind that CTA.

## Concrete File-Level Plan For `horojob-landing`

### Main Additions

- [../horojob-landing/app/market-tools/role-outlook/page.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/app/market-tools/role-outlook/page.tsx)
  Create the public page entry.
- [../horojob-landing/components/market-tools/role-outlook-shell.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/role-outlook-shell.tsx)
  Own page composition and async states.
- [../horojob-landing/components/market-tools/role-outlook-form.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/role-outlook-form.tsx)
  Collect keyword/location.
- [../horojob-landing/components/market-tools/role-outlook-result.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/role-outlook-result.tsx)
  Render normalized market response.
- [../horojob-landing/components/market-tools/market-source-footer.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/market-tools/market-source-footer.tsx)
  Web-specific attribution/footer block with required provider treatment.

### Existing Files To Extend

- [../horojob-landing/components/landing/header.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/header.tsx)
  Add route link.
- [../horojob-landing/components/landing/footer.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/components/landing/footer.tsx)
  Add route link.
- [../horojob-landing/app/layout.tsx](C:/Users/p1vzz/WebstormProjects/horojob-landing/app/layout.tsx)
  Update metadata/title if needed for tool discoverability.

## Documentation Linkage Requirement

When the public tool is implemented, record it in:

- `horojob/docs/specs.md`
- `horojob/docs/market-driven-career-intelligence-plan.md`
- `horojob/docs/market-driven-technical-implementation-plan.md`
- `../horojob-server/docs/backend-api-runtime-map.md`
- `../horojob-server/docs/market-api-contract.md`
- `../horojob-landing/README.md` or a landing-local docs folder

Minimum linkage facts to keep synced:

- route path
- backend public endpoint path
- attribution/footer rules
- provider logo treatment
- whether the page is the official compliance surface

## Validation And Smoke

Before calling this compliant:

1. open the route without login in a clean browser
2. confirm provider-backed facts render publicly for free
3. confirm attribution/logo block is visible
4. confirm CTA into app does not gate the facts
5. re-run from U.S.-hosted staging

## Recommended Order

1. [x] document repo linkage and provider clarification
2. [x] add public route + nav link in `horojob-landing`
3. [x] add public-safe backend endpoint in `horojob-server`
4. [x] connect landing form to backend normalized response
5. [x] add attribution/footer and CTA treatment
6. [ ] run public smoke and staging validation
