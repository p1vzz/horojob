import type { JobAnalyzeSuccessResponse, JobUsageLimit } from '../services/jobsApiCore';

export type ScannerPhase = 'idle' | 'preflight' | 'fetching' | 'scoring';

export type ScannerErrorState = {
  code: string;
  message: string;
  retryAt: string | null;
  usageContext: string | null;
};

type SourceHintTone = 'neutral' | 'positive' | 'warning';

export type SourceHintState = {
  tone: SourceHintTone;
  message: string;
};

export const ERROR_TEXTS: Record<string, string> = {
  unsupported_path: 'This URL is not supported by the current parser.',
  unsupported_source: 'This source is not supported yet.',
  unsupported_protocol: 'Only https links are supported.',
  invalid_url: 'Invalid link format. Please paste a full vacancy URL.',
  usage_limit_reached: 'You reached your plan limit for vacancy scans.',
  blocked:
    'This job board is temporarily blocking automated access. Upload screenshots of the vacancy and we can scan the visible details.',
  login_wall:
    'This vacancy requires sign-in or is not public. Open it in your app or browser, take screenshots, and upload them here.',
  not_found:
    'This job posting may be closed or unavailable. If you can still see it in your browser, upload screenshots instead.',
  provider_failed:
    'We could not read enough vacancy details from this link. Upload screenshots of the title, company, and job description.',
  screenshot_not_vacancy: 'Uploaded screenshots do not look like a vacancy page.',
  screenshot_incomplete_info: 'Not enough vacancy details are visible in screenshots.',
  screenshot_parse_failed: 'Screenshot parsing failed. Please try again.',
  cooldown: 'This URL is in cooldown. Please retry later.',
  unknown: 'Unable to process this vacancy right now. Please try again.',
};

export const SCREENSHOT_FALLBACK_GUIDANCE =
  'Screenshots should include the job title, company name, and description.';

export const SCREENSHOT_FALLBACK_ERROR_CODES = new Set([
  'blocked',
  'login_wall',
  'not_found',
  'provider_failed',
]);

function tryParseInputUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function hostNameWithoutWww(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

export function sourceHintFromUrl(raw: string): SourceHintState {
  if (raw.trim().length === 0) {
    return {
      tone: 'neutral',
      message: 'Supported sources: LinkedIn, Wellfound, ZipRecruiter, Indeed, Glassdoor.',
    };
  }

  const parsed = tryParseInputUrl(raw);
  if (!parsed) {
    return {
      tone: 'warning',
      message: 'URL format looks invalid. Paste a full https vacancy link.',
    };
  }

  const host = hostNameWithoutWww(parsed.hostname);
  const path = parsed.pathname.toLowerCase();

  if (host.includes('linkedin.com')) {
    const hasCurrentJobId = /^\d+$/.test(parsed.searchParams.get('currentJobId')?.trim() ?? '');
    const hasJobsPath = path === '/jobs' || path.startsWith('/jobs/');
    if (/\/jobs\/view\/(?:[^/]+-)?\d+/i.test(path) || (hasJobsPath && hasCurrentJobId)) {
      return {
        tone: 'positive',
        message: 'LinkedIn job posting URL detected.',
      };
    }
    return {
      tone: 'warning',
      message: 'LinkedIn hint: use /jobs/view/<id> or a jobs link with currentJobId.',
    };
  }

  if (host.includes('wellfound.com')) {
    if (path.includes('/jobs/') || path.includes('/job/')) {
      return {
        tone: 'positive',
        message: 'Wellfound job detail URL detected.',
      };
    }
    return {
      tone: 'warning',
      message: 'Wellfound hint: paste a job detail page, not search/auth/apply flow.',
    };
  }

  if (host.includes('ziprecruiter.com')) {
    if (path.includes('/jobs/') || path.includes('/job/')) {
      return {
        tone: 'positive',
        message: 'ZipRecruiter job detail URL detected.',
      };
    }
    return {
      tone: 'warning',
      message: 'ZipRecruiter hint: expected /jobs/... or /job/... path.',
    };
  }

  if (host.includes('indeed.com')) {
    if (path.includes('/viewjob') || path.includes('/job/')) {
      return {
        tone: 'positive',
        message: 'Indeed job detail URL detected.',
      };
    }
    return {
      tone: 'warning',
      message: 'Indeed hint: expected /viewjob?jk=... or /job/... URL.',
    };
  }

  if (host.includes('glassdoor.com')) {
    if (path.includes('/job-listing') || parsed.searchParams.has('jl')) {
      return {
        tone: 'positive',
        message: 'Glassdoor job detail URL detected.',
      };
    }
    return {
      tone: 'warning',
      message: 'Glassdoor hint: use a concrete /job-listing page or URL with jl parameter.',
    };
  }

  return {
    tone: 'warning',
    message: 'Unsupported source. Use LinkedIn, Wellfound, ZipRecruiter, Indeed, or Glassdoor.',
  };
}

export function toPhaseSubtitle(phase: ScannerPhase) {
  switch (phase) {
    case 'preflight':
      return 'Validating source and checking cached data...';
    case 'fetching':
      return 'Fetching vacancy content from source...';
    case 'scoring':
      return 'Matching vacancy against your natal chart...';
    case 'idle':
    default:
      return 'Preparing scan...';
  }
}

export function toPhaseTitle(phase: ScannerPhase) {
  switch (phase) {
    case 'preflight':
      return 'Preparing Analysis';
    case 'fetching':
      return 'Reading Vacancy';
    case 'scoring':
      return 'Scoring Compatibility';
    case 'idle':
    default:
      return 'Loading';
  }
}

export function formatRetryAt(iso: string | null) {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

export function formatScreenshotConfidence(input: number) {
  if (!Number.isFinite(input)) return 'n/a';
  const normalized = input <= 1 ? input * 100 : input;
  const bounded = Math.max(0, Math.min(100, normalized));
  return `${Math.round(bounded)}%`;
}

export function isLikelyChallengeAnalysis(analysis: JobAnalyzeSuccessResponse | null | undefined) {
  if (!analysis) return false;
  const title = analysis.job?.title ?? '';
  const summary = analysis.jobSummary ?? '';
  const tags = Array.isArray(analysis.tags) ? analysis.tags.join(' ') : '';
  const text = `${title}\n${summary}\n${tags}`.toLowerCase();

  return (
    /just a moment/.test(text) ||
    /\bsecurity\s*\|\s*(glassdoor|indeed|linkedin|ziprecruiter|wellfound)\b/.test(text) ||
    /checking your browser/.test(text) ||
    /checking if the site connection is secure/.test(text) ||
    /enable javascript and cookies/.test(text) ||
    /cf-ray/.test(text) ||
    /cdn-cgi/.test(text) ||
    /cloudflare/.test(text)
  );
}

function formatLimitPeriod(period: JobUsageLimit['period']) {
  if (period === 'rolling_7_days') return 'rolling 7 days';
  return 'daily UTC';
}

function formatLimitDepth(depth: JobUsageLimit['depth']) {
  return depth === 'lite' ? 'Lite' : 'Full';
}

export function toUsageContext(limit: JobUsageLimit | null | undefined) {
  if (!limit) return null;
  return `${formatLimitDepth(limit.depth)} usage: ${limit.used}/${limit.limit} (${formatLimitPeriod(limit.period)})`;
}

function parseUsageLimitPayload(input: unknown): JobUsageLimit | null {
  if (!input || typeof input !== 'object') return null;
  const payload = input as Record<string, unknown>;

  const plan = payload.plan;
  const depth = payload.depth;
  const period = payload.period;
  if ((plan !== 'free' && plan !== 'premium') || (period !== 'rolling_7_days' && period !== 'daily_utc')) {
    return null;
  }

  const limit = typeof payload.limit === 'number' && Number.isFinite(payload.limit) ? payload.limit : null;
  const used = typeof payload.used === 'number' && Number.isFinite(payload.used) ? payload.used : null;
  const remaining =
    typeof payload.remaining === 'number' && Number.isFinite(payload.remaining) ? payload.remaining : null;
  const canProceed = typeof payload.canProceed === 'boolean' ? payload.canProceed : null;
  if (limit === null || used === null || remaining === null || canProceed === null) {
    return null;
  }

  return {
    plan,
    depth: depth === 'lite' || depth === 'full' ? depth : 'full',
    period,
    limit,
    used,
    remaining,
    nextAvailableAt: typeof payload.nextAvailableAt === 'string' ? payload.nextAvailableAt : null,
    canProceed,
  };
}

export function parseScannerApiError(
  error: unknown,
  isApiError: (value: unknown) => value is { status: number; payload: unknown }
): ScannerErrorState {
  if (!isApiError(error)) {
    return {
      code: 'unknown',
      message: ERROR_TEXTS.unknown,
      retryAt: null,
      usageContext: null,
    };
  }

  const payload = error.payload && typeof error.payload === 'object' ? (error.payload as Record<string, unknown>) : null;
  const code = typeof payload?.code === 'string' ? payload.code : 'unknown';
  const messageFromPayload = typeof payload?.error === 'string' ? payload.error : null;
  const retryAtFromPayload = typeof payload?.retryAt === 'string' ? payload.retryAt : null;
  const limitFromPayload = parseUsageLimitPayload(payload?.limit);
  const mappedMessage = code !== 'unknown' ? ERROR_TEXTS[code] : undefined;

  return {
    code,
    message: mappedMessage ?? messageFromPayload ?? ERROR_TEXTS.unknown,
    retryAt: retryAtFromPayload ?? limitFromPayload?.nextAvailableAt ?? null,
    usageContext: toUsageContext(limitFromPayload),
  };
}
