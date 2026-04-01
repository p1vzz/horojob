# Premium Widget - Analytics And Support
**Version:** 0.1  
**Status:** Draft  
**Owner:** Product + Mobile + Backend

## Event Model
Track the following events with `platform`, `appVersion`, `userPlan`, `timestamp`:

| Event | When |
|---|---|
| `premium_widget_cta_shown` | Setup CTA rendered |
| `premium_widget_cta_tapped` | User starts setup |
| `premium_widget_pin_requested` | Android pin flow invoked |
| `premium_widget_pin_result` | Android pin accepted/rejected |
| `premium_widget_ios_guide_opened` | iOS manual setup guide opened |
| `premium_widget_enabled` | Widget confirmed active |
| `premium_widget_sync_success` | Payload written to shared storage |
| `premium_widget_sync_failed` | Payload fetch/write failed |
| `premium_widget_payload_stale` | Widget rendered stale fallback |
| `premium_widget_locked_rendered` | Widget rendered locked/upgrade state |

## Recommended Event Properties
- `entryPoint` (`purchase_success`, `settings`, `dashboard`, `reminder`)
- `setupStateBefore`, `setupStateAfter`
- `errorCode` (for failures)
- `payloadDateKey`
- `payloadAgeMinutes`

## KPI Funnel
1. `cta_shown -> cta_tapped`
2. `cta_tapped -> enabled`
3. `enabled -> daily_sync_success`
4. `enabled -> 7-day retention`

Primary metrics:
- setup conversion rate
- median time-to-enable
- daily sync success rate
- stale render rate

## Support Triage Guide
If user says widget is empty or stale:
1. Verify premium entitlement state.
2. Check latest `premium_widget_sync_*` events for the user.
3. Confirm widget setup state (`enabled` vs dismissed/rejected).
4. Validate backend response code (`401`, `403`, `404`, `5xx`).
5. Ask user to open app once and retry sync (forces storage refresh).

## Operational Alerts (Recommended)
- Alert when sync failure rate exceeds threshold for 15+ minutes.
- Alert when `premium_required` rate spikes for users marked premium (possible entitlement drift).
