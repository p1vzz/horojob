# Discover Roles Single-Screen UX Plan
**Status:** In Progress (`current job` personalization now comes from Settings; two-tab layout, sectioned role detail stack, and market-tab comparison stack shipped)
**Last updated:** 2026-04-24

## Objective

Fit richer Discover Roles decision support into one mobile page without fragmenting the flow into several routes or overwhelming the user.

The screen should still feel like one coherent tool:

- discover roles;
- inspect one role deeply;
- compare realistic options;
- personalize the guidance when `current job` exists.

## Shipped In Current Build

- `current job` personalization sourced from `Settings -> Birth Details`
- two top-level tabs on the same screen: `Recommended For You` and `Market Opportunities`
- one selected-role stack on the same screen
- sectioned detail layout for:
  - `Why This Role Fits`
  - `Reality Check`
  - `Entry Barrier`
- inline `Transition Map`
- inline `Best Alternative`
- recommendation cards expand directly by tap
- market search rows add/open directly by tap and show a loader while role enrichment resolves
- market-tab comparison stack seeded from the union of `Best Fit` and `Best Opportunity`

## UX Constraints

- one primary screen only;
- search must stay inside `Market Opportunities` and open downward inline under the input;
- only one role can be deeply expanded at a time;
- comparison must stay compact and mobile-native;
- market facts and Horojob interpretation must stay visually distinct.

## Core Principle

`List for entry, detail for decisions.`

Recommendation cards stay scannable. The heavy content moves into a selected-role stack further down the same page.

## Recommended Screen Structure

### 1. Header

- screen title
- short one-line promise
- keep current back navigation pattern

### 2. Personalization Source

Purpose: keep `Discover Roles` focused on decisions while `Settings` owns the editable personal context.

Rules:

- `current job` should not render as another inline form at the top of `Discover Roles`;
- the screen can reference the user's current role in role copy, transition framing, and alternatives;
- editing happens in `Settings -> Birth Details`, under the stored profile data.

### 3. Top-Level Tabs

Keep two page-level tabs:

- `Recommended For You`
- `Market Opportunities`

`Recommended For You` holds ranking and recommendation browsing.

`Market Opportunities` holds search plus the removable comparison stack.

### 4. Ranking Control

Inside `Recommended For You`, keep the ranking segmented control:

- `Best Fit`
- `Best Opportunity`

Do not add more top-level ranking modes in this pass. Transition logic should appear inside the detail experience, not as another global segment.

### 5. Search

Search belongs only in `Market Opportunities`.

Recommended order near the top:

- market-tab header copy
- search field
- downward dropdown
- comparison stack

Search behavior:

- alias-aware and canonical-title aware;
- tapping a row should immediately add it into the market stack and open it;
- unresolved rows should show a loader inline while the score/detail payload is fetched.

### 6. Recommendation List

Purpose: quick scanning and entry into detail.

Recommendation cards should keep:

- title/domain;
- score;
- short description;
- compact market snippet;
- tags.

Recommendation cards should not grow to contain:

- long task lists;
- full transition mapping;
- compare content.

### 7. Selected Role Detail Stack

This is the center of the upgraded feature.

When a role is opened, render one inline stack beneath the list.

Recommended order:

#### A. Summary Ribbon

- fit score
- market signal
- entry barrier label
- save/remove action
- compare CTA when applicable

This top strip should answer: `Is this attractive, realistic, and worth keeping?`

#### B. Why This Role Fits

- always visible by default
- 2-3 short bullets or chips
- should connect natal/profile signal to role characteristics in plain language

This section becomes the default explanation layer replacing a single vague reason sentence.

#### C. Reality Check

- collapsible section
- key tasks
- work context
- tools/technology themes
- short `what this work feels like` summary

This section protects the feature from becoming pure fantasy/recommendation theater.

#### D. Entry Barrier

- collapsible section
- preparation level
- education/training intensity
- switching difficulty
- optional credential/licensing note

Use a compact status label plus one explanatory paragraph, not a dense matrix.

#### E. Transition Map

- collapsible section
- maximum three path cards
- recommended labels:
  - `Best Match`
  - `Easier Entry`
  - `Faster Payoff`

If `current job` is present, this section should explicitly frame the transition from that role.
If not present, it should frame paths from the user's overall profile.

#### F. Best Alternative

- compact card, ideally adjacent to or below the transition map
- show only one alternative by default
- explain why this may be a better bet than the selected role

### 8. Market Comparison Stack

The market tab is now the comparison tray for the current session.

Recommended behavior:

- seed the stack from the union of `Best Fit` and `Best Opportunity`;
- allow removals without touching the saved shortlist;
- allow search rows to prepend into the same stack;
- reset this stack when the screen is reopened.

## Progressive Disclosure Rules

- one deep role open at a time;
- one or two heavy subsections expanded at a time;
- long supporting content must stay behind accordions or concise cards;
- search mode should suppress detail clutter until the user chooses a role.

## Empty and Edge States

### No Natal Chart / No Recommendations

- keep current defensive onboarding-sync behavior;
- empty state should still offer search.

### No Current Job

- no penalty or blocker;
- transition copy falls back to general profile guidance.

### No Market Data

- role detail still renders;
- `Why This Role Fits`, `Reality Check`, and `Entry Barrier` should not depend on market enrichment.

### No Compare Candidates

- shortlist remains save-only and separate from on-screen comparison;
- market comparison can still work with one role, but becomes more useful as the stack grows.

## Copy Guidelines

- keep provider-backed facts clearly separated from Horojob interpretation;
- use decisive but non-overclaiming language;
- prefer action language like `easier to enter`, `more training-heavy`, `closer to your current work`.

Avoid:

- provider endorsement implications;
- giant paragraphs;
- internal taxonomy jargon without translation.

## Interaction Notes

- tapping a recommendation or market-stack role should open/close its inline detail stack immediately;
- changing ranking mode should preserve the current personalization context;
- changing `current job` should refresh the affected guidance, not reset the whole screen visually if avoidable.

## Visual Density Guidelines

- top of screen must remain calm; do not stack too many banners before the recommendations;
- selected-role stack should feel like one premium analysis card with internal sections, not seven unrelated blocks;
- compact chips and short labels are preferred over extra decorative elements;
- use emphasis for only a few metrics per section.

## Recommended Implementation Sequence

### UX Slice 1

- shipped:
  - settings-owned `current job` personalization source
  - current list + selected-role pattern preserved

### UX Slice 2

- shipped:
  - `RoleDetailPanel` redesigned into a sectioned single-stack layout
- add `Why This Role Fits`, `Reality Check`, `Entry Barrier`.

### UX Slice 3

- shipped:
  - `Transition Map`
  - `Best Alternative`
- shortlist compare staging remains for the next slice.

### UX Slice 4

- shipped:
  - two top-level tabs
  - market-tab search/dropdown
  - removable market comparison stack
- scroll/focus polish can continue as follow-up cleanup, but the one-screen market compare flow is now live.

## Documentation and Test Hooks

When implementation starts, update:

- `docs/discover-roles-feature.md`
- `docs/discover-roles-expansion-plan.md`
- `docs/release-smoke-master-checklist.md`

Add tests for:

- empty vs populated `current job`-aware copy state
- selected role detail section visibility
- search result flowing into the market stack with loading state
- market comparison stack rendering and removal
- fallback rendering when market data is missing
