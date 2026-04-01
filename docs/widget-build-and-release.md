# Widget Build And Release
**Version:** 0.1  
**Status:** Active (Android-first; iOS widget extension pending)  
**Owner:** Mobile

## Why Expo Go Is Not Enough
Home-screen widgets require native extensions/providers. Expo Go cannot load custom native widget code, so this feature requires:
- `expo prebuild`
- custom dev client (`expo run:android` / `expo run:ios` or EAS dev client)

## Local Prerequisites
- Node `>=22 <23`
- Android Studio + emulator or physical Android device
- Xcode for iOS testing
- For Android CLI diagnostics: `adb`

## Android Dev Testing Flow
1. `npm install`
2. `npx expo prebuild`
3. `npm run android`
4. `npm run start`
5. Verify device connection with `adb devices`
6. Add widget from launcher UI (long press -> Widgets -> Horojob)
7. Inspect logs with `adb logcat` when troubleshooting

## iOS Dev Testing Flow
Current state:
- Native iOS widget extension is not implemented yet in this repo.
- Keep iOS checks focused on app-side premium and briefing flows until extension work starts.

Planned when extension is added:
1. `npx expo prebuild`
2. `npm run ios` (or open generated `ios/*.xcworkspace` in Xcode)
3. Launch app from dev client
4. Add widget manually from iOS Home Screen edit mode
5. Validate refresh after app-side sync

## Build/Release Notes
- Native widget code means release builds must include generated native projects.
- Choose one operational mode and keep it consistent:
  - commit native `android/` + `ios/` folders, or
  - deterministic prebuild in CI before EAS build
- Validate widget entitlement and shared storage config per environment (dev/stage/prod).

## Release Gate Checklist
- Android widget works on at least one physical Android device.
- iOS widget gate is applied only after iOS extension is implemented.
- Premium gating works (`free` cannot fetch premium widget payload).
- Logout clears widget payload.
- Stale/fallback state renders correctly when API is unavailable.
