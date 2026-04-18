# Scanner Flow UX Addendum
**Status:** Active  
**Last synced:** 2026-04-17

## Goal

Capture scanner micro-behaviors that are easy to miss in high-level feature docs but matter for support, QA, and future refactors.

## URL Hint Layer (Before Scan)

- Hint is computed from `sourceHintFromUrl(url)` on every URL change.
- Supported sources in hint model:
  - LinkedIn
  - Wellfound
  - ZipRecruiter
  - Indeed
  - Glassdoor
- Hint tone can be `neutral`, `positive`, or `warning`.
- Unsupported sources are shown before API call with explicit message.
- LinkedIn jobs collection/search links are treated as valid only when they include a numeric `currentJobId`.
- Tapping `Scan` dismisses the keyboard before the request starts.

## Cache Layers In Scanner Runtime

1. Session cache (`src/utils/jobScanSessionCache.ts`)
   - In-memory, per-user, URL-normalized.
   - TTL: 10 minutes.
   - Used first to short-circuit repeated scans.
2. Last scan cache (`src/utils/jobScanStorage.ts`)
   - Persisted in AsyncStorage, per-user.
   - Restored on screen mount.
3. Scan history (`src/utils/jobScanHistoryStorage.ts`)
   - Persisted in AsyncStorage, per-user.
   - Capacity: 8 entries.
   - `ScannerHistoryScreen` shows the full persisted list.
   - Tapping an entry opens `Scanner` in history-result mode with the saved analysis payload.

## Runtime Orchestration Split

- `src/screens/ScannerScreen.tsx` is the render layer for the scanner UI.
- `src/screens/useScannerRuntime.ts` owns async orchestration for:
  - cache restore
  - imported screenshot payload hydration
  - initial URL auto-start
  - scan submission
  - selected history result hydration
- `src/screens/scannerRuntimeCore.ts` owns pure branching for:
  - imported meta fallback
  - challenge-page cache guards
  - preflight gating
  - fresh result meta mapping
- `src/screens/scanner/*` now owns screen-local presentation splits:
  - search panel
  - history list rows
  - feedback/error card
  - analysis section
- `src/screens/ScannerHistoryScreen.tsx` owns scan history page loading and navigation back to `Scanner`.
- `src/screens/JobScreenshotUploadScreen.tsx` is the render layer for screenshot fallback UI.
- `src/screens/useJobScreenshotUploadRuntime.ts` owns screenshot runtime orchestration for:
  - media permission checks
  - gallery picker launch
  - selected screenshot merge/remove state
  - screenshot analyze submission
  - API error mapping to UI copy
- `src/screens/jobScreenshotUploadCore.ts` owns pure screenshot helpers for:
  - picker asset normalization
  - screenshot selection limits and dedupe
  - scanner import payload mapping
  - screenshot-specific error text decisions
- `src/screens/screenshot/*` now owns screen-local presentation splits:
  - header
  - summary card
  - screenshot gallery
  - upload/analyze actions

## Challenge/Blocked Content Guard

- `isLikelyChallengeAnalysis(...)` detects likely anti-bot/security pages.
- If detected in last-scan restore, cached entry is cleared and not rendered as usable result.
- If detected in tapped history entry, scanner history-result mode shows blocked error state and recommends re-run or screenshot fallback.

## Screenshot Fallback Rules

- Fallback CTA ("Scan from screenshots") is shown only when:
  - there is an error state,
  - error code is in `SCREENSHOT_FALLBACK_ERROR_CODES`,
  - scan is not loading.
- Allowed error codes for fallback:
  - `blocked`
  - `login_wall`
  - `not_found`
  - `provider_failed`
- `usage_limit_reached` does not offer screenshot fallback; it offers premium upsell CTA.

## Screenshot Upload Flow Constraints

- Upload screen accepts 1 to 6 screenshots (`MAX_SCREENSHOTS = 6`).
- Upload screen explains the minimum visible fields before selection:
  - role title
  - company name
  - job description or responsibilities
- Optional helpful fields shown to the user: location, seniority, employment type.
- Client validates per-image and total payload size before submitting.
- Per-image base64 payload is sent to `POST /api/jobs/analyze-screenshots`.
- On success, user is navigated back to `Scanner` with imported analysis payload and meta.
- Picker selection is deduped by image `uri` on-device before submit.
- Error mapping has dedicated texts for:
  - `screenshot_not_vacancy`
  - `screenshot_incomplete_info` with core missing fields only
  - `usage_limit_reached`

## Related Files

- `src/screens/ScannerScreen.tsx`
- `src/screens/ScannerHistoryScreen.tsx`
- `src/screens/useScannerRuntime.ts`
- `src/screens/scannerRuntimeCore.ts`
- `src/screens/scanner/ScannerSearchPanel.tsx`
- `src/screens/scanner/ScannerHistorySection.tsx`
- `src/screens/scanner/ScannerFeedbackCard.tsx`
- `src/screens/scanner/ScannerAnalysisSection.tsx`
- `src/screens/scannerUtils.ts`
- `src/screens/JobScreenshotUploadScreen.tsx`
- `src/screens/useJobScreenshotUploadRuntime.ts`
- `src/screens/jobScreenshotUploadCore.ts`
- `src/screens/screenshot/JobScreenshotUploadHeader.tsx`
- `src/screens/screenshot/JobScreenshotUploadSummaryCard.tsx`
- `src/screens/screenshot/JobScreenshotGallery.tsx`
- `src/screens/screenshot/JobScreenshotUploadActions.tsx`
- `src/utils/jobScanSessionCache.ts`
- `src/utils/jobScanStorage.ts`
- `src/utils/jobScanHistoryStorage.ts`
