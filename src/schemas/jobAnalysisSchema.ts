import { z } from 'zod';

/**
 * Zod schemas for Job Analysis responses
 */

export const JobSourceSchema = z.enum(['linkedin', 'wellfound', 'ziprecruiter', 'indeed', 'glassdoor', 'manual']);
export const JobProviderSchema = z.enum(['http_fetch', 'browser_fallback', 'screenshot_vision', 'manual']);
export const UsagePlanSchema = z.enum(['free', 'premium']);
export const UsagePeriodSchema = z.enum(['rolling_7_days', 'daily_utc']);
export const NegativeCacheStatusSchema = z.enum(['blocked', 'login_wall', 'not_found']);

export const JobUsageLimitSchema = z.object({
  plan: UsagePlanSchema,
  period: UsagePeriodSchema,
  limit: z.number(),
  used: z.number(),
  remaining: z.number(),
  nextAvailableAt: z.string().nullable(),
  canProceed: z.boolean(),
});

export const JobPreflightResponseSchema = z.object({
  source: JobSourceSchema,
  canonicalUrl: z.string(),
  canonicalUrlHash: z.string(),
  sourceJobId: z.string().nullable(),
  routing: z.object({
    primary: JobProviderSchema,
    fallback: JobProviderSchema,
  }),
  nextStage: z.enum(['done', 'running_scoring', 'normalizing_job_payload', 'cooldown', 'fetching_http_fetch']),
  cache: z.object({
    raw: z.object({
      hit: z.boolean(),
      updatedAt: z.string().nullable(),
    }),
    parsed: z.object({
      hit: z.boolean(),
      parserVersion: z.string().nullable(),
      updatedAt: z.string().nullable(),
    }),
    analysis: z.object({
      hit: z.boolean(),
      rubricVersion: z.string().nullable(),
      modelVersion: z.string().nullable(),
      updatedAt: z.string().nullable(),
    }),
    negative: z.object({
      hit: z.boolean(),
      status: NegativeCacheStatusSchema.nullable(),
      retryAt: z.string().nullable(),
    }),
  }),
  limit: JobUsageLimitSchema,
  versions: z.object({
    parserVersion: z.string(),
    rubricVersion: z.string(),
    modelVersion: z.string(),
  }),
});

export const JobAnalysisBreakdownItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(),
  note: z.string(),
});

export const JobCompatibilityBreakdownSchema = z.object({
  overall: z.array(JobAnalysisBreakdownItemSchema),
  technical: z.array(JobAnalysisBreakdownItemSchema),
  soft: z.array(JobAnalysisBreakdownItemSchema),
  cultural: z.array(JobAnalysisBreakdownItemSchema),
});

export const JobProviderAttemptSchema = z.object({
  provider: z.string(),
  ok: z.boolean(),
  reason: z.string(),
  statusCode: z.number().nullable(),
});

export const JobAnalyzeSuccessResponseSchema = z.object({
  analysisId: z.string(),
  status: z.literal('done'),
  providerUsed: JobProviderSchema.nullable(),
  providerAttempts: z.array(JobProviderAttemptSchema).optional(),
  cached: z.boolean(),
  cache: z.object({
    raw: z.boolean(),
    parsed: z.boolean(),
    analysis: z.boolean(),
  }),
  usage: z.object({
    plan: UsagePlanSchema,
    incremented: z.boolean(),
    limit: JobUsageLimitSchema.optional(),
  }),
  versions: z.object({
    parserVersion: z.string(),
    rubricVersion: z.string(),
    modelVersion: z.string(),
  }),
  scores: z.object({
    compatibility: z.number(),
    aiReplacementRisk: z.number(),
    overall: z.number(),
  }),
  breakdown: z.array(JobAnalysisBreakdownItemSchema),
  jobSummary: z.string(),
  tags: z.array(z.string()),
  descriptors: z.array(z.string()).optional(),
  job: z
    .object({
      title: z.string(),
      company: z.string().nullable(),
      location: z.string().nullable(),
      employmentType: z.string().nullable(),
      source: JobSourceSchema,
    })
    .optional(),
  screenshot: z
    .object({
      imageCount: z.number(),
      confidence: z.number(),
      reason: z.string(),
    })
    .optional(),
});

// Type inference
export type JobPreflightResponse = z.infer<typeof JobPreflightResponseSchema>;
export type JobAnalyzeSuccessResponse = z.infer<typeof JobAnalyzeSuccessResponseSchema>;
export type JobUsageLimit = z.infer<typeof JobUsageLimitSchema>;
export type JobCompatibilityBreakdown = z.infer<typeof JobCompatibilityBreakdownSchema>;
