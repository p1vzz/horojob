# Job Scraping Operations Policy (Server)
**Version:** 1.0  
**Status:** Active  
**Owner:** Backend

## 0. Repo Topology and DB Access
- Backend server code is located in `../horojob-server`.
- MongoDB access is configured through a Mongo connection string in the server `.env` file.

## 1. Purpose
- Keep scraping stable, low-intensity, and cost-efficient.
- Avoid bursty traffic and uncontrolled retries.
- Prefer predictable quality over raw speed.

## 2. Traffic Control Architecture
Use centralized scheduling, not free-form parallel requests.

```text
ingestion queue
  -> source rate limiter (token/leaky bucket)
  -> bounded worker pool
  -> retry queue with backoff
  -> browser fallback queue (separate + strict cap)
```

## 3. Core Controls
- Global limiter by source/domain.
- Per-worker limiter.
- Separate heavier budget for browser requests.
- Source-level concurrency caps (HTTP and browser independently).
- Session-level caps for requests per active session.

## 4. Pacing Rules
- No fixed intervals like exact `500ms`.
- Use randomized delay (jitter) per source.
- Adaptive slowdown after `429/403/challenge`.
- Slow-start on new worker/session, then gradual ramp-up.

## 5. Retry + Backoff Rules
- Retry only transient failures (`429`, selected `5xx`, network timeout).
- Exponential backoff with jitter.
- Hard retry limits per request class.
- Circuit breaker when block/error threshold is exceeded.
- Cooldown window before recovery attempts.

## 6. Queue Classes
- `queue_http_primary` for normal HTTP fetches.
- `queue_http_retry` for controlled retries.
- `queue_browser_fallback` for expensive fallback only.

Browser queue must never starve normal HTTP ingestion.

## 7. Session Policy
- Reuse short-lived stable sessions (HTTP cookie jar / browser context).
- Session lifetime target: `10-30 min`, then rotate.
- Avoid per-request session/IP churn.
- Keep request headers and request shape consistent.

## 8. Response Classification
Do not treat every `200` as success. Classify each fetch:
- `ok_full`
- `ok_partial`
- `soft_block`
- `hard_block`
- `captcha`
- `login_wall`
- `empty`
- `not_found`

Actions are driven by class:
- save;
- retry;
- slowdown;
- browser fallback;
- skip/cooldown.

## 9. Cache + Freshness Policy
- Cache canonical URL resolution.
- Cache raw HTML and normalized payload.
- Cache negative outcomes (`login_wall`, `not_found`, `hard_block`) with TTL.
- Re-fetch frequency by freshness bucket:
  - new jobs: high frequency;
  - older jobs: lower frequency;
  - closed/not found: near-zero frequency.

## 10. Browser Fallback Policy
- Browser is a costly resource, not default path.
- Required controls:
  - dedicated queue;
  - strict per-source browser concurrency;
  - hard page timeout;
  - context/session reuse;
  - screenshot on error only.
- Do not send known login-only/hard-wall URLs to browser repeatedly.

## 11. Observability + Alerts
Track per source:
- success rate;
- partial rate;
- `403/429` rate;
- captcha/login wall rate;
- p50/p95 latency;
- requests per minute;
- browser fallback rate;
- success by session.

Recommended alerts:
- `429_rate > 3%` for 10 minutes;
- `soft_block_rate` doubled vs previous 30 minutes;
- `browser_fallback_rate > 20%` for 15 minutes.

Current implementation hooks:
- `GET /api/jobs/metrics?windowHours=24` for source-level quality metrics.
- `GET /api/jobs/alerts?windowHours=24` for threshold-based alert evaluation.
- background scheduler logs active alerts at a configured interval (`JOB_METRICS_ALERT_CHECK_INTERVAL_SECONDS`).

## 12. Baseline MVP Configuration
### HTTP
- Global concurrency: `5-10`
- Per-source HTTP concurrency:
  - linkedin: `2`
  - wellfound: `2`
  - ziprecruiter: `2`
  - indeed: `2-3`
  - glassdoor: `1`
- Random delay range: `800-2500 ms`
- Retry limit: `2`
- Backoff: exponential + jitter

### Browser
- Per-source browser concurrency: `1-2` (glassdoor starts at `1`)
- Page timeout: `20-40 s`
- Context/session reuse: enabled
- Screenshots: on error only

## 13. Source Policy Config (Template)
```yaml
linkedin:
  http_concurrency: 2
  browser_concurrency: 1
  min_delay_ms: 1200
  max_delay_ms: 3000
  retry_limit: 2
  cooldown_on_429_s: 900

wellfound:
  http_concurrency: 2
  browser_concurrency: 0
  min_delay_ms: 900
  max_delay_ms: 2200
  retry_limit: 2
  cooldown_on_429_s: 600

ziprecruiter:
  http_concurrency: 2
  browser_concurrency: 1
  min_delay_ms: 800
  max_delay_ms: 2000
  retry_limit: 2
  cooldown_on_429_s: 600

indeed:
  http_concurrency: 3
  browser_concurrency: 1
  min_delay_ms: 800
  max_delay_ms: 2200
  retry_limit: 2
  cooldown_on_429_s: 600

glassdoor:
  http_concurrency: 1
  browser_concurrency: 1
  min_delay_ms: 1500
  max_delay_ms: 4000
  retry_limit: 1
  cooldown_on_429_s: 1200
```

## 14. Compliance Notes
- Respect robots.txt, source terms, and legal constraints in each target market.
- Keep scraping limited to allowed/public pages in current MVP scope.
- LinkedIn login-only pages are explicitly out of scope.
