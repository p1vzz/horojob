type JobSource = 'linkedin' | 'wellfound' | 'ziprecruiter' | 'indeed' | 'glassdoor' | 'manual';
type JobProviderName = 'http_fetch' | 'browser_fallback' | 'screenshot_vision';
type UsagePlan = 'free' | 'premium';
const JOB_SOURCES = ['linkedin', 'wellfound', 'ziprecruiter', 'indeed', 'glassdoor', 'manual'] as const;
const JOB_PROVIDERS = ['http_fetch', 'browser_fallback', 'screenshot_vision'] as const;
const USAGE_PLANS = ['free', 'premium'] as const;
const USAGE_PERIODS = ['rolling_7_days', 'daily_utc'] as const;
const PRELIGHT_NEXT_STAGES = [
  'done',
  'running_scoring',
  'normalizing_job_payload',
  'cooldown',
  'fetching_http_fetch',
] as const;
const NEGATIVE_CACHE_STATUSES = ['blocked', 'login_wall', 'not_found'] as const;

function asRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  return input as Record<string, unknown>;
}

function asString(input: unknown, fallback = '') {
  return typeof input === 'string' ? input : fallback;
}

function asNullableString(input: unknown) {
  return typeof input === 'string' ? input : null;
}

function asBoolean(input: unknown, fallback = false) {
  return typeof input === 'boolean' ? input : fallback;
}

function asNumber(input: unknown, fallback = 0) {
  return typeof input === 'number' && Number.isFinite(input) ? input : fallback;
}

function asStringArray(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function isOneOf<const TValues extends readonly string[]>(values: TValues, input: unknown): input is TValues[number] {
  return typeof input === 'string' && values.includes(input);
}

function normalizeJobSource(input: unknown): JobSource {
  return isOneOf(JOB_SOURCES, input) ? input : 'manual';
}

function normalizeJobProvider(input: unknown): JobProviderName | 'manual' | null {
  if (input === 'manual') return 'manual';
  if (isOneOf(JOB_PROVIDERS, input)) return input;
  return null;
}

function parseUsageLimit(input: unknown): JobUsageLimit {
  const payload = asRecord(input);
  return {
    plan: payload && isOneOf(USAGE_PLANS, payload.plan) ? payload.plan : 'free',
    period: payload && isOneOf(USAGE_PERIODS, payload.period) ? payload.period : 'rolling_7_days',
    limit: payload ? asNumber(payload.limit) : 0,
    used: payload ? asNumber(payload.used) : 0,
    remaining: payload ? asNumber(payload.remaining) : 0,
    nextAvailableAt: payload ? asNullableString(payload.nextAvailableAt) : null,
    canProceed: payload ? asBoolean(payload.canProceed, true) : true,
  };
}

function parseJobPreflightResponse(input: unknown): JobPreflightResponse {
  const payload = asRecord(input);
  const routing = asRecord(payload?.routing);
  const cache = asRecord(payload?.cache);
  const rawCache = asRecord(cache?.raw);
  const parsedCache = asRecord(cache?.parsed);
  const analysisCache = asRecord(cache?.analysis);
  const negativeCache = asRecord(cache?.negative);
  const versions = asRecord(payload?.versions);

  return {
    source: normalizeJobSource(payload?.source),
    canonicalUrl: asString(payload?.canonicalUrl),
    canonicalUrlHash: asString(payload?.canonicalUrlHash),
    sourceJobId: asNullableString(payload?.sourceJobId),
    routing: {
      primary: isOneOf(JOB_PROVIDERS, routing?.primary) ? routing.primary : 'http_fetch',
      fallback: isOneOf(JOB_PROVIDERS, routing?.fallback) ? routing.fallback : 'browser_fallback',
    },
    nextStage: payload && isOneOf(PRELIGHT_NEXT_STAGES, payload.nextStage) ? payload.nextStage : 'fetching_http_fetch',
    cache: {
      raw: {
        hit: asBoolean(rawCache?.hit),
        updatedAt: asNullableString(rawCache?.updatedAt),
      },
      parsed: {
        hit: asBoolean(parsedCache?.hit),
        parserVersion: asNullableString(parsedCache?.parserVersion),
        updatedAt: asNullableString(parsedCache?.updatedAt),
      },
      analysis: {
        hit: asBoolean(analysisCache?.hit),
        rubricVersion: asNullableString(analysisCache?.rubricVersion),
        modelVersion: asNullableString(analysisCache?.modelVersion),
        updatedAt: asNullableString(analysisCache?.updatedAt),
      },
      negative: {
        hit: asBoolean(negativeCache?.hit),
        status:
          negativeCache && isOneOf(NEGATIVE_CACHE_STATUSES, negativeCache.status) ? negativeCache.status : null,
        retryAt: asNullableString(negativeCache?.retryAt),
      },
    },
    limit: parseUsageLimit(payload?.limit),
    versions: {
      parserVersion: asString(versions?.parserVersion, 'unknown'),
      rubricVersion: asString(versions?.rubricVersion, 'unknown'),
      modelVersion: asString(versions?.modelVersion, 'unknown'),
    },
  };
}

function parseBreakdownItem(input: unknown, index: number): JobAnalysisBreakdownItem | null {
  const payload = asRecord(input);
  if (!payload) return null;

  return {
    key: asString(payload.key, `breakdown-${index}`),
    label: asString(payload.label, 'Signal'),
    score: asNumber(payload.score),
    note: asString(payload.note),
  };
}

function parseProviderAttempt(input: unknown) {
  const payload = asRecord(input);
  if (!payload) return null;

  return {
    provider: asString(payload.provider, 'unknown'),
    ok: asBoolean(payload.ok),
    reason: asString(payload.reason),
    statusCode: typeof payload.statusCode === 'number' && Number.isFinite(payload.statusCode) ? payload.statusCode : null,
  };
}

function parseJobAnalyzeSuccessResponse(input: unknown): JobAnalyzeSuccessResponse {
  const payload = asRecord(input);
  const cache = asRecord(payload?.cache);
  const usage = asRecord(payload?.usage);
  const versions = asRecord(payload?.versions);
  const scores = asRecord(payload?.scores);
  const job = asRecord(payload?.job);
  const screenshot = asRecord(payload?.screenshot);

  const providerAttempts = Array.isArray(payload?.providerAttempts)
    ? payload.providerAttempts
        .map((attempt) => parseProviderAttempt(attempt))
        .filter((attempt): attempt is NonNullable<ReturnType<typeof parseProviderAttempt>> => attempt !== null)
    : undefined;

  return {
    analysisId: asString(payload?.analysisId, 'unknown-analysis'),
    status: 'done',
    providerUsed: normalizeJobProvider(payload?.providerUsed),
    providerAttempts,
    cached: asBoolean(payload?.cached),
    cache: {
      raw: asBoolean(cache?.raw),
      parsed: asBoolean(cache?.parsed),
      analysis: asBoolean(cache?.analysis),
    },
    usage: {
      plan: usage && isOneOf(USAGE_PLANS, usage.plan) ? usage.plan : 'free',
      incremented: asBoolean(usage?.incremented),
      limit: usage?.limit ? parseUsageLimit(usage.limit) : undefined,
    },
    versions: {
      parserVersion: asString(versions?.parserVersion, 'unknown'),
      rubricVersion: asString(versions?.rubricVersion, 'unknown'),
      modelVersion: asString(versions?.modelVersion, 'unknown'),
    },
    scores: {
      compatibility: asNumber(scores?.compatibility),
      aiReplacementRisk: asNumber(scores?.aiReplacementRisk),
      overall: asNumber(scores?.overall),
    },
    breakdown: Array.isArray(payload?.breakdown)
      ? payload.breakdown
          .map((item, index) => parseBreakdownItem(item, index))
          .filter((item): item is JobAnalysisBreakdownItem => item !== null)
      : [],
    jobSummary: asString(payload?.jobSummary),
    tags: asStringArray(payload?.tags),
    descriptors: asStringArray(payload?.descriptors),
    job: job
      ? {
          title: asString(job.title, 'Role not detected'),
          company: asNullableString(job.company),
          location: asNullableString(job.location),
          employmentType: asNullableString(job.employmentType),
          source: normalizeJobSource(job.source),
        }
      : undefined,
    screenshot: screenshot
      ? {
          imageCount: asNumber(screenshot.imageCount),
          confidence: asNumber(screenshot.confidence),
          reason: asString(screenshot.reason),
        }
      : undefined,
  };
}

export type JobUsageLimit = {
  plan: UsagePlan;
  period: 'rolling_7_days' | 'daily_utc';
  limit: number;
  used: number;
  remaining: number;
  nextAvailableAt: string | null;
  canProceed: boolean;
};

export type JobPreflightResponse = {
  source: JobSource;
  canonicalUrl: string;
  canonicalUrlHash: string;
  sourceJobId: string | null;
  routing: {
    primary: JobProviderName;
    fallback: JobProviderName;
  };
  nextStage: 'done' | 'running_scoring' | 'normalizing_job_payload' | 'cooldown' | 'fetching_http_fetch';
  cache: {
    raw: { hit: boolean; updatedAt: string | null };
    parsed: { hit: boolean; parserVersion: string | null; updatedAt: string | null };
    analysis: { hit: boolean; rubricVersion: string | null; modelVersion: string | null; updatedAt: string | null };
    negative: { hit: boolean; status: 'blocked' | 'login_wall' | 'not_found' | null; retryAt: string | null };
  };
  limit: JobUsageLimit;
  versions: {
    parserVersion: string;
    rubricVersion: string;
    modelVersion: string;
  };
};

export type JobAnalysisBreakdownItem = {
  key: string;
  label: string;
  score: number;
  note: string;
};

export type JobAnalyzeSuccessResponse = {
  analysisId: string;
  status: 'done';
  providerUsed: JobProviderName | 'manual' | null;
  providerAttempts?: Array<{
    provider: string;
    ok: boolean;
    reason: string;
    statusCode: number | null;
  }>;
  cached: boolean;
  cache: {
    raw: boolean;
    parsed: boolean;
    analysis: boolean;
  };
  usage: {
    plan: UsagePlan;
    incremented: boolean;
    limit?: JobUsageLimit;
  };
  versions: {
    parserVersion: string;
    rubricVersion: string;
    modelVersion: string;
  };
  scores: {
    compatibility: number;
    aiReplacementRisk: number;
    overall: number;
  };
  breakdown: JobAnalysisBreakdownItem[];
  jobSummary: string;
  tags: string[];
  descriptors?: string[];
  job?: {
    title: string;
    company: string | null;
    location: string | null;
    employmentType: string | null;
    source: JobSource;
  };
  screenshot?: {
    imageCount: number;
    confidence: number;
    reason: string;
  };
};

export type JobAnalyzeErrorCode =
  | 'unsupported_path'
  | 'unsupported_source'
  | 'unsupported_protocol'
  | 'invalid_url'
  | 'usage_limit_reached'
  | 'blocked'
  | 'login_wall'
  | 'not_found'
  | 'provider_failed'
  | 'screenshot_not_vacancy'
  | 'screenshot_incomplete_info'
  | 'screenshot_parse_failed';

export type JobAnalyzeErrorPayload = {
  error?: string;
  code?: JobAnalyzeErrorCode;
  retryAt?: string;
  limit?: JobUsageLimit;
  attempts?: Array<{
    provider: string;
    ok: boolean;
    reason: string;
    statusCode: number | null;
  }>;
  [key: string]: unknown;
};

export type JobMetricsSourceReport = {
  source: JobSource;
  rawFetches: number;
  negativeEvents: number;
  parsedDocs: number;
  successRatePct: number | null;
  browserFallbackRatePct: number | null;
  providerCounts: Record<string, number>;
  responseClassCounts: Record<string, number>;
  pageAccessCounts: Record<string, number>;
  negativeCounts: Record<string, number>;
  parseConfidence: {
    samples: number;
    average: number | null;
    min: number | null;
    max: number | null;
  };
};

export type JobMetricsReport = {
  window: {
    hours: number;
    from: string;
    to: string;
  };
  totals: {
    rawFetches: number;
    negativeEvents: number;
    parsedDocs: number;
  };
  sources: JobMetricsSourceReport[];
};

export type JobMetricsAlert = {
  id: string;
  severity: 'warn' | 'critical';
  source: JobSource;
  metric: 'blocked_rate' | 'browser_fallback_rate' | 'success_rate';
  valuePct: number;
  thresholdPct: number;
  message: string;
};

export type JobMetricsAlertsReport = {
  generatedAt: string;
  window: JobMetricsReport['window'];
  thresholds: {
    minEvents: number;
    blockedRatePct: number;
    browserFallbackRatePct: number;
    successRateMinPct: number;
  };
  hasAlerts: boolean;
  alerts: JobMetricsAlert[];
};

export type JobsApiDeps = {
  authorizedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

export function createJobsApi(deps: JobsApiDeps) {
  const preflightJobUrl = async (url: string) => {
    const response = await deps.authorizedFetch('/api/jobs/preflight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to preflight vacancy URL', payload);
    }
    return parseJobPreflightResponse(payload);
  };

  const analyzeJobUrl = async (url: string, regenerate = false) => {
    const response = await deps.authorizedFetch('/api/jobs/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, regenerate }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to analyze vacancy URL', payload);
    }
    return parseJobAnalyzeSuccessResponse(payload);
  };

  const analyzeJobScreenshots = async (screenshots: string[], regenerate = false) => {
    const response = await deps.authorizedFetch('/api/jobs/analyze-screenshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screenshots: screenshots.map((dataUrl) => ({ dataUrl })),
        regenerate,
      }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to analyze vacancy screenshots', payload);
    }
    return parseJobAnalyzeSuccessResponse(payload);
  };

  const fetchJobMetrics = async (windowHours = 24) => {
    const response = await deps.authorizedFetch(`/api/jobs/metrics?windowHours=${windowHours}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch parser metrics', payload);
    }
    return payload as JobMetricsReport;
  };

  const fetchJobAlerts = async (windowHours = 24) => {
    const response = await deps.authorizedFetch(`/api/jobs/alerts?windowHours=${windowHours}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch parser alerts', payload);
    }
    return payload as JobMetricsAlertsReport;
  };

  return {
    preflightJobUrl,
    analyzeJobUrl,
    analyzeJobScreenshots,
    fetchJobMetrics,
    fetchJobAlerts,
  };
}
