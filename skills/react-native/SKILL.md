---
name: react-native
description: Use this skill when modifying React Native screens, components, hooks, navigation flows, forms, async UI states, or mobile performance issues. Use it for rendering behavior, screen composition, list performance, state wiring, and user-visible interaction changes. Do not use it for backend API implementation, database schema changes, or backend-only business logic.
---

# Goal

Implement React Native changes in a way that matches the existing app structure,
keeps UI logic maintainable, and avoids accidental performance regressions.

# Apply when

Use this skill when the task involves:
- screens
- components
- hooks
- navigation
- forms
- loading/error/empty states
- list rendering
- local UI state
- client-side interaction behavior
- React Native performance issues

Typical trigger phrases:
- add a new screen
- update this component
- fix navigation
- add loading state
- add empty state
- improve list performance
- reduce re-renders
- fix form behavior
- update mobile UI

# Primary priorities

1. Preserve existing app conventions.
2. Keep screens thin.
3. Keep business logic out of presentational components when practical.
4. Reuse existing hooks, services, and UI primitives.
5. Handle async UI states explicitly.
6. Avoid unnecessary re-renders and unstable prop chains.

# Do

- inspect nearby screens/components before introducing a new pattern
- follow the existing navigation structure
- prefer functional components and hooks
- keep large components split into smaller composable pieces
- move repeated or stateful behavior into hooks when that matches nearby code
- reuse theme/design-system primitives if they exist
- preserve accessibility and touch-target quality where relevant
- check loading, error, and empty states for async flows
- keep network orchestration out of UI components when the repo already has a service layer
- optimize list rendering only when there is a real reason or existing pattern

# Do not

- do not call backend APIs directly from random UI files if a service layer exists
- do not introduce a new state-management library
- do not introduce a new form library unless explicitly required
- do not add premature memoization everywhere
- do not move business rules into screens just because it is quicker
- do not assume iOS and Android behavior are identical when platform-specific code already exists
- do not introduce new native dependencies casually

# Workflow

For non-trivial UI work:

1. inspect the target screen/component and nearby patterns
2. inspect related hooks and services
3. identify the current loading/error/data flow
4. implement the smallest coherent UI change
5. verify edge states
6. summarize any assumptions

# Async UI checklist

For async screens and actions, check:
- initial loading
- retry path on failure
- empty result handling
- disabled states during submission
- success path after mutation
- stale state after navigation back/forward, if relevant

# Performance checklist

When performance is part of the task:
- inspect list item rendering boundaries
- avoid recreating handlers/objects unnecessarily when it materially affects children
- preserve stable keys for lists
- avoid lifting volatile state too high without reason
- check whether expensive derived values should be memoized
- prefer readability unless there is a clear performance issue

# Output quality bar

A good result:
- matches existing UI conventions
- keeps screens/components understandable
- handles loading/error/empty states
- preserves service-layer boundaries
- avoids unnecessary complexity