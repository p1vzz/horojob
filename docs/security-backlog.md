# Security Backlog
**Status:** Active  
**Last synced:** 2026-04-22

This file tracks deferred security and release-hardening work that should stay
visible outside code comments. It includes the medium audit follow-ups that were
not fixed in the April 2026 security pass plus TODOs already present in docs or
source comments.

## Audit Follow-Ups

- [ ] Medium 1: tighten backend CORS for production. `../horojob-server/src/app.ts`
  currently falls back to `origin: true` when `CORS_ORIGINS` is empty. Decide the
  production allow-list behavior, add tests, and document the expected mobile/web
  clients.
- [ ] Medium 2: define API security-header ownership. Decide whether headers such
  as `X-Content-Type-Options`, `Referrer-Policy`, and HSTS are owned by Fastify
  middleware or by the deployment edge/proxy, then encode that in code or ops
  docs.
- [x] Medium 3: prevent non-development mobile builds from using local or
  cleartext API transport by requiring explicit `https:` `EXPO_PUBLIC_API_BASE_URL`.
- [ ] Medium 4: harden push-notification token lifecycle before broader rollout.
  Review token format validation, stale-token cleanup, and abuse limits for
  `/api/notifications/push-token`.

Medium 5 from the audit is intentionally not tracked as a vulnerability.
`EXPO_PUBLIC_*` values are build-time public configuration, not secrets.

## Existing TODOs

- [ ] Replace Settings placeholders with real Privacy Policy and Terms of Service
  destinations (`src/screens/SettingsScreen.tsx`).
- [ ] Route Settings premium management to the production subscription portal or
  customer center (`src/screens/settings/SettingsSections.tsx`).
- [ ] Add production analytics, error, token-usage, and cache-effectiveness sinks
  for AI telemetry (`src/services/aiTelemetry.ts`).
- [ ] Restore full natal career analysis PDF export in v2 and cover share/save QA
  on iOS and Android (`docs/full-natal-career-analysis-feature.md`,
  `src/screens/FullNatalCareerAnalysisScreen.tsx`).
- [ ] Add release QA for full natal analysis timeout/provider/validation failure
  copy and a cooldown/rate-limit policy for one-time generation
  (`docs/full-natal-career-analysis-feature.md`).
