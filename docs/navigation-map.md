# Navigation Map
**Status:** Active  
**Last synced:** 2026-03-29

## Root Stack

Declared in `App.tsx` (`createNativeStackNavigator<RootStackParamList>()`), all with `headerShown: false`.

Routes:

1. `Onboarding` -> `OnboardingScreen`
2. `Dashboard` -> `DashboardScreen`
3. `Scanner` -> `ScannerScreen`
4. `Profile` -> `DashboardScreen` (alias route)
5. `PremiumPurchase` -> `PremiumPurchaseScreen`
6. `NatalChart` -> `NatalChartScreen`
7. `FullNatalCareerAnalysis` -> `FullNatalCareerAnalysisScreen`
8. `DiscoverRoles` -> `DiscoverRolesScreen`
9. `Settings` -> `SettingsScreen`
10. `JobScreenshotUpload` -> `JobScreenshotUploadScreen`

## Initial Route Rules

- Default behavior:
  - onboarded user -> `Dashboard`
  - non-onboarded user -> `Onboarding`
- Optional development override:
  - `EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY=true` forces initial route to `Onboarding`
  - override is ignored outside development builds

## Cross-Screen Navigation Triggers

- Notification action:
  - push payload `type=burnout_alert` -> navigate to `Dashboard`
  - other alert types do not have dedicated app-side routing yet
- Premium flows:
  - gated actions route to `PremiumPurchase`
  - post-purchase/restore sync refreshes session tier and premium surfaces
- Scanner flows:
  - URL scanner on `Scanner`
  - screenshot-based scan on `JobScreenshotUpload`

## Settings-Centric Feature Branches

From `Settings` users can manage:

- appearance (`light/dark` mode)
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
