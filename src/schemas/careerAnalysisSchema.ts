import { z } from 'zod';

/**
 * Zod schemas for Career Analysis responses
 */

export const CareerInsightSchema = z.object({
  title: z.string(),
  tag: z.string(),
  description: z.string(),
  actions: z.array(z.string()),
});

export const CareerInsightsResponseSchema = z.object({
  tier: z.enum(['free', 'premium']),
  cached: z.boolean(),
  promptVersion: z.string(),
  model: z.string(),
  summary: z.string(),
  generatedAt: z.string(),
  insights: z.array(CareerInsightSchema),
});

export const FullNatalCareerArchetypeSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  evidence: z.array(z.string()),
});

export const FullNatalCareerStrengthSchema = z.object({
  title: z.string(),
  details: z.string(),
  evidence: z.array(z.string()),
});

export const FullNatalCareerBlindSpotSchema = z.object({
  title: z.string(),
  risk: z.string(),
  mitigation: z.string(),
  evidence: z.array(z.string()),
});

export const FullNatalCareerRoleFitSchema = z.object({
  domain: z.string(),
  fitScore: z.number().min(0).max(100),
  why: z.string(),
  exampleRoles: z.array(z.string()),
});

export const FullNatalCareerPhasePlanSchema = z.object({
  phase: z.enum(['0_6_months', '6_18_months', '18_36_months']),
  goal: z.string(),
  actions: z.array(z.string()),
  kpis: z.array(z.string()),
  risks: z.array(z.string()),
});

export const FullNatalCareerAnalysisSchema = z.object({
  schemaVersion: z.string(),
  headline: z.string(),
  executiveSummary: z.string(),
  careerArchetypes: z.array(FullNatalCareerArchetypeSchema),
  strengths: z.array(FullNatalCareerStrengthSchema),
  blindSpots: z.array(FullNatalCareerBlindSpotSchema),
  roleFitMatrix: z.array(FullNatalCareerRoleFitSchema),
  phasePlan: z.array(FullNatalCareerPhasePlanSchema),
  decisionRules: z.array(z.string()),
  next90DaysPlan: z.array(z.string()),
});

export const MarketCareerPathSchema = z.object({
  slug: z.string(),
  title: z.string(),
  domain: z.string(),
  fitScore: z.number().min(0).max(100),
  fitLabel: z.string(),
  opportunityScore: z.number().min(0).max(100),
  rationale: z.string(),
  developmentVector: z.string(),
  exampleRoles: z.array(z.string()),
  tags: z.array(z.string()),
  salaryRangeLabel: z.string().nullable(),
  marketGradient: z.enum(['high_upside', 'steady_growth', 'stable_floor', 'niche_path', 'limited_data']),
  marketScoreLabel: z.string().nullable(),
  demandLabel: z.string().nullable(),
  sourceRoleTitle: z.string().nullable(),
  market: z.unknown().nullable(),
});

export const FullNatalCareerAnalysisResponseSchema = z.object({
  cached: z.boolean(),
  promptVersion: z.string(),
  model: z.string(),
  narrativeSource: z.literal('llm'),
  generatedAt: z.string(),
  profileUpdatedAt: z.string().optional(),
  profileChangeNotice: z
    .object({
      profileUpdatedAt: z.string(),
      expiresAt: z.string(),
    })
    .nullable()
    .optional(),
  marketContext: z
    .object({
      algorithmVersion: z.string(),
      generatedAt: z.string(),
      location: z.string(),
      sourceNote: z.string(),
    })
    .nullable()
    .optional(),
  marketCareerPaths: z.array(MarketCareerPathSchema).optional(),
  analysis: FullNatalCareerAnalysisSchema,
});

export const DiscoverRolesResponseSchema = z.object({
  algorithmVersion: z.string(),
  cached: z.boolean(),
  generatedAt: z.string(),
  rankingMode: z.enum(['fit', 'opportunity']).default('fit'),
  query: z.string(),
  recommended: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      domain: z.string(),
      score: z.number().min(0).max(100),
      scoreLabel: z.string(),
      reason: z.string(),
      tags: z.array(z.string()),
      source: z.object({
        provider: z.enum(['onetonline', 'manual']),
        code: z.string().nullable(),
        url: z.string().nullable(),
      }),
      market: z.unknown().nullable().optional(),
      opportunityScore: z.number().min(0).max(100).optional(),
    })
  ),
  search: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      domain: z.string(),
      tags: z.array(z.string()),
      score: z.number().min(0).max(100).optional(),
      scoreLabel: z.string().optional(),
      scoreStatus: z.enum(['ready', 'deferred']).optional(),
      market: z.unknown().nullable().optional(),
      opportunityScore: z.number().min(0).max(100).nullable().optional(),
    })
  ),
  meta: z.object({
    catalogSize: z.number(),
    signals: z.array(z.string()),
  }),
});

// Type inference
export type CareerInsightsResponse = z.infer<typeof CareerInsightsResponseSchema>;
export type FullNatalCareerAnalysisResponse = z.infer<typeof FullNatalCareerAnalysisResponseSchema>;
export type DiscoverRolesResponse = z.infer<typeof DiscoverRolesResponseSchema>;
