---
name: expo-runtime-debug
description: Use this skill when diagnosing Expo and React Native runtime failures in the Horojob client, including Metro resolver errors, import path failures, runtime crashes, require cycles, deprecation warnings, cache inconsistencies, and native module wiring problems. Do not use it for backend API implementation.
---

# Goal

Find root cause quickly and apply the smallest stable fix for runtime and tooling failures.

# Apply when

Use this skill when the task involves:
- Metro `Unable to resolve module` errors
- runtime exceptions after code changes
- `require cycle` warnings with behavioral risk
- deprecation warnings requiring migration
- inconsistent behavior after hot reload/cache changes
- native module registration or bridge loading issues

Typical trigger phrases:
- app does not start after change
- cannot resolve module
- red screen crash
- require cycles warning
- broken after update

# Primary priorities

1. Reproduce with exact error text and import stack.
2. Classify failure type before changing code.
3. Prefer deterministic fixes over trial-and-error cache clearing.
4. Keep compatibility shims explicit and temporary.
5. Verify startup and affected flow after fix.

# Do

- capture the full error and import stack
- verify import paths, barrel files, and filename casing
- check for stale module references after file moves/renames
- clear Metro cache once when graph appears stale: `npm run start -- --clear`
- rebuild native app when native wiring changed: `npm run android` or `npm run ios`
- keep temporary compatibility exports marked for later cleanup

# Do not

- do not keep adding random fallback imports without root-cause validation
- do not rely on repeated cache clears as a permanent solution
- do not ignore warnings that indicate upcoming runtime breakages

# Workflow

1. Capture and classify the failure (`resolver`, `runtime`, `native`, `warning`).
2. Inspect the exact files from the import stack first.
3. Apply minimal fix to paths/exports/provider wiring.
4. Run one cache reset if stale graph is suspected.
5. Re-run app startup and the impacted user flow.
6. Record any temporary shim that must be removed later.

# Output quality bar

A good result:
- removes the immediate crash/error
- explains the real root cause
- avoids hidden regressions from broad ad hoc changes
- leaves the codebase cleaner than before the incident
