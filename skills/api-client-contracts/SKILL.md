---
name: api-client-contracts
description: Use this skill when modifying the mobile app's API service layer, request/response mapping, DTO parsing, client-side models, serialization, pagination payload handling, or compatibility with backend response changes. Do not use it for server endpoint implementation or MongoDB data-layer changes.
---

# Goal

Keep the mobile app aligned with backend API contracts without leaking backend internals
into the UI layer or introducing fragile parsing assumptions.

# Apply when

Use this skill when the task involves:
- API service methods
- request/response mapping
- DTOs
- parsing backend payloads
- adapting to backend field changes
- pagination responses
- optional or nullable API fields
- date/id/enum normalization
- client-side model compatibility

Typical trigger phrases:
- update API response parsing
- add field from backend
- adapt client to endpoint change
- fix DTO mapping
- update pagination handling
- handle optional field
- parse date/id safely

# Primary priorities

1. Treat API responses as contracts.
2. Keep transport concerns out of UI components.
3. Make parsing and normalization explicit.
4. Prefer backward-compatible handling.
5. Avoid hidden assumptions about backend internals.

# Do

- inspect the existing service layer before adding new request code
- keep request logic inside services/api modules
- map backend payloads into client-friendly shapes where the codebase already does that
- normalize ids, enums, optional fields, and dates explicitly
- handle missing or legacy fields safely
- update client-side types/models when response shape changes
- keep pagination/filter contracts explicit
- document required backend coordination when the client cannot handle the change alone

# Do not

- do not rely on undocumented fields
- do not parse raw responses ad hoc inside components
- do not spread transport-shape assumptions across multiple screens
- do not silently change meaning of nullable/optional fields
- do not assume the server repo has already been updated automatically
- do not encode MongoDB implementation details in the client

# Workflow

For API contract changes:

1. inspect the existing service/API module
2. inspect the current response shape and where it is consumed
3. update mapping/types in one clear place
4. update affected consumers
5. verify error and empty-state behavior
6. note any server dependency or compatibility assumption

# Contract checklist

Check these explicitly when relevant:
- missing fields
- null vs undefined handling
- enum expansion
- pagination cursors/page numbers
- numeric/string id mismatch
- ISO date parsing
- backward compatibility with older responses

# Output quality bar

A good result:
- keeps API logic out of components
- makes request/response mapping explicit
- preserves compatibility where possible
- reduces fragile parsing behavior
- clearly notes any server-side dependency