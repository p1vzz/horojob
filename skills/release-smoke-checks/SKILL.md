---
name: release-smoke-checks
description: Use this skill when preparing a release candidate or validating non-trivial changes in the Horojob mobile client. It provides focused smoke-check workflow across startup/session, onboarding, dashboard, scanner, premium flow, theme switching, and widgets, with clear pass/fail reporting. Do not use it for backend load testing or deep performance benchmarking.
---

# Goal

Catch high-impact regressions quickly before shipping by running a consistent, short smoke protocol.

# Apply when

Use this skill when the task involves:
- release candidate validation
- broad cross-screen refactors
- auth/session bootstrap changes
- scanner or premium flow changes
- theme-wide or widget-wide changes
- user asks for pre-ship confidence check

Typical trigger phrases:
- run smoke checks
- verify before release
- sanity check this build
- regression check

# Primary priorities

1. Focus on highest user-impact flows first.
2. Keep checks reproducible and time-boxed.
3. Report blockers clearly with path and repro steps.
4. Distinguish confirmed pass from untested areas.
5. Avoid over-testing low-risk paths in smoke phase.

# Do

- run startup/session/bootstrap check
- run at least one happy path for each touched feature
- run theme toggle and persistence check when UI/theme changed
- run widget visibility and readability checks when widget code changed
- reuse feature-specific checklists in `docs/*smoke-checklist*.md`
- report results in `PASS`, `FAIL`, `NOT TESTED` format

# Do not

- do not mark flows as pass without direct verification
- do not hide blockers inside long narrative text
- do not treat smoke checks as exhaustive QA

# Workflow

1. List touched areas from the diff and map required smoke routes.
2. Execute startup/auth and one critical path per touched area.
3. Validate platform-specific surfaces when relevant (Android widgets, iOS safe areas).
4. Capture failures with exact screen/action and expected vs actual.
5. Summarize as pass/fail matrix plus unresolved risks.

# Output quality bar

A good result:
- gives a clear ship/no-ship signal
- highlights blockers with reproducible steps
- separates verified behavior from assumptions
- stays concise and actionable
