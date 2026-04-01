---
name: mobile-server-contract-sync
description: Use this skill when a task changes or verifies API contracts across the Horojob mobile client and ../horojob-server together. Trigger it for coordinated updates to mobile services, backend routes, DTO parsing, response shapes, contract docs, or smoke checklists that must stay aligned across both repos.
---

# Mobile Server Contract Sync

## Goal

Keep mobile request and response handling synchronized with backend route contracts
and release docs without leaking transport details into UI code.

## Workflow

1. Inspect the backend contract source first.
   - `../horojob-server/src/routes/*.ts`
   - related `../horojob-server/src/services/*`
   - matching server docs in `../horojob-server/docs/*.md`
2. Inspect mobile mapping and consumption.
   - `src/services/*`
   - `src/hooks/*`, `src/screens/*`, `src/components/*` only where the contract output is consumed
   - affected mobile docs and checklists in `docs/*`
3. Prefer additive compatibility.
   - add fields before renaming or removing them
   - keep status and error semantics stable when possible
   - support old and new payloads in mobile parsers when rollout order can vary
4. Update both repos together when required.
   - backend request or response shape
   - mobile parser and types
   - contract docs and smoke checklists
5. Verify both sides.
   - mobile: `npm run verify`
   - server: `npm run verify`
   - server: `npm run smoke:routes` when route behavior changes
6. Record coordination assumptions.
   - temporary shims
   - rollout order
   - follow-up cleanup

## Contract Checks

- field names and nullability
- enum expansion and unknown values
- id and ISO date serialization
- premium vs free gating fields
- error body and status code stability
- pagination or cursor metadata
- backward compatibility for older app builds

## Do

- keep HTTP logic in `src/services/*`
- keep server response shaping close to routes and shared services
- update docs when shipped behavior changes
- call out unavoidable breaking changes explicitly

## Do Not

- do not patch UI around undocumented fields
- do not change server response semantics silently
- do not update only one repo when the other clearly depends on the same contract
