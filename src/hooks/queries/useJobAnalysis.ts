import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { preflightJobUrl, analyzeJobUrl, analyzeJobScreenshots } from '../../services/jobsApi';
import { aiOrchestrator } from '../../services/aiOrchestration';
import {
  JobPreflightResponseSchema,
  JobAnalyzeSuccessResponseSchema,
  type JobPreflightResponse,
  type JobAnalyzeSuccessResponse,
} from '../../schemas/jobAnalysisSchema';

/**
 * Mutation hook for job URL preflight
 */
export const useJobPreflight = (): UseMutationResult<JobPreflightResponse, Error, { url: string }> => {
  return useMutation({
    mutationFn: async ({ url }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-analysis',
        requestFn: () => preflightJobUrl(url),
        telemetryMetadata: { stage: 'preflight', url },
      });

      return JobPreflightResponseSchema.parse(response);
    },
  });
};

/**
 * Mutation hook for job URL analysis
 */
export const useJobAnalysis = (): UseMutationResult<JobAnalyzeSuccessResponse, Error, { url: string }> => {
  return useMutation({
    mutationFn: async ({ url }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-analysis',
        requestFn: () => analyzeJobUrl(url),
        telemetryMetadata: { stage: 'analyze', url },
        retryConfig: {
          maxAttempts: 2, // Job analysis can be slow
          baseDelay: 2000,
          maxDelay: 15000,
        },
      });

      const validated = JobAnalyzeSuccessResponseSchema.parse(response);

      if (validated.cache.analysis) {
        aiOrchestrator.trackCacheHit('job-analysis', 'analysis');
      } else {
        aiOrchestrator.trackCacheMiss('job-analysis');
      }

      return validated;
    },
  });
};

/**
 * Mutation hook for job screenshot analysis
 */
export const useJobScreenshotAnalysis = (): UseMutationResult<
  JobAnalyzeSuccessResponse,
  Error,
  { imageUris: string[] }
> => {
  return useMutation({
    mutationFn: async ({ imageUris }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-screenshots',
        requestFn: () => analyzeJobScreenshots(imageUris),
        telemetryMetadata: { stage: 'screenshot_analysis', imageCount: imageUris.length },
        retryConfig: {
          maxAttempts: 2,
          baseDelay: 3000, // Screenshots need more time
          maxDelay: 20000,
        },
      });

      const validated = JobAnalyzeSuccessResponseSchema.parse(response);

      if (validated.cache.analysis) {
        aiOrchestrator.trackCacheHit('job-screenshots', 'analysis');
      } else {
        aiOrchestrator.trackCacheMiss('job-screenshots');
      }

      return validated;
    },
  });
};
