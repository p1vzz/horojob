# AGENTS.md

## Purpose

This repository contains the Horojob mobile client (Expo + React Native).

Backend API lives in:

../horojob-server

Changes in this repo should modify mobile behavior only, unless the user explicitly asks for coordinated backend work.

---

## Current project layout

horojob/
App.tsx (root providers + stack navigation)
src/
components/
screens/
services/
utils/
theme/
config/
navigation/ (reserved, currently empty)
hooks/ (shared reusable feature hooks)
docs/
specs.md
documentation-audit-2026-03-29.md
app-startup-and-session-lifecycle.md
navigation-map.md
release-smoke-master-checklist.md
onboarding-flow-and-city-search.md
theme-system.md
skills-usage-log.md
dev-tooling-status.md
device-android-session-playbook.md
job-position-check-feature.md
job-position-check-smoke-checklist.md
job-scraping-operations-policy.md
job-scraping-fixtures.md

Backend repository:

../horojob-server

This project is not a monorepo.

---

## Runtime and scripts

- Node engine: `>=22 <23`
- Available scripts:
  - `npm run start`
  - `npm run android`
  - `npm run ios`
  - `npm run web`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run test:rntl`
  - `npm run coverage`
  - `npm run coverage:core`
  - `npm run coverage:rntl`
  - `npm run verify`
- This repo currently has no dedicated lint script.

---

## Local skills routing

Project-local skills in this repo:

- `skills/react-native/SKILL.md`
- `skills/api-client-contracts/SKILL.md`
- `skills/mobile-server-contract-sync/SKILL.md`
- `skills/theme-system/SKILL.md`
- `skills/expo-runtime-debug/SKILL.md`
- `skills/android-widget-ops/SKILL.md`
- `skills/release-smoke-checks/SKILL.md`
- `skills/testing-quality/SKILL.md`

Routing rules:

- use `react-native` for screens/components/hooks/navigation/UI behavior/performance tasks
- use `api-client-contracts` for `src/services/*` request-response mapping, DTO parsing, and compatibility with backend payload changes
- use `mobile-server-contract-sync` when a task spans this repo and `../horojob-server` together, especially `src/services/*`, `../horojob-server/src/routes/*`, DTO parsing, contract docs, or smoke checklists that must stay in sync
- use `theme-system` for light/dark theme tokens, theme-mode switching, color migration, and widget palette parity
- use `expo-runtime-debug` for Metro resolver failures, runtime crashes, require cycles, and native module wiring/debug
- use `android-widget-ops` for Android widget provider, RemoteViews layout/drawable/color, and widget scheduling behavior
- use `release-smoke-checks` for pre-release validation and regression smoke runs
- use `testing-quality` for unit/integration test additions, regression coverage for changed behavior, and `npm run verify` validation
- if `mobile-server-contract-sync` and `api-client-contracts` both apply: start with `mobile-server-contract-sync` for the shared boundary, then `api-client-contracts` for mobile-side mapping
- if both apply in one task: start with `api-client-contracts` for transport mapping, then `react-native` for screen integration
- if `theme-system` and `react-native` both apply: start with `theme-system` token/palette mapping, then `react-native` screen integration
- if runtime debugging and feature work both apply: start with `expo-runtime-debug`, then feature skill (`react-native`, `theme-system`, or `api-client-contracts`)
- if implementation and tests are both requested: apply feature skill first, then `testing-quality`
- if widget visuals are touched: combine `theme-system` (palette intent) with `android-widget-ops` (Android resource/provider implementation)
- if release sign-off is requested: execute implementation skills first, then `release-smoke-checks` last

Coordination with system-level skills:

- if a system-level skill is available in the current session and explicitly requested by user, use it
- if system-level skills are unavailable, continue with local skills and repository docs
- for implementation details inside this repo, local skills take precedence over generic guidance when rules conflict

---

## Skill usage tracking

- For each non-trivial task, append one row to `docs/skills-usage-log.md`.
- Minimum columns: date, task summary, primary skill, secondary skills, outcome.
- Recommended command:
  - `npm run skills:log -- "<task_summary>" "<primary_skill>" "<secondary_skills>" "<outcome>"`
- Use this log as the source for monthly routing and effectiveness review.

---

## Source of truth order

1. explicit user instructions
2. this file
3. `docs/theme-system.md` for theming architecture and mandatory theming rules
4. `docs/job-position-check-feature.md` for current scan behavior
5. `docs/specs.md` for product context (roadmap sections may be outdated)
6. backend route contracts in `../horojob-server/src/routes/*.ts`
7. existing implementation patterns

When docs conflict with shipped code/contracts, prefer shipped code and update docs.

---

## Architecture reality (current)

- Root stack navigation is declared in `App.tsx`.
- Screen modules are feature-oriented and currently can be large/stateful.
- HTTP calls should be implemented in `src/services/*` and consumed by screens/components.
- Session/auth transport lives in `src/services/authSession.ts`.
- Local persistence and per-user caches live in `src/utils/*Storage.ts`.
- Theme tokens live in `src/theme` and API base URL config in `src/config/api.ts`.
- Theme mode state is provided by `src/theme/ThemeModeProviderImpl.tsx`.

---

## Theme system rules (mandatory)

- Use `useThemeMode` or `useAppTheme` in screens/components. Do not add new direct imports of mutable legacy `theme`.
- Add missing colors as semantic token pairs in `src/theme/index.ts` (`dark` + `light`) instead of hardcoded one-off literals.
- Keep feature-local palettes explicit and dual-mode (`DARK_*` and `LIGHT_*` constants in the same module) when tokens are too generic.
- Do not introduce global runtime color inversion/preprocessors.
- Keep theme toggle behavior in settings wired through `setMode('light' | 'dark')`.
- For Android widget theme changes, update both:
  - `android/app/src/main/res/values/colors.xml`
  - `android/app/src/main/res/values-night/colors.xml`

---

## Change rules

Prefer:

- small, focused diffs
- preserving current route names and screen params
- reusing existing `services` and `utils`
- additive API integration changes

Avoid:

- direct `fetch` logic inside screens/components (put HTTP code in `services`)
- cross-repo API contract changes without documenting required backend updates
- broad folder refactors unless explicitly requested

---

## API contract discipline

- Treat backend responses as contracts.
- If endpoint response shape changes, update:
  - `src/services/*` types/parsers
  - affected screens/components
  - `docs/job-position-check-feature.md` when behavior changes
- Do not rely on undocumented fields.

---

## Validation checklist for non-trivial changes

1. Launch app (`npm run start`) and verify touched flow.
2. For API features, verify request/response path against `../horojob-server/src/routes`.
3. Run targeted smoke steps from `docs/job-position-check-smoke-checklist.md` when scanner flow is affected.

---

## Expected outcome

- Requested mobile behavior works.
- API contracts stay stable or are explicitly coordinated with backend.
- Diff remains small and reviewable.
