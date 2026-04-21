import { z } from 'zod';

/**
 * Zod schemas for AI Synergy responses
 * Provides runtime validation + type inference
 */

export const ScoredSignalTagSchema = z.object({
  group: z.string(),
  label: z.string(),
  score: z.number(),
  reason: z.string(),
});

export const AiSynergyComponentsSchema = z.object({
  cognitiveFlow: z.number(),
  automationReadiness: z.number(),
  decisionQuality: z.number(),
  collaborationWithAI: z.number(),
});

export const AiSynergySignalsSchema = z.object({
  dominantPlanet: z.string(),
  dominantHouse: z.number(),
  mcSign: z.string().nullable(),
  ascSign: z.string().nullable(),
  positiveAspects: z.number(),
  hardAspects: z.number(),
  positiveAspectStrength: z.number().optional(),
  hardAspectStrength: z.number().optional(),
  secondaryHouse: z.number().nullable().optional(),
  secondaryHouseDensity: z.number().optional(),
  dignityBalance: z.number().optional(),
  momentumScore: z.number().optional(),
  natalTechnicalBias: z.number(),
  natalCommunicationBias: z.number(),
});

export const ConfidenceBreakdownSchema = z.object({
  dataQuality: z.number(),
  coherence: z.number(),
  stability: z.number(),
});

export const AiSynergySchema = z.object({
  algorithmVersion: z.string(),
  dateKey: z.string(),
  narrativeSource: z.literal('llm').nullable(),
  narrativeStatus: z.enum(['ready', 'pending', 'unavailable', 'failed']),
  narrativeFailureCode: z
    .enum([
      'llm_unavailable',
      'llm_unconfigured',
      'llm_timeout',
      'llm_rate_limited',
      'llm_invalid_response',
      'llm_upstream_error',
    ])
    .nullable()
    .optional(),
  llmModel: z.string().nullable(),
  llmPromptVersion: z.string().nullable(),
  narrativeVariantId: z.string().optional(),
  styleProfile: z.string().optional(),
  score: z.number().min(0).max(100),
  scoreLabel: z.string(),
  band: z.enum(['peak', 'strong', 'stable', 'volatile']),
  confidence: z.number().min(0).max(100),
  confidenceBreakdown: ConfidenceBreakdownSchema.optional(),
  headline: z.string().nullable(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  recommendations: z.array(z.string()),
  tags: z.array(ScoredSignalTagSchema).optional(),
  drivers: z.array(z.string()).optional(),
  cautions: z.array(z.string()).optional(),
  actionsPriority: z.array(z.string()).optional(),
  components: AiSynergyComponentsSchema,
  signals: AiSynergySignalsSchema,
  generatedAt: z.string(),
});

export const DailyTransitMetaSchema = z.object({
  placeName: z.string(),
  source: z.enum(['profile_coordinates', 'astrology_geo']),
  timezone: z.number(),
});

export const DailyTransitMetricsSchema = z.object({
  energy: z.number(),
  focus: z.number(),
  luck: z.number(),
});

export const DailyTransitDominantSchema = z.object({
  planet: z.string(),
  sign: z.string(),
  house: z.number(),
  retrograde: z.boolean(),
});

export const DailyTransitSignalsSchema = z.object({
  positiveAspects: z.number(),
  hardAspects: z.number(),
  positiveAspectStrength: z.number(),
  hardAspectStrength: z.number(),
  dominantScore: z.number(),
  secondaryHouse: z.number().nullable(),
  secondaryHouseDensity: z.number(),
  dignityBalance: z.number(),
  momentum: z.object({
    energy: z.number(),
    focus: z.number(),
    luck: z.number(),
  }),
});

export const DailyTransitSchema = z.object({
  algorithmVersion: z.string().optional(),
  title: z.string(),
  modeLabel: z.string(),
  summary: z.string(),
  dominant: DailyTransitDominantSchema,
  metrics: DailyTransitMetricsSchema,
  signals: DailyTransitSignalsSchema.optional(),
  tags: z.array(ScoredSignalTagSchema).optional(),
  drivers: z.array(z.string()).optional(),
  cautions: z.array(z.string()).optional(),
});

export const DailyTransitResponseSchema = z.object({
  dateKey: z.string(),
  cached: z.boolean(),
  generatedAt: z.string(),
  transit: DailyTransitSchema,
  meta: DailyTransitMetaSchema,
  aiSynergy: AiSynergySchema.nullable(),
});

// Type inference from schemas
export type AiSynergy = z.infer<typeof AiSynergySchema>;
export type DailyTransitResponse = z.infer<typeof DailyTransitResponseSchema>;
export type ScoredSignalTag = z.infer<typeof ScoredSignalTagSchema>;
