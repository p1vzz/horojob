# RevenueCat Paywall E2E Implementation
**Version:** 0.2  
**Status:** Active (mobile integration shipped, backend webhook hardening still operational)  
**Owner:** Mobile + Backend

## 1. Scope
Implement RevenueCat as the single subscription source for paywall purchase flows, while keeping existing premium gates (`subscriptionTier`) compatible.

End-to-end path:
1. Mobile SDK setup and paywall UI wiring.
2. RevenueCat purchase/restore and entitlement reads.
3. Backend sync + webhook processing.
4. Mongo persistence for billing state.
5. Projection back into existing `user.subscriptionTier` so current feature gates continue working.

## 2. Current State (as of March 29, 2026)
- Mobile paywall is wired to RevenueCat SDK (`react-native-purchases`) with offerings/purchase/restore flow.
- App startup configures RevenueCat for current authenticated session and triggers backend subscription sync.
- Mobile consumes backend sync endpoint (`POST /api/billing/revenuecat/sync`) and updates local session user snapshot.
- Premium checks continue to rely on `session.user.subscriptionTier` (`free|premium`) for compatibility.
- `Morning Career Briefing` and other premium surfaces are refreshed after successful billing sync.

### 2.1 Implemented in mobile code
- `src/services/revenueCat.ts`: RevenueCat configure, offering fetch, purchase, restore.
- `src/services/billingApi.ts`: subscription fetch and sync endpoints.
- `src/screens/PremiumPurchaseScreen.tsx`: dynamic paywall purchase/restore UI wiring.
- `src/screens/SettingsScreen.tsx`: restore/sync touchpoints and premium-related controls.
- `App.tsx`: startup RevenueCat configure and `syncRevenueCatSubscription()` integration.

## 3. Target Architecture
1. Mobile identifies the current backend user in RevenueCat (`appUserId = user.id`).
2. Purchase/restore is executed via RevenueCat SDK (`react-native-purchases`).
3. After purchase/restore, mobile calls backend sync endpoint.
4. Backend fetches authoritative subscriber state from RevenueCat REST API.
5. Backend writes billing snapshot to Mongo and updates `users.subscriptionTier`.
6. Backend returns updated user state to mobile.
7. Mobile updates local auth session user snapshot and refreshes premium-dependent flows.
8. RevenueCat webhook is the background truth-maintenance mechanism (renewals, expirations, billing issues, cancellations).

## 4. Mobile Implementation Plan (Expo + React Native)

### 4.1 SDK Installation
1. Install SDK:
```bash
npm install react-native-purchases
```
2. Since this project uses native folders (`android/` exists), run prebuild sync once after install:
```bash
npx expo prebuild
```
3. Rebuild app:
```bash
npm run android
npm run ios
```

### 4.2 Configuration and Startup
Add a billing bootstrap service, for example `src/services/revenueCat.ts`:
- `configureRevenueCat()`:
  - choose SDK key by platform (`EXPO_PUBLIC_RC_IOS_API_KEY` / `EXPO_PUBLIC_RC_ANDROID_API_KEY`);
  - set log level (debug in dev only);
  - call `Purchases.configure`.
- `loginRevenueCatUser(userId: string)`:
  - call `Purchases.logIn(userId)`;
  - optionally set attributes (`backend_user_id`, `env`).

App startup integration point:
- in `App.tsx`, after `ensureAuthSession()`, initialize RevenueCat and log in with `session.user.id`.

### 4.3 Paywall Screen Wiring
Replace static pricing source in `PremiumPurchaseScreen`:
1. Load `Offerings` from RevenueCat.
2. Map packages to UI cards (monthly/yearly/trial if present).
3. Purchase selected package:
   - `Purchases.purchasePackage(packageToBuy)`.
4. On success:
   - call backend `POST /api/billing/revenuecat/sync`;
   - update local session user snapshot from backend response;
   - trigger `syncMorningBriefingCache({ refresh: true })`;
   - navigate back with success state.
5. Add `Restore Purchases` action in `SettingsScreen` and paywall:
   - `Purchases.restorePurchases()`;
   - call backend sync endpoint afterward.

### 4.4 Compatibility Rule
Do not replace existing premium gates yet. Keep all product gating tied to `session.user.subscriptionTier` and treat RevenueCat data as input to backend sync.

This avoids immediate refactor in:
- `src/services/morningBriefingSync.ts`
- `src/screens/ScannerScreen.tsx`
- `src/screens/SettingsScreen.tsx`

## 5. Backend Implementation Plan (`../horojob-server`)

### 5.1 New Components
1. `src/services/revenuecatClient.ts`
- wrappers for RevenueCat REST API calls (`GET subscriber by app_user_id`).

2. `src/services/subscriptionProjection.ts`
- compute internal subscription state from RevenueCat subscriber payload.
- project to existing `users.subscriptionTier`.

3. `src/routes/billing.ts`
- `POST /api/billing/revenuecat/sync` (authorized user route).
- `POST /api/billing/revenuecat/webhook` (RevenueCat webhook route, no user auth).

4. Register billing routes in `src/app.ts` with prefix `/api/billing`.

### 5.2 Sync Endpoint Contract
`POST /api/billing/revenuecat/sync`:
- auth required (existing bearer session).
- no trusted billing payload from client required.
- server uses authenticated user id as RevenueCat `app_user_id`.
- server fetches subscriber state from RevenueCat API.
- server upserts Mongo billing records and updates `users.subscriptionTier`.
- response returns:
  - updated public user,
  - normalized subscription snapshot for UI.

Example response:
```json
{
  "user": {
    "id": "65f9...",
    "subscriptionTier": "premium"
  },
  "subscription": {
    "provider": "revenuecat",
    "tier": "premium",
    "entitlementId": "premium",
    "status": "active",
    "expiresAt": "2026-05-20T10:11:00.000Z",
    "willRenew": true,
    "productId": "horojob_premium_yearly",
    "updatedAt": "2026-03-20T12:00:00.000Z"
  }
}
```

### 5.3 Webhook Contract
`POST /api/billing/revenuecat/webhook`:
- secured by static auth token header.
- deduplicate events by `event.id`.
- parse event type, but always resolve final state using latest subscriber fetch from RevenueCat API.
- update Mongo and `users.subscriptionTier`.
- return `200` on already-processed duplicate.

### 5.4 Idempotency and Ordering
Rules:
1. `revenuecat_events.eventId` is unique.
2. Process event as idempotent upsert.
3. Ignore out-of-order downgrade if we already have newer `eventTimestampMs`.
4. Subscriber fetch from RevenueCat is authoritative when webhook payload and DB state conflict.

## 6. Mongo Data Model

### 6.1 `billing_subscriptions` (new collection)
Suggested schema:
- `_id`
- `userId` (ObjectId, unique)
- `provider` (`revenuecat`)
- `appUserId` (string)
- `tier` (`free|premium`)
- `entitlementId` (string|null)
- `status` (`active|grace|billing_issue|expired|cancelled|none`)
- `productId` (string|null)
- `store` (`app_store|play_store|unknown`)
- `willRenew` (boolean|null)
- `periodType` (`normal|trial|intro|prepaid|null`)
- `purchasedAt` (Date|null)
- `expiresAt` (Date|null)
- `latestEventId` (string|null)
- `latestEventAt` (Date|null)
- `source` (`sync|webhook`)
- `rawSnapshot` (object|null)
- `createdAt`
- `updatedAt`

Indexes:
1. `{ userId: 1 }` unique
2. `{ appUserId: 1 }`
3. `{ tier: 1, updatedAt: -1 }`
4. `{ expiresAt: 1 }` (non-TTL, operational queries only)

### 6.2 `revenuecat_events` (new collection)
Suggested schema:
- `_id`
- `eventId` (string)
- `eventType` (string)
- `appUserId` (string|null)
- `userId` (ObjectId|null)
- `eventTimestampMs` (number|null)
- `receivedAt` (Date)
- `processedAt` (Date|null)
- `processingStatus` (`processed|ignored|failed`)
- `errorMessage` (string|null)
- `rawPayload` (object)

Indexes:
1. `{ eventId: 1 }` unique
2. `{ userId: 1, receivedAt: -1 }`
3. `{ processingStatus: 1, receivedAt: -1 }`

### 6.3 Backward Compatibility Projection
`users.subscriptionTier` remains the feature-gating field in v1 rollout:
- set to `premium` when `billing_subscriptions.tier === premium` and status is active-like.
- otherwise set to `free`.

This keeps existing checks unchanged in current API and mobile code.

## 7. Entitlement-to-Tier Rules
Use one canonical entitlement id (e.g. `premium`):

1. Premium if entitlement exists in active entitlements and `expiresAt` is absent or in the future.
2. Premium in billing grace window if RevenueCat marks grace/billing issue but entitlement still active.
3. Free for expired/cancelled/refunded where entitlement is no longer active.
4. If data is temporarily unavailable, keep previous tier and mark sync failure (no blind downgrade).

## 8. API and App Flow Summary

### 8.1 Purchase
1. App opens paywall and fetches offerings.
2. User buys package in RevenueCat SDK.
3. App calls backend sync endpoint.
4. Backend updates Mongo + `users.subscriptionTier`.
5. App persists returned user and refreshes premium surfaces.

### 8.2 Restore
1. User taps restore.
2. SDK restores transactions.
3. App calls backend sync endpoint.
4. Same projection logic applies.

### 8.3 Renewal/Expiration
1. RevenueCat sends webhook.
2. Backend processes event idempotently.
3. Mongo + `users.subscriptionTier` are updated.
4. Next app interaction/session refresh gets the new tier.

## 9. Environment Variables

### 9.1 Mobile (`horojob/.env`)
Required:
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_RC_IOS_API_KEY`
- `EXPO_PUBLIC_RC_ANDROID_API_KEY`
- `EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM`
- `EXPO_PUBLIC_RC_OFFERING_MAIN`

Optional:
- `EXPO_PUBLIC_RC_LOG_LEVEL` (`DEBUG|INFO|WARN|ERROR`)

### 9.2 Backend (`../horojob-server/.env`)
Required:
- `REVENUECAT_SECRET_API_KEY`
- `REVENUECAT_WEBHOOK_AUTH_TOKEN`
- `REVENUECAT_ENTITLEMENT_PREMIUM`

Recommended:
- `REVENUECAT_API_BASE_URL` (default `https://api.revenuecat.com/v1`)
- `REVENUECAT_REQUEST_TIMEOUT_MS` (default `8000`)

### 9.3 What Must Be Provided By Product/Owner
You need to provide:
1. RevenueCat project setup for iOS and Android apps.
2. Products in stores and mapped product identifiers in RevenueCat.
3. Entitlement id for premium (single canonical id).
4. Offering id used by paywall (usually `default`).
5. Public SDK keys for iOS and Android.
6. Secret API key for server-to-RevenueCat requests.
7. Webhook auth token value and configure the same token in RevenueCat webhook settings.
8. Webhook URL:
   - dev: `<dev-server>/api/billing/revenuecat/webhook`
   - prod: `<prod-server>/api/billing/revenuecat/webhook`

## 10. Rollout Checklist
1. Ship backend billing routes and Mongo schema/index updates.
2. Ship mobile SDK bootstrap + paywall purchase wiring behind feature flag.
3. Validate purchase, restore, renewal, expiration scenarios in sandbox.
4. Confirm `users.subscriptionTier` transitions correctly for all events.
5. Remove static prices from paywall and rely on offerings only.
6. Enable production webhook and monitor failed event processing logs.

## 11. QA Smoke Checklist (Minimum)
1. Free user sees paywall offerings and can start purchase.
2. Successful purchase updates `subscriptionTier` to `premium` without app reinstall.
3. `Morning Career Briefing` premium endpoint stops returning `403` after sync.
4. Restore on another device upgrades same user account.
5. Expired/refunded user is downgraded to `free`.
6. Duplicate webhook delivery does not duplicate writes or break state.
