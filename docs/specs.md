# Project: Horojob Mobile (USA Market Focus)
**Version:** 1.3 (synced on 2026-03-29)  
**Status:** Active (mobile app in production-oriented state, selected roadmap items still pending)

---

## 0. Repo Topology and DB Access
- Mobile client (this repo): `horojob/`
- Backend API: `../horojob-server`
- MongoDB access is configured in backend `.env`

---

## 1. Core Vision
Career intelligence app that combines astrology signals with AI-oriented career interpretation, daily ritual loops, and premium productivity tooling.

---

## 2. Technical Stack
- **Frontend:** React Native + Expo (Android and iOS app targets; native widget implementation is Android-first)
- **Styling:** NativeWind + custom token/theme layer in `src/theme`
- **Navigation:** React Navigation native stack
- **Backend/DB:** Node + MongoDB (`../horojob-server`)
- **Astrology APIs:** server-owned astrology endpoints consumed by mobile
- **Notifications:** Expo Notifications + app-side push token sync
- **Payments:** RevenueCat SDK + backend sync bridge
- **Widgets:** Android native widget providers + shared briefing payload bridge (iOS widget extension pending)

---

## 3. Key Feature Architecture

### A. Core Tools
1. **Onboarding + Natal Profile:** date/time/city input with profile persistence and server sync.
2. **Scanner + Job Position Check:** URL preflight/analyze, screenshot analyze flow, premium gate and usage-limit UX.
3. **AI Synergy and Daily Transit:** dashboard insights + stored history integration.
4. **Full Natal Career Analysis:** dedicated report screen with refresh/regenerate flow.
5. **Discover Roles:** recommendation/search flow from backend role catalog.

### B. Retention & Habit Loop
1. **Morning Career Briefing:** daily payload sync to app and widget bridge.
2. **Burnout Alert System:** mobile settings + plan integration in place; full delivery pipeline still evolving.
3. **Lunar Productivity:** mobile settings + plan integration in place; full delivery pipeline still evolving.
4. **Interview Strategy:** server-authoritative planning + calendar sync + settings controls.
5. **Home Screen Widgets:** Android multi-variant providers (light/dark aware), in-app variant picker.

### C. Not Delivered Yet
1. **Game loop** (product definition pending)
2. **iOS native widget extension**

---

## 4. UI/UX Direction
- Dark + light theme support with tokenized color system
- Glass and aura visual language for premium blocks
- Dashboard-first layout with modular insight tiles
- Mobile-first interaction model with explicit premium-gated paths

---

## 5. Monetization Model
- **Free:** limited scans, baseline insights
- **Premium:** expanded scan capability, strategy modules, widget setup, deeper analytics/reporting
- Gating remains anchored on backend `subscriptionTier` projection for compatibility

---

## 6. Implementation Roadmap (Current Snapshot)

### Phase 1: Foundation & Core Mobile UI
- [x] React Native/Expo project and navigation foundation
- [x] Onboarding + dashboard + scanner + settings + premium + natal analysis screens
- [x] Service-layer architecture for API + local storage
- [x] Themed design system migration in progress with active dark/light mode support

### Phase 2: Session, Sync, and Platform Integration
- [x] Session bootstrap and per-user onboarding/profile cache syncing
- [x] Push token registration and app-side notification response handling
- [x] Android widget bridge/provider implementation
- [ ] iOS native widget extension

### Phase 3: Career Intelligence Features
- [x] Job position check orchestration and scanner flow
- [x] Daily transit + AI synergy integration
- [x] Full natal career analysis screen + API wiring
- [x] Discover roles API and UI integration
- [x] Interview strategy settings + backend plan + calendar sync
- [ ] Burnout alert full delivery pipeline completion
- [ ] Lunar productivity full delivery pipeline completion

### Phase 4: Billing and Release
- [x] RevenueCat mobile integration and backend sync usage in app startup/paywall
- [x] Premium paywall wiring and restore/sync behavior in app flows
- [ ] App store release assets and submission operations
- [ ] Full release certification pass across both platforms

---

## 7. Architecture Diagram (Current)
```mermaid
flowchart TD
  A[App Launch] --> B[ensureAuthSession]
  B --> C{Birth profile exists?}
  C -- No --> D[OnboardingScreen]
  D --> E[upsert birth profile]
  E --> F[DashboardScreen]
  C -- Yes --> F

  B --> G[registerPushTokenForUser]
  B --> H[syncRevenueCatSubscription]
  B --> I[syncMorningBriefingCache]

  F --> J[ScannerScreen]
  F --> K[NatalChartScreen]
  F --> L[FullNatalCareerAnalysisScreen]
  F --> M[DiscoverRolesScreen]
  F --> N[SettingsScreen]
  F --> O[PremiumPurchaseScreen]
  F --> P[JobScreenshotUploadScreen]

  N --> Q[Theme toggle: light/dark]
  N --> R[Interview Strategy controls]
  N --> S[Widget variant setup]
  O --> H

  I --> T[Widget shared payload storage]
  T --> U[Android MorningBriefingWidget providers]

  J --> V[/api/jobs/preflight + analyze/]
  P --> W[/api/jobs/analyze-screenshots/]
  L --> X[/api/astrology/full-natal-analysis/]
  M --> Y[/api/astrology/discover-roles/]
  R --> Z[/api/notifications/interview-strategy-*/]
```

---

## 8. Focused Behavior Addenda
- Notification routing and alert entry points:
  - `docs/notification-routing-and-alert-entrypoints.md`
- Dashboard insight card runtime behavior:
  - `docs/dashboard-insight-cards-behavior.md`
- Scanner micro-UX and cache/fallback behavior:
  - `docs/scanner-flow-ux-addendum.md`
