import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';

/**
 * AI Telemetry & Observability
 *
 * Centralized tracking for all AI operations:
 * - Request/response metrics
 * - Error tracking with context
 * - Performance profiling
 */

export type AiOperation =
  | 'ai-synergy'
  | 'daily-transit'
  | 'career-insights'
  | 'full-natal-analysis'
  | 'job-analysis'
  | 'job-screenshots'
  | 'discover-roles';

export type AiErrorContext = {
  operation: AiOperation;
  model?: string;
  cached?: boolean;
  latency?: number;
  metadata?: Record<string, unknown>;
};

export type AiMetrics = {
  operation: AiOperation;
  latency: number;
  cached: boolean;
  model?: string;
  promptVersion?: string;
  tokenCount?: number;
};

class AiTelemetry {
  private isDevelopment = SHOULD_EXPOSE_TECHNICAL_SURFACES;

  /**
   * Track successful AI request
   */
  trackRequest(operation: AiOperation, metadata: Record<string, unknown> = {}): void {
    if (this.isDevelopment) {
      console.log('[AI Request]', operation, metadata);
    }

    // TODO: Send to analytics service (e.g., Sentry, LogRocket, custom backend)
    // analytics.track('ai_request', { operation, ...metadata });
  }

  /**
   * Track successful AI response
   */
  trackSuccess(operation: AiOperation, metrics: Partial<AiMetrics>): void {
    if (this.isDevelopment) {
      console.log('[AI Success]', operation, {
        latency: metrics.latency ? `${metrics.latency}ms` : 'unknown',
        cached: metrics.cached ?? false,
        model: metrics.model,
      });
    }

    // TODO: Send metrics to monitoring
    // if (metrics.latency) {
    //   analytics.timing('ai_latency', metrics.latency, { operation, cached: metrics.cached });
    // }
  }

  /**
   * Track AI errors with full context
   */
  trackError(error: Error, context: AiErrorContext): void {
    const errorDetails = {
      operation: context.operation,
      message: error.message,
      model: context.model,
      cached: context.cached,
      latency: context.latency,
      ...context.metadata,
    };

    if (this.isDevelopment) {
      console.error('[AI Error]', errorDetails);
    }

    // TODO: Send to error tracker
    // Sentry.captureException(error, {
    //   tags: { operation: context.operation },
    //   extra: errorDetails,
    // });
  }

  /**
   * Track LLM-specific metrics
   */
  trackLlmMetrics(operation: AiOperation, metrics: {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latency: number;
  }): void {
    if (this.isDevelopment) {
      console.log('[LLM Metrics]', operation, {
        model: metrics.model,
        tokens: metrics.totalTokens,
        latency: `${metrics.latency}ms`,
      });
    }

    // TODO: Track token usage for cost monitoring
    // analytics.track('llm_usage', { operation, ...metrics });
  }

  /**
   * Track cache hit/miss patterns
   */
  trackCacheMetrics(operation: AiOperation, cacheStatus: {
    hit: boolean;
    layer?: 'raw' | 'parsed' | 'analysis';
    age?: number; // milliseconds since cached
  }): void {
    if (this.isDevelopment && cacheStatus.hit) {
      console.log('[AI Cache Hit]', operation, cacheStatus.layer);
    }

    // TODO: Monitor cache effectiveness
    // analytics.track('ai_cache', { operation, ...cacheStatus });
  }

  /**
   * Create a performance profiler for an operation
   */
  createProfiler(operation: AiOperation) {
    const startTime = Date.now();

    return {
      finish: (success: boolean, metadata?: Record<string, unknown>) => {
        const latency = Date.now() - startTime;

        if (success) {
          this.trackSuccess(operation, { operation, latency, cached: false, ...metadata });
        }

        return latency;
      },
    };
  }
}

export const aiTelemetry = new AiTelemetry();
