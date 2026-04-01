# Documentation Audit (2026-03-29)

## Scope

Audit of `docs/*` against current mobile implementation in this repository.

## Executive Summary

- Core feature docs are mostly present and useful.
- Main stale artifact was `docs/specs.md` (roadmap and diagram), now updated in this audit pass.
- RevenueCat and widget operational docs had outdated status text and are now synchronized.
- Biggest remaining gaps are not feature specs, but cross-cutting operational docs (navigation map, auth/session lifecycle, and release checklist unification).

## Coverage Matrix

| Area | Doc coverage | Implementation coverage | Assessment |
| --- | --- | --- | --- |
| Core app blueprint | `docs/specs.md` | `App.tsx`, `src/screens/*`, `src/services/*` | Updated in this pass; now aligned |
| Theme system | `docs/theme-system.md` | `src/theme/*`, `SettingsScreen` | Covered and current |
| Job position check | `docs/job-position-check-feature.md` + smoke docs | `ScannerScreen`, `jobsApi`, scanner components | Covered and current |
| Interview strategy | feature + smoke docs | `InterviewStrategy`, `notificationsApi`, `calendar.ts` | Covered and current |
| Burnout alert | `docs/burnout-alert-system-feature.md` | settings/plan endpoints + tiles | Partially complete by design (`In Progress`) |
| Lunar productivity | `docs/lunar-productivity-system-feature.md` | settings/plan endpoints + tile | Partially complete by design (`In Progress`) |
| Premium widgets | architecture/user-flow/smoke/build docs | Android provider + bridge + resources | Covered for Android, iOS extension pending |
| RevenueCat billing | `docs/revenuecat-paywall-e2e-implementation.md` | paywall + services + startup sync | Updated to reflect active mobile integration |
| Discover roles | `docs/discover-roles-feature.md` | `DiscoverRolesScreen`, `fetchDiscoverRoles` | Covered and current |
| Full natal analysis | `docs/full-natal-career-analysis-feature.md` | screen + API wiring | Covered and current |

## Important Feature Gaps (Product/Implementation, not only docs)

1. iOS native widget extension is still pending.
2. Burnout and lunar systems are integrated on mobile but delivery pipeline sections remain in-progress.
3. Game loop remains undefined (`TBD`).

## Important Documentation Gaps (Can be done post-factum)

1. No dedicated doc for app startup/session lifecycle (`ensureAuthSession`, bootstrap sync sequence).
2. No dedicated navigation map doc for current stack routes and gating paths.
3. No unified release smoke doc across scanner + billing + widgets + theme (currently split across feature docs).
4. No doc for onboarding form architecture and city search behavior despite being a critical first-run flow.

Update after this audit pass:
- `docs/app-startup-and-session-lifecycle.md` added.
- `docs/navigation-map.md` added.
- `docs/release-smoke-master-checklist.md` added.
- `docs/onboarding-flow-and-city-search.md` added.

## Diagram Status

- Previous diagram in `docs/specs.md` was an old sketch screenshot and no longer reflected current routes and integrations.
- It has been replaced with a current Mermaid flowchart in `docs/specs.md` section 7.
- Recommended maintenance rule: regenerate that diagram whenever stack routes or startup sync orchestration changes.

## Recommended Next Doc Backlog

No mandatory high-priority gaps remain from this audit batch.
