import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  preflightJobUrl,
  analyzeJobUrl,
  analyzeJobScreenshots,
  type AnalyzeJobOptions,
  type JobPreflightResponse,
  type JobAnalyzeSuccessResponse,
} from '../../services/jobsApi';
import { aiOrchestrator } from '../../services/aiOrchestration';
import {
  JobPreflightResponseSchema,
  JobAnalyzeSuccessResponseSchema,
} from '../../schemas/jobAnalysisSchema';

type JobPreflightRequestFn = typeof preflightJobUrl;
type JobAnalyzeRequestFn = typeof analyzeJobUrl;
type JobScreenshotAnalyzeRequestFn = typeof analyzeJobScreenshots;

export type JobPreflightMutationVariables = {
  url: string;
};

export type JobAnalysisMutationVariables = {
  url: string;
  options?: AnalyzeJobOptions;
};

export type JobScreenshotAnalysisMutationVariables = {
  imageUris: string[];
  regenerate?: boolean;
};

/**
 * Mutation hook for job URL preflight
 */
export const useJobPreflight = (
  requestFn: JobPreflightRequestFn = preflightJobUrl,
): UseMutationResult<JobPreflightResponse, Error, JobPreflightMutationVariables> => {
  return useMutation({
    mutationFn: async ({ url }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-analysis',
        requestFn: () => requestFn(url),
        telemetryMetadata: { stage: 'preflight', url },
      });

      JobPreflightResponseSchema.parse(response);
      return response;
    },
  });
};

/**
 * Mutation hook for job URL analysis
 */
export const useJobAnalysis = (
  requestFn: JobAnalyzeRequestFn = analyzeJobUrl,
): UseMutationResult<JobAnalyzeSuccessResponse, Error, JobAnalysisMutationVariables> => {
  return useMutation({
    mutationFn: async ({ url, options }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-analysis',
        requestFn: () => requestFn(url, options),
        telemetryMetadata: { stage: 'analyze', url, scanDepth: options?.scanDepth ?? 'auto' },
        retryConfig: {
          maxAttempts: 2, // Job analysis can be slow
          baseDelay: 2000,
          maxDelay: 15000,
        },
      });

      JobAnalyzeSuccessResponseSchema.parse(response);

      if (response.cache.analysis) {
        aiOrchestrator.trackCacheHit('job-analysis', 'analysis');
      } else {
        aiOrchestrator.trackCacheMiss('job-analysis');
      }

      return response;
    },
  });
};

export const useJobScreenshotAnalysis = (
  requestFn: JobScreenshotAnalyzeRequestFn = analyzeJobScreenshots,
): UseMutationResult<JobAnalyzeSuccessResponse, Error, JobScreenshotAnalysisMutationVariables> => {
  return useMutation({
    mutationFn: async ({ imageUris, regenerate = false }) => {
      const response = await aiOrchestrator.withRetry({
        operation: 'job-screenshots',
        requestFn: () => requestFn(imageUris, regenerate),
        telemetryMetadata: { stage: 'screenshot_analysis', imageCount: imageUris.length },
        retryConfig: {
          maxAttempts: 2,
          baseDelay: 3000, // Screenshots need more time
          maxDelay: 20000,
        },
      });

      JobAnalyzeSuccessResponseSchema.parse(response);

      if (response.cache.analysis) {
        aiOrchestrator.trackCacheHit('job-screenshots', 'analysis');
      } else {
        aiOrchestrator.trackCacheMiss('job-screenshots');
      }

      return response;
    },
  });
};
