# Job Position Check - Feature Implementation Plan
**Version:** 1.8
**Status:** Market Lite/Full integration
**Owner:** Backend + Mobile

## 1. Feature Goal
User submits a vacancy URL and receives:
- natal chart compatibility score;
- AI replacement risk score;
- overall fit score;
- structured breakdown with clear factors;
- short high-level vacancy summary + tags/descriptors.

Target: stable and deterministic output for similar inputs (minimal score jitter).

## 2. Confirmed Product Decisions
- Input mode: URL-first with screenshot fallback for closed/blocked vacancies.
- No manual vacancy text typing flow in MVP.
- If parsing fails: return explicit error state in app (no hidden fallback form).
- Supported sources in MVP:
  - LinkedIn (public jobs only; `/jobs/view/<id>` and jobs links with numeric `currentJobId`),
  - Wellfound,
  - ZipRecruiter,
  - Indeed,
  - Glassdoor.
- No Apify/Bright Data in current implementation scope.
- Fetch strategy: HTTP-first, browser fallback only where policy allows.
- Wellfound browser fallback: disabled by default (debug/manual path only).
- Trial entry is intentionally not part of v1 Job Position Check monetization.
- Scanner premium upsell is scoped to `10 Daily Job Checks`; Deep Reports and AI Insights are promoted from the natal chart surface.
- Market-driven evolution is tracked in `docs/market-driven-career-intelligence-plan.md`.
- Monetization direction: separate free Lite market checks from limited Full analyses. Lite checks should keep labor-market facts free/public where provider terms require it; Full analyses should sell personalized decision support, repeated deep analysis, saved workflows, comparison, negotiation, and timing features.
- Current quotas: free users get 30 Lite checks/day and 1 Full analysis/day; premium users get 30 Lite checks/day and 10 Full analyses/day.
- Any successful new analysis consumes the matching quota. Reopening history or serving an unchanged cached Full result does not consume quota.
- Scan history is available to all users, and every result/history row must show a `Lite` or `Full` badge.
- Lite results stay Lite after a premium upgrade; users can explicitly run a new Full analysis from a Lite history item.

## 3. User Flow (Mobile)
1. User sees the Job Posting Check dashboard card with the currently supported services.
2. User opens Job Position Check screen.
3. User pastes vacancy URL.
4. App calls `POST /api/jobs/preflight`:
   - validates URL/source/path;
   - reads cache status;
   - returns next stage hint (`done`, `running_scoring`, `fetching_http_fetch`, `cooldown`, etc.).
5. App calls `POST /api/jobs/analyze`.
6. While request is running:
   - show blocking loader state;
   - adapt loader ambient glow/text/borders to current screen brightness via `docs/brightness-adaptation-system.md`;
   - show source-specific error message if parser fails.
7. If vacancy is blocked/closed/login-walled:
   - app offers screenshot fallback screen;
   - user uploads 1 to 6 screenshots from phone gallery;
   - upload screen explains the minimum visible fields: role title, company name, and job description/responsibilities;
   - app calls `POST /api/jobs/analyze-screenshots`;
   - if screenshots are not a vacancy -> explicit error;
   - if screenshots are incomplete -> explicit error + missing fields guidance.
8. On success:
   - render scores + breakdown + descriptors/tags;
   - keep scanner chips, helper text, empty state, and error-state borders aligned with semantic brightness-adaptation channels;
   - mark as cached result on repeated open.

Dashboard entry point:
- `src/components/JobCheckTile.tsx` presents supported sources and opens the scanner.
- URL input remains on `ScannerScreen`, where source hints and screenshot fallback are available.
- Saved scans live on `ScannerHistoryScreen`; tapping an item opens the full saved result on `Scanner`.
- Manual Scan tap dismisses the keyboard before the request starts.

Production gates:
- Mobile hides technical scanner/provider/cache hints and the parser quality card when `EXPO_PUBLIC_APP_ENV=production`.
- Backend disables job metrics/alerts endpoints in production and fails startup if production env explicitly enables parser metrics, disables usage limits, or enables the dev premium bypass.

## 4. Current Backend Contract
- `GET /api/jobs/limits`
- `GET /api/jobs/history?limit=8`
- `POST /api/jobs/history/import`
- `POST /api/jobs/preflight`
- `POST /api/jobs/analyze`
- `POST /api/jobs/analyze-screenshots`
- `GET /api/jobs/metrics?windowHours=24`
- `GET /api/jobs/alerts?windowHours=24`

Market-driven additions:

- `GET /api/jobs/limits` preserves legacy `limit` and also returns `limits.lite` and `limits.full`.
- `POST /api/jobs/preflight` returns `recommendedScanDepth` (`full` when Full quota is available, otherwise `lite` when Lite quota remains) and the same Lite/Full limit snapshot.
- `POST /api/jobs/analyze` accepts `scanDepth: "auto" | "lite" | "full"`; `auto` prefers Full and falls back to Lite when Full quota is exhausted.
- Analyze success returns durable `scanDepth`, `requestedScanDepth`, `usage.depth`, optional `usage.limits`, and `market`.
- `POST /api/jobs/analyze-screenshots` is Full-only for now and consumes Full quota on successful analysis.

## 4.1 Mobile Client Data Layer (Current)

- `src/hooks/queries/useJobAnalysis.ts` now provides typed React Query mutations for the existing scanner endpoints:
  - `useJobPreflight()`
  - `useJobAnalysis()`
  - `useJobScreenshotAnalysis()`
- These wrappers still call the existing `jobsApi` transport functions, but add:
  - retry orchestration through `src/services/aiOrchestration.ts`
  - runtime validation through `src/schemas/jobAnalysisSchema.ts`
  - cache-hit/cache-miss telemetry derived from the normalized `cache.analysis` boolean
- Retry profiles are intentionally heavier for slower work:
  - URL analysis uses a wider retry window than preflight
  - screenshot analysis uses the widest retry window of the three
- `src/screens/useScannerRuntime.ts` now orchestrates scans through `useJobPreflight()` and `useJobAnalysis()`.
- `src/screens/useJobScreenshotUploadRuntime.ts` now orchestrates screenshot analysis through `useJobScreenshotAnalysis()`.
- Impact: scanner URL flow and screenshot fallback now share the same retry, validation, and telemetry boundary as the query-layer wrappers without changing backend contracts or current UX.

## 5. Parsing + Analysis Pipeline (Implemented)
```text
url input
  -> validate + canonicalize
  -> check negative cache (cooldown)
  -> check raw cache
  -> HTTP fetch
  -> if needed and allowed: browser fallback
  -> normalize vacancy payload
  -> dedupe via content hash
  -> parse features
  -> deterministic scoring
  -> persist caches
```

## 6. Data Storage Model
- `jobs_raw`: normalized fetch result (business cache, no raw HTML).
- `job_raw_artifacts`: raw HTML snapshot + fetch metadata (short retention TTL).
- `jobs_parsed`: parser output/features by `jobContentHash + parserVersion`.
- `job_analyses`: per-user analysis by `profileHash + jobContentHash + rubric/model version`.
- `job_fetch_negative_cache`: temporary blocks (`blocked`, `login_wall`, `not_found`).
- `job_usage_limits`: free/premium usage counters.

## 7. Cache and TTL Policy
- Raw business cache (`jobs_raw`): `JOB_CACHE_TTL_DAYS` (default 30d).
- Parsed cache (`jobs_parsed`): `JOB_CACHE_TTL_DAYS` (default 30d).
- Raw HTML artifacts (`job_raw_artifacts`): `JOB_SCRAPER_RAW_HTML_RETENTION_DAYS` (default 14d).
- Negative cache:
  - `blocked`: 6h
  - `login_wall`: 6h
  - `not_found`: 24h

## 8. Determinism Rules
- Scoring path is deterministic (no LLM in scoring core).
- Stable formulas + bounded ranges + fixed versions:
  - `parserVersion`
  - `rubricVersion`
  - `modelVersion` (deterministic model tag)
- Dedupe hash is content-based (title/company/location/description/employment/seniority), not URL-based.

## 9. Limits and Monetization
- Free plan: 30 Lite checks per UTC day and 1 Full analysis per UTC day.
- Premium plan: 30 Lite checks per UTC day and 10 Full analyses per UTC day.
- Non-production only: limits can be disabled (`JOB_USAGE_LIMITS_ENABLED=false`).
- Lite checks include parser summary, occupation match when available, market estimate, salary/pay transparency, market range, outlook/demand, skills, and attribution.
- Full analyses include Lite market context plus compatibility score, AI replacement risk as low-weight context, natal/career fit breakdown, personalized tradeoffs, saved history, and deeper explanations.
- Missing posted salary should be treated as a negotiation opportunity. The result UI now separates nullable `Posted salary` from provider-backed `Market estimate`.
- After Full quota is exhausted, scanner should still render Lite results and show glass/blurred premium panels for locked Full sections.
- Any successful new Lite or Full result consumes only the matching quota. Reopening history or serving an unchanged cached Full analysis does not consume quota.
- Lite results expose `Run Full Analysis`, including when reopened from local history; the action explicitly requests `scanDepth="full"` and replaces the Lite history entry if it succeeds.

## 10. Error Contract (App-facing)
- `unsupported_path`: `This URL is not supported by the current parser.`
- `login_wall`: `This vacancy requires sign-in or is not public. Open it in your app or browser, take screenshots, and upload them here.`
- `blocked`: `This job board is temporarily blocking automated access. Upload screenshots of the vacancy and we can scan the visible details.`
- `not_found`: `This job posting may be closed or unavailable. If you can still see it in your browser, upload screenshots instead.`
- `provider_failed`: `We could not read enough vacancy details from this link. Upload screenshots of the title, company, and job description.`
- `screenshot_not_vacancy`: `Uploaded screenshots do not look like a vacancy page.`
- `screenshot_incomplete_info`: `Not enough vacancy details are visible in screenshots.` with core `missingFields`.

Screenshot minimum data:
- success requires a visible role title, company name, and substantial job description/responsibilities;
- backend enforces a minimum merged description length of 80 characters;
- location, seniority, and employment type are helpful but should not be treated as the core user-facing minimum.

## 11. Observability and Alerting
- Metrics endpoint provides source-level quality diagnostics.
- Alerts endpoint evaluates threshold breaches:
  - high blocked rate,
  - high browser fallback rate,
  - low success rate.
- Background scheduler runs periodic checks and logs alerts.
- Alerting env knobs: `JOB_METRICS_ALERT_*`.

## 12. What Is Already Done
- URL canonicalization + source routing.
- HTTP-first fetch and browser fallback.
- Mobile client-side normalization for `/api/jobs/preflight` and `/api/jobs/analyze` payloads.
- Mobile screenshot fallback now uses extracted runtime/core layers (`useJobScreenshotUploadRuntime.ts` + `jobScreenshotUploadCore.ts`) instead of screen-inline picker/analyze logic.
- Negative cache + cooldown behavior.
- Raw/parsed/analysis cache chain.
- Raw HTML retention split from business cache.
- Content-based dedupe hash.
- Deterministic scoring output.
- Limits subsystem (+ dev bypass).
- Metrics/alerts endpoints + alert scheduler.
- Market occupation insight endpoint and mobile market service contract.
- Lite/Full scanner depth contract, quotas, and fallback behavior.
- Scanner result/history badges for `Lite` and `Full`.
- Lite result UI with market snapshot, source footer, and locked Full panels.
- `JobProfileCard` separates posted salary from market estimate using nullable backend `job.salaryText`.
- Lite history can trigger a fresh Full analysis without reusing the session Lite cache.
- Scanner history is now remote-first via `/api/jobs/history`, with device AsyncStorage kept as fallback and migration cache.

## 13. Implementation Backlog
### P0 (must-have before release)
- [x] `P0-1` Mobile scan flow on `ScannerScreen`: `preflight -> analyze`, full-screen staged loader, API-driven error mapping, `retryAt` handling.
- [x] `P0-2` Persist last successful analysis per user on device (AsyncStorage) and restore it on screen open.
- [x] `P0-3` Add explicit UX for plan-limit response (`usage_limit_reached`) with premium CTA.
- [x] `P0-4` Add E2E smoke test checklist for top 5 sources (success + blocked/login_wall/not_found cases).

### P1 (stability and quality)
- [x] `P1-1` Add integration tests on server:
  - negative cache lifecycle,
  - raw/artifact TTL separation behavior,
  - deterministic score stability for same input payload.
- [x] `P1-2` Add parser-quality dashboard card in admin/dev screen using `/api/jobs/metrics` and `/api/jobs/alerts`.
- [x] `P1-3` Add source-aware UI hints (e.g. LinkedIn public-only note) before scan starts.

### P2 (nice-to-have)
- [x] `P2-1` Add local short-term response cache for repeated same-URL scans in one app session.
- [x] `P2-2` Add small scan history list (last N checks) with quick reopen.
- [x] `P2-3` Add richer descriptor rendering (tag groups + emphasis levels).

## 14. Non-goals (Current MVP)
- Login-only scraping for LinkedIn.
- External paid scraping providers as default path.
- LLM-driven scoring core (can be added later as optional narrative layer only).

## 15. QA Checklist Artifacts
- E2E smoke checklist for top 5 sources:
  - `docs/job-position-check-smoke-checklist.md`

## 16. Scraping Playbook (Merged)
This section merges the former `docs/job-position-check-plan.md` into this master doc.

### 16.1 Core Decisions
- For MVP, use internal scraper stack only (no Apify/Bright Data default path).
- Default flow: HTTP-first, browser fallback only for problematic/incomplete pages.
- LinkedIn scope: public job pages only (login-only pages are skipped).

### 16.2 Unified Scraping Pipeline
```text
input URL
  -> source normalization
  -> direct HTTP fetch
  -> parse structured data (JSON-LD/embedded) + HTML
  -> if blocked/incomplete: browser fallback
  -> normalize fields
  -> dedupe
  -> store raw + normalized payload
```

### 16.3 Required Normalized Fields
- `source`
- `canonical_url`
- `external_job_id`
- `title`
- `company`
- `location`
- `salary_text`
- `employment_type`
- `description_html`
- `description_text`
- `posted_at_text`
- `scraped_at`
- `raw_html` or `raw_html_path`
- `parse_version`
- `fetch_strategy` (`http` or `browser`)
- `page_access` (`public_ok`, `soft_wall`, `hard_wall`, `blocked`, `not_found`)

### 16.4 Source Strategy
- LinkedIn: public vacancy pages only; login-wall pages are skipped.
- Indeed: URL parsing first; job key/id is dedupe helper, not API contract.
- Glassdoor: HTTP parse first, browser fallback used more often on incomplete pages.
- ZipRecruiter: prefer JSON-LD extraction first; browser fallback is usually rare.
- Wellfound: browser fallback is disabled by default in production flow (debug/manual path only).

### 16.5 Source Priority and Complexity
- Priority (MVP): LinkedIn public -> Wellfound -> ZipRecruiter -> Indeed -> Glassdoor.
- Relative complexity:
  - easiest: ZipRecruiter
  - easy: Wellfound
  - medium: Indeed, LinkedIn public
  - hardest: Glassdoor

### 16.6 Phased Delivery Status
- [x] Phase A: strengthen HTTP parsers by source.
- [x] Phase B: add source-specific browser fallback handlers (starting from Glassdoor).
- [x] Phase C: harden dedupe and raw HTML retention workflow.
- [x] Phase D: parser quality metrics per source and access state.
- [x] Phase E: operational dashboards and alerts wiring.

### 16.7 Related Docs
- Operations policy: `docs/job-scraping-operations-policy.md`
- Manual fixtures: `docs/job-scraping-fixtures.md`
