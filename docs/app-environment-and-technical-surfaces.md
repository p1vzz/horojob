# App Environment And Technical Surfaces
**Status:** Active  
**Last synced:** 2026-04-22

## Source Of Truth

Mobile runtime environment is controlled by:

```text
EXPO_PUBLIC_APP_ENV=development|staging|production
```

Aliases are accepted by `src/config/appEnvironment.ts`:

- `development`: `development`, `dev`, `local`, `debug`
- `staging`: `staging`, `stage`, `preview`, `qa`, `test`
- `production`: `production`, `prod`, `release`

If `EXPO_PUBLIC_APP_ENV` is missing or unknown, the app falls back to the runtime development flag:

- dev runtime -> `development`
- non-dev runtime -> `production`

## Behavior Matrix

| App env | Technical UI | Development overrides | Premium bypass |
| --- | --- | --- | --- |
| `development` | shown | enabled | enabled |
| `staging` | shown | disabled | disabled |
| `production` | hidden | disabled | disabled |

## What Counts As Technical UI

Technical surfaces must be gated with `SHOULD_EXPOSE_TECHNICAL_SURFACES`:

- QA/debug cards such as `JobParserQualityCard`
- scanner source/provider/cache labels
- raw cache/source/model/prompt/schema labels on AI-backed screens
- manual `Refresh` controls that exist for QA or forced sync validation
- client console logging for analytics and AI telemetry

Backend technical endpoints must also be gated server-side. Job parser metrics
and alerts (`GET /api/jobs/metrics`, `GET /api/jobs/alerts`) are controlled by
`JOB_METRICS_ENDPOINTS_ENABLED` in `../horojob-server`; the server default is
enabled outside production and disabled in production. Production server startup
fails if this flag is explicitly set to `true`.

Backend production hard gates:

- `DEV_FORCE_PREMIUM_FOR_ALL_USERS=true` is rejected in production.
- `JOB_USAGE_LIMITS_ENABLED=false` is rejected in production.
- `JOB_METRICS_ENDPOINTS_ENABLED=true` is rejected in production.
- `BURNOUT_ALERT_FORCE_SEVERITY` is rejected in production.

User-facing error recovery remains visible in production:

- `Retry` after a failed load
- premium upsell actions
- screenshot fallback actions
- product copy that explains an unavailable plan without exposing cache/API jargon

## Development-Only Overrides

Use `SHOULD_ALLOW_DEVELOPMENT_OVERRIDES` for behavior that should never ship to staging or production:

- `EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY=true`
- `EXPO_PUBLIC_FORCE_STARTUP_LOADER=true`
- local anonymous-session premium bypass

## EAS Defaults

`eas.json` sets:

- `development` profile -> `EXPO_PUBLIC_APP_ENV=development`
- `preview` profile -> `EXPO_PUBLIC_APP_ENV=staging`
- `production` profile -> `EXPO_PUBLIC_APP_ENV=production`

Local `.env.example` defaults to `development`.

## API Base URL

`src/config/api.ts` resolves `EXPO_PUBLIC_API_BASE_URL` through `src/config/apiCore.ts`.

- `development` may fall back to local HTTP development servers:
  - Android emulator: `http://10.0.2.2:8787`
  - other platforms: `http://localhost:8787`
- `staging` and `production` must set `EXPO_PUBLIC_API_BASE_URL`.
- `staging` and `production` require an `https:` API URL.

This keeps local development unchanged while preventing non-development builds
from silently shipping with local or cleartext API transport.

## Related Files

- `src/config/appEnvironment.ts`
- `src/config/api.ts`
- `src/config/apiCore.ts`
- `App.tsx`
- `src/screens/CareerVibePlanScreen.tsx`
- `src/components/DailyAstroStatus.tsx`
- `src/screens/ScannerScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/services/analytics.ts`
- `src/services/aiTelemetry.ts`
- `src/services/authSession.ts`
