# Premium Widget - Smoke Checklist
**Version:** 0.1  
**Status:** Active (for implementation rollout)  
**Owner:** Mobile QA + Backend QA

## Preconditions
- User A: premium entitlement enabled.
- User B: free entitlement.
- Birth profile and natal chart exist for User A.
- App installed via dev client/release build (not Expo Go).
- Device local time and timezone are known.

## Core Functional Checks
- [ ] Premium user sees widget setup CTA after entitlement activation.
- [ ] Free user does not receive active widget setup flow.
- [ ] Payload fetch returns data for premium user.
- [ ] Payload fetch is blocked for free user (`premium_required` contract).

## Android Checks
- [ ] Style picker in app shows all 8 variants with preview cards.
- [ ] Pin widget request opens system confirmation dialog.
- [ ] Accept flow places widget on Home Screen.
- [ ] Reject flow keeps setup status as not enabled.
- [ ] Widget updates after manual in-app refresh.
- [ ] Widget still shows last payload after app restart.
- [ ] Home Screen widget list contains all small/medium/strip variants.
- [ ] Light and Dark system themes both render readable widget UI.

## iOS Checks
- [ ] Guided instructions are shown after premium activation.
- [ ] User can add widget manually from Home Screen edit mode.
- [ ] Widget renders synced payload after app returns to foreground.

## Reliability Checks
- [ ] Offline mode keeps last successful payload.
- [ ] API 5xx keeps stale payload and does not crash.
- [ ] Logout clears payload and widget shows signed-out/locked state.
- [ ] Timezone/day change triggers new daily payload sync.

## Pass Criteria
- All checked items pass on at least one physical Android and one physical iOS device.
- No contract mismatch between mobile parser and backend payload.
