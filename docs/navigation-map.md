# Navigation Map
**Status:** Active  
**Last synced:** 2026-04-14

## Root Stack

Declared in `App.tsx` (`createNativeStackNavigator<RootStackParamList>()`), all with `headerShown: false`.

Routes:

1. `Onboarding` -> `OnboardingScreen`
2. `Dashboard` -> `DashboardScreen`
3. `Scanner` -> `ScannerScreen`
4. `ScannerHistory` -> `ScannerHistoryScreen`
5. `Profile` -> `DashboardScreen` (alias route)
6. `PremiumPurchase` -> `PremiumPurchaseScreen`
7. `NatalChart` -> `NatalChartScreen`
8. `CareerVibePlan` -> `CareerVibePlanScreen`
9. `FullNatalCareerAnalysis` -> `FullNatalCareerAnalysisScreen`
10. `DiscoverRoles` -> `DiscoverRolesScreen`
11. `Settings` -> `SettingsScreen`
12. `JobScreenshotUpload` -> `JobScreenshotUploadScreen`

## Initial Route Rules

- Default behavior:
  - onboarded user -> `Dashboard`
  - non-onboarded user -> `Onboarding`
- Optional development override:
  - `EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY=true` forces initial route to `Onboarding`
  - override is ignored unless `EXPO_PUBLIC_APP_ENV=development`

## Cross-Screen Navigation Triggers

- Notification action:
  - push payload `type=burnout_alert` -> navigate to `Dashboard` with `alertFocus=burnout`
  - push payload `type=lunar_productivity_alert` -> navigate to `Dashboard` with `alertFocus=lunar`
  - `Dashboard` scrolls/highlights the target card after its readiness gate clears
- Premium flows:
  - gated actions route to `PremiumPurchase`
  - post-purchase/restore sync refreshes session tier and premium surfaces
- Career Vibe:
  - dashboard `DailyAstroStatus` opens `CareerVibePlan`
  - Android Morning Career Briefing widget deep links to `CareerVibePlan` via `horojob://career-vibe-plan`
  - `CareerVibePlan` fetches `/api/astrology/career-vibe-plan` and supports manual refresh
- Scanner flows:
  - URL scanner on `Scanner`
  - saved scan list on `ScannerHistory`
  - tapping a saved scan opens `Scanner` in history-result mode
  - screenshot-based scan on `JobScreenshotUpload`

## Settings-Centric Feature Branches

From `Settings` users can manage:

- interview strategy controls and calendar integration
- premium and restore-related operations
- widget setup/variant picker entry points

## Route Ownership Notes

- Keep route names stable because they are used across feature screens and startup logic.
- Add new stack routes only when feature scope cannot be represented as modal/section inside existing screens.
- `Profile` currently points to `Dashboard` and should be treated as compatibility alias unless product introduces a dedicated profile screen.

## Related Files

- `App.tsx`
- `src/types/navigation.ts`
- `src/screens/*.tsx`
