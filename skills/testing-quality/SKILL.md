---
name: testing-quality
description: Use this skill when adding or updating tests in the Horojob mobile client, including service contract tests, node:test unit tests, testability refactors with dependency injection, and verification runs. Use it for regression-focused coverage and fast pass/fail validation after code changes. Do not use it for backend endpoint implementation.
---

# Testing Quality

## Goal

Add high-signal tests quickly, keep them deterministic, and preserve a green `npm run verify`.

## Apply when

Use this skill when the task involves:
- adding or updating `src/**/*.test.ts`
- creating regression tests for bug fixes
- covering service request/response contract behavior
- extracting `*Core.ts` modules for dependency-injected testability
- fixing test/runtime failures that block `npm run verify`

Typical trigger phrases:
- add tests for this feature
- cover this bug with tests
- make this service testable
- verify this change
- fix broken tests

## Primary priorities

1. Cover behavior boundaries first (success + failure).
2. Keep tests small, deterministic, and implementation-light.
3. Keep runtime-heavy code in wrappers; test core logic through injected deps.
4. Run `npm run verify` after non-trivial test changes.
5. Report what is covered and what remains risky.

## Do

- prefer `node:test` + `node:assert/strict` for service/unit tests
- validate endpoint paths, query params, methods, and JSON payload shape
- validate error mapping (`status`, message, payload)
- inject dependencies for network, time, storage, and platform branches
- test default options and normalization behavior explicitly
- keep one clear behavior per test case

## Do not

- do not bind tests to Expo/React Native runtime if a core extraction can isolate logic
- do not over-mock internal implementation details that users do not observe
- do not rely on broad snapshots for API contract assertions
- do not skip `verify` after meaningful changes

## Workflow

1. Classify risk: contract, branching, cache/state, or runtime integration.
2. Decide whether a wrapper/core split is needed for deterministic tests.
3. Add or update tests for happy path and at least one failure path.
4. Run `npm run verify`.
5. Fix failures and re-run until green.
6. Summarize pass/fail and residual test gaps.

## Minimal coverage checklist

- request construction (path/query/body/method)
- response mapping on success
- error mapping on non-2xx responses
- defaults/normalization logic
- cache/time/platform branches when present

## Output quality bar

A good result:
- prevents realistic regressions with minimal maintenance cost
- improves testability architecture instead of adding one-off hacks
- keeps verification status explicit and reproducible
