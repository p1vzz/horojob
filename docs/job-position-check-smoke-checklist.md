# Job Position Check - E2E Smoke Checklist (P0-4)
**Version:** 1.1
**Status:** Active  
**Owner:** Backend + Mobile QA

## 0. Repo Topology and DB Access
- Backend server code is located in `../horojob-server`.
- MongoDB access is configured through a Mongo connection string in the server `.env` file.

## 1. Scope
This checklist validates MVP E2E behavior for all supported sources:
- `linkedin` (public jobs only),
- `wellfound`,
- `ziprecruiter`,
- `indeed`,
- `glassdoor`.

Each source must pass:
- `success` (full `preflight -> analyze` flow),
- `blocked`,
- `login_wall`,
- `not_found`.

## 2. Preconditions
- API server is running and connected to MongoDB.
- Test user is authenticated and has:
  - `birth_profiles` record,
  - `natal_charts` record.
- For dev smoke runs:
  - either premium plan user,
  - or `JOB_USAGE_LIMITS_ENABLED=false` in server env.
- You have API auth token for the test user.
- `BASE_URL` is set (example: `http://localhost:3000`).

## 3. URL Fixture Set (Top 5 Sources)
Use these URLs as the default smoke dataset.

### LinkedIn (public job detail required)
- `https://www.linkedin.com/jobs/view/<PUBLIC_JOB_ID>/`
- `https://www.linkedin.com/jobs/collections/recommended/?currentJobId=<PUBLIC_JOB_ID>`
- Notes:
  - Must be a concrete public job detail page.
  - Jobs collection/search URLs are accepted only when they include numeric `currentJobId`.
  - Search/list URLs without a concrete job id should fail with `unsupported_path`.

### Wellfound
- `https://wellfound.com/jobs/3886025-software-engineer-poland`

### ZipRecruiter (job detail required)
- `https://www.ziprecruiter.com/jobs/<COMPANY>/<ROLE>-<ID>`
- Notes:
  - Must be a concrete job detail page (`/jobs/...` or `/job/...` path).

### Indeed
- `https://www.indeed.com/viewjob?jk=ea5a0adad4ffe016`

### Glassdoor
- `https://www.glassdoor.com/job-listing/software-engineer-mercor-JV_IC2671300_KO0,17_KE18,24.htm?jl=1010065389530`

If any URL becomes stale, replace it with a current URL of the same source and same path type (job detail page).

## 4. API Runbook (Success)
Run for each source URL.

1. `POST /api/jobs/preflight` with `{ "url": "<SOURCE_URL>" }`
2. Assert preflight response:
   - `source` matches expected source.
   - `canonicalUrlHash` is present.
   - `limit.canProceed === true` (or unlimited in dev mode).
3. `POST /api/jobs/analyze` with `{ "url": "<SOURCE_URL>" }`
4. Assert analyze response:
   - HTTP `200`,
   - `status === "done"`,
   - `scores.compatibility` in `[0..100]`,
   - `scores.aiReplacementRisk` in `[0..100]`,
   - `scores.overall` in `[0..100]`,
   - `breakdown` has 4 items (`role_fit`, `growth_potential`, `stress_load`, `ai_resilience`).
5. Call `POST /api/jobs/analyze` second time with same URL:
   - HTTP `200`,
   - `cached === true` (analysis cache hit expected).

## 5. API Runbook (Deterministic Negative Cases)
Natural source behavior is unstable for `blocked/login_wall/not_found`, so force these states via `job_fetch_negative_cache`.

### 5.1 Get canonical hash
Call preflight first and capture:
- `source`,
- `canonicalUrlHash`.

### 5.2 Inject negative cache state
Use `mongosh` against app DB.

```javascript
db.job_fetch_negative_cache.updateOne(
  { canonicalUrlHash: "<CANONICAL_HASH>" },
  {
    $set: {
      source: "<SOURCE>",
      canonicalUrlHash: "<CANONICAL_HASH>",
      status: "<STATUS>", // blocked | login_wall | not_found
      message: "<MESSAGE>",
      details: { smokeTest: true },
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    },
    $setOnInsert: {
      createdAt: new Date()
    }
  },
  { upsert: true }
);
```

### 5.3 Validate response contract
Call `POST /api/jobs/analyze` for same URL.

Expected by status:
- `blocked` -> HTTP `429`, payload `code: "blocked"`, has `retryAt`.
- `login_wall` -> HTTP `422`, payload `code: "login_wall"`, has `retryAt`.
- `not_found` -> HTTP `404`, payload `code: "not_found"`, has `retryAt`.

### 5.4 Cleanup
```javascript
db.job_fetch_negative_cache.deleteOne({ canonicalUrlHash: "<CANONICAL_HASH>" });
```

## 6. Smoke Matrix (Checklist)
Mark all items complete in one smoke pass.

- [ ] `linkedin` success
- [ ] `linkedin` blocked
- [ ] `linkedin` login_wall
- [ ] `linkedin` not_found
- [ ] `wellfound` success
- [ ] `wellfound` blocked
- [ ] `wellfound` login_wall
- [ ] `wellfound` not_found
- [ ] `ziprecruiter` success
- [ ] `ziprecruiter` blocked
- [ ] `ziprecruiter` login_wall
- [ ] `ziprecruiter` not_found
- [ ] `indeed` success
- [ ] `indeed` blocked
- [ ] `indeed` login_wall
- [ ] `indeed` not_found
- [ ] `glassdoor` success
- [ ] `glassdoor` blocked
- [ ] `glassdoor` login_wall
- [ ] `glassdoor` not_found

## 7. Pass Criteria
- All 20 checklist items pass.
- No contract mismatches in error payload (`code`, HTTP status, `retryAt`).
- Success scenario returns deterministic score fields and valid numeric ranges.
- Cached re-run works for each source.

## 8. Optional UI Spot Check (Mobile)
On `ScannerScreen`:
- success result renders cards and scores,
- `usage_limit_reached` shows premium CTA,
- `blocked/login_wall/not_found/provider_failed` show mapped screenshot-first message + retry timestamp when provided.
- top-right `History` opens `ScannerHistoryScreen`,
- tapping a saved scan opens the full saved result on `ScannerScreen`,
- historical results show vacancy title instead of URL input and display the source URL below.

## 9. Screenshot Fallback UI Smoke (Mobile)
Use one deterministic blocked or login-wall vacancy URL so the scanner offers screenshot fallback CTA.

1. Open `ScannerScreen` with a URL that resolves to `blocked`, `login_wall`, `not_found`, or `provider_failed`.
2. Assert scanner feedback card shows `Scan from screenshots` and the minimum screenshot guidance.
3. Tap CTA and confirm `JobScreenshotUploadScreen` opens.
4. On screenshot upload screen:
   - verify title and summary copy render,
   - verify total counter starts at `0/6`,
   - verify minimum requirements copy mentions role title, company name, and job description/responsibilities,
   - verify `Analyze Screenshots` is disabled until at least one screenshot is present.
5. Permission-denied branch:
   - deny gallery permission,
   - verify error text `Media permission is required to upload screenshots.`.
6. Successful upload branch:
   - allow gallery access,
   - choose 1 to 6 vacancy screenshots,
   - verify gallery thumbnails render,
   - verify duplicate asset selection does not create duplicate cards,
   - verify total counter updates.
7. Successful analyze branch:
   - tap `Analyze Screenshots`,
   - verify full-screen loader appears,
   - verify app navigates back to `ScannerScreen`,
   - verify screenshot parsing card renders with image count and confidence.
8. Error mapping branch:
   - reproduce or simulate `screenshot_not_vacancy`,
   - verify explicit vacancy-page error copy,
   - reproduce or simulate `screenshot_incomplete_info`,
   - verify missing-fields guidance is shown,
   - reproduce or simulate `usage_limit_reached`,
   - verify plan-limit message is shown instead of generic error.

### Screenshot Fallback Checklist
- [ ] Scanner blocked-state CTA opens screenshot upload
- [ ] Permission denied message is shown
- [ ] Valid screenshots render in gallery and update counter
- [ ] Successful analyze returns to scanner with screenshot parsing card
- [ ] `screenshot_not_vacancy` error copy is correct
- [ ] `screenshot_incomplete_info` error copy is correct
- [ ] `usage_limit_reached` error copy is correct

## 10. Production Gate Smoke

Mobile production build/config:
- [ ] `EXPO_PUBLIC_APP_ENV=production` is present in the production EAS profile.
- [ ] `SettingsScreen` does not render `DEV PARSER QUALITY`.
- [ ] scanner does not show source/provider/cache summary labels such as `LINKEDIN via browser fallback - cached result`.
- [ ] screenshot fallback and premium upsell actions remain visible when their user-facing error states apply.

Backend production env:
- [ ] `NODE_ENV=production`.
- [ ] `DEV_FORCE_PREMIUM_FOR_ALL_USERS` is unset or `false`.
- [ ] `JOB_USAGE_LIMITS_ENABLED` is unset or `true`.
- [ ] `JOB_METRICS_ENDPOINTS_ENABLED` is unset or `false`.
- [ ] `GET /api/jobs/metrics` returns `404` in production.
- [ ] `GET /api/jobs/alerts` returns `404` in production.
