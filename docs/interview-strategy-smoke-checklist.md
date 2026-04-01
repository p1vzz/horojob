# Interview Strategy - Smoke Checklist
**Version:** 0.2  
**Status:** Active  
**Owner:** Mobile QA + Backend QA

## 1. Scope
Validate server-authoritative Interview Strategy:
- settings save and one-time autofill confirmation,
- server plan fetch/refresh from `SettingsScreen`,
- calendar permission + local sync,
- stale mapping recovery,
- backend horizon refill behavior.

## 2. Preconditions
- Use physical Android and iOS devices (not Expo Go).
- Premium test user is available.
- Free test user is available.
- Backend server is running with Mongo.
- Device calendar has at least one writable calendar.
- Device timezone is known.

## 3. Premium Gate
- [ ] Free user sees locked `Interview Strategy` row.
- [ ] Free user tap routes to premium purchase flow.
- [ ] Premium user can expand and use `Interview Strategy` section.

## 4. Server Plan Flow
### 4.1 Initial enable/confirmation
- [ ] Premium user opens Settings and taps `Generate`.
- [ ] Backend persists settings as enabled.
- [ ] Response/settings include non-null `autoFillConfirmedAt` and `autoFillStartAt`.
- [ ] Plan is returned from backend and rendered in app.

### 4.2 Manual refresh
- [ ] Change duration/weekdays/work window.
- [ ] Tap `Generate` again.
- [ ] New plan reflects new settings from backend.
- [ ] Plan metadata contains updated horizon tail (`filledUntilDateKey`).

## 5. Permission and Calendar Sync
### 5.1 Permission denied
- [ ] Tap `Add to Calendar`.
- [ ] Deny system calendar permission.
- [ ] App shows denial alert and keeps plan visible.
- [ ] No events are created.

### 5.2 Permission granted
- [ ] Allow system calendar permission.
- [ ] Tap `Add to Calendar`.
- [ ] Events are created in default/writable calendar.
- [ ] Re-run `Add to Calendar` and verify idempotent behavior (`Skipped` dominates).
- [ ] Re-open Settings after backend plan refresh and verify silent auto-sync updates events without extra confirm prompt.

## 6. Stale Mapping Recovery
### 6.1 Manual event deletion
- [ ] Sync a plan so map is populated.
- [ ] Manually delete 1-2 synced events in calendar app.
- [ ] Tap `Add to Calendar` again.
- [ ] Missing events are recreated and summary includes `Recovered links`.

### 6.2 Plan change pruning
- [ ] Sync a plan.
- [ ] Generate a materially different plan.
- [ ] Tap `Add to Calendar`.
- [ ] Summary includes `Pruned stale` and old mapping links are removed.

## 7. Empty-State UX
- [ ] Configure strict settings (minimal weekdays + narrow work window).
- [ ] Tap `Generate` until server returns no recommended slots.
- [ ] Empty-state card appears with guidance text.
- [ ] `Widen Window` updates local settings controls.
- [ ] `Reset Defaults` restores default settings controls.

## 8. Scheduler / Rolling Horizon (Backend)
- [ ] Verify `INTERVIEW_STRATEGY_REFILL_THRESHOLD_DAYS=14`, `INTERVIEW_STRATEGY_REFILL_DAYS=14`.
- [ ] For an enabled premium user with confirmed autofill, set `filledUntilDateKey` close to current date (<=14 days remaining).
- [ ] Run scheduler cycle.
- [ ] Confirm backend appends slots forward and moves `filledUntilDateKey` out by 14 days.

## 9. Pass Criteria
- All checklist items pass on at least one Android and one iOS device.
- No crashes during permission transitions.
- Calendar sync stays idempotent and resilient to stale mappings.
- Backend scheduler keeps rolling horizon without user re-confirmation.
