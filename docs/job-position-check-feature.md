# Job Position Check - Feature Implementation Plan
**Version:** 1.6  
**Status:** Active (post-Phase E backend ready)  
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
  - LinkedIn (public jobs only),
  - Wellfound,
  - ZipRecruiter,
  - Indeed,
  - Glassdoor.
- No Apify/Bright Data in current implementation scope.
- Fetch strategy: HTTP-first, browser fallback only where policy allows.
- Wellfound browser fallback: disabled by default (debug/manual path only).

## 3. User Flow (Mobile)
1. User opens Job Position Check screen.
2. User pastes vacancy URL.
3. App calls `POST /api/jobs/preflight`:
   - validates URL/source/path;
   - reads cache status;
   - returns next stage hint (`done`, `running_scoring`, `fetching_http_fetch`, `cooldown`, etc.).
4. App calls `POST /api/jobs/analyze`.
5. While request is running:
   - show blocking loader state;
   - show source-specific error message if parser fails.
6. If vacancy is blocked/closed/login-walled:
   - app offers screenshot fallback screen;
   - user uploads 1 to 4 screenshots from phone gallery;
   - app calls `POST /api/jobs/analyze-screenshots`;
   - if screenshots are not a vacancy -> explicit error;
   - if screenshots are incomplete -> explicit error + missing fields guidance.
7. On success:
   - render scores + breakdown + descriptors/tags;
   - mark as cached result on repeated open.

## 4. Current Backend Contract
- `GET /api/jobs/limits`
- `POST /api/jobs/preflight`
- `POST /api/jobs/analyze`
- `POST /api/jobs/analyze-screenshots`
- `GET /api/jobs/metrics?windowHours=24`
- `GET /api/jobs/alerts?windowHours=24`

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
- Free plan: 1 successful parse per rolling 7 days.
- Premium plan: 10 successful parses per UTC day.
- Dev mode: limits can be disabled (`JOB_USAGE_LIMITS_ENABLED=false`).

## 10. Error Contract (App-facing)
- `unsupported_path`: `This URL is not supported by the current parser.`
- `login_wall`: `This job page requires sign-in, so data is unavailable in the current mode.`
- `blocked`: `The source temporarily restricted access to this page. Please try again later.`
- `not_found`: `The job posting was not found on the source page.`
- `screenshot_not_vacancy`: `Uploaded screenshots do not look like a vacancy page.`
- `screenshot_incomplete_info`: `Not enough vacancy details are visible in screenshots.`

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
