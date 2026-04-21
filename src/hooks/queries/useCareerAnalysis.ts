import { useQuery } from '@tanstack/react-query';
import { fetchCareerInsights, fetchFullNatalCareerAnalysis } from '../../services/astrologyApi';
import { aiOrchestrator } from '../../services/aiOrchestration';
import {
  CareerInsightsResponseSchema,
  FullNatalCareerAnalysisResponseSchema,
} from '../../schemas/careerAnalysisSchema';

/**
 * Hook for career insights
 */
export const useCareerInsights = () => {
  return useQuery({
    queryKey: ['careerInsights'],
    queryFn: async () => {
      const response = await aiOrchestrator.withRetry({
        operation: 'career-insights',
        requestFn: fetchCareerInsights,
        telemetryMetadata: { source: 'useCareerInsights' },
      });

      const validated = CareerInsightsResponseSchema.parse(response);

      if (validated.cached) {
        aiOrchestrator.trackCacheHit('career-insights', 'analysis');
      }

      return validated;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook for full natal career analysis
 */
export const useFullNatalCareerAnalysis = () => {
  return useQuery({
    queryKey: ['fullNatalCareerAnalysis'],
    queryFn: async () => {
      const response = await aiOrchestrator.withRetry({
        operation: 'full-natal-analysis',
        requestFn: fetchFullNatalCareerAnalysis,
        telemetryMetadata: { source: 'useFullNatalCareerAnalysis' },
      });

      const validated = FullNatalCareerAnalysisResponseSchema.parse(response);

      if (validated.cached) {
        aiOrchestrator.trackCacheHit('full-natal-analysis', 'analysis');
      }

      return validated;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (expensive LLM call)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1, // Less retries for expensive operations
  });
};
