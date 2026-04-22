import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDailyTransit } from '../../services/astrologyApi';
import { aiOrchestrator } from '../../services/aiOrchestration';
import { DailyTransitResponseSchema, type AiSynergy } from '../../schemas/aiSynergySchema';

/**
 * React Query hook for AI Synergy data
 *
 * Features:
 * - Automatic caching (5min stale, 30min cache)
 * - Background refetch on mount
 * - Zod validation
 * - Telemetry tracking
 */
export const useAiSynergy = (): UseQueryResult<AiSynergy | null, Error> => {
  return useQuery({
    queryKey: ['aiSynergy', 'today'],
    queryFn: async () => {
      const response = await aiOrchestrator.withRetry({
        operation: 'ai-synergy',
        requestFn: () => fetchDailyTransit({ includeAiSynergy: true }),
        telemetryMetadata: { source: 'useAiSynergy' },
      });

      // Validate with Zod
      const validated = DailyTransitResponseSchema.parse(response);

      // Track cache hit/miss
      if (validated.cached) {
        aiOrchestrator.trackCacheHit('ai-synergy', 'analysis');
      } else {
        aiOrchestrator.trackCacheMiss('ai-synergy');
      }

      return validated.aiSynergy;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook for full daily transit data (including aiSynergy)
 */
export const useDailyTransit = () => {
  return useQuery({
    queryKey: ['dailyTransit', 'today'],
    queryFn: async () => {
      const response = await aiOrchestrator.withRetry({
        operation: 'daily-transit',
        requestFn: () => fetchDailyTransit({ includeAiSynergy: true }),
        telemetryMetadata: { source: 'useDailyTransit' },
      });

      return DailyTransitResponseSchema.parse(response);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
};
