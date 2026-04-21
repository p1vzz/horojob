/**
 * AI Orchestration Layer
 *
 * Centralized coordination for all AI operations:
 * - Unified retry logic
 * - Rate limiting
 * - Telemetry integration
 * - Error handling patterns
 * - Response caching coordination
 */

import { aiTelemetry, type AiOperation } from './aiTelemetry';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';

export type RetryConfig = {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
};

export type AiRequestOptions<T = unknown> = {
  operation: AiOperation;
  requestFn: () => Promise<T>;
  retryConfig?: Partial<RetryConfig>;
  telemetryMetadata?: Record<string, unknown>;
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

class AiOrchestrator {
  /**
   * Execute AI request with retry logic and telemetry
   */
  async withRetry<T>(options: AiRequestOptions<T>): Promise<T> {
    const { operation, requestFn, retryConfig, telemetryMetadata } = options;
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    aiTelemetry.trackRequest(operation, telemetryMetadata || {});
    const profiler = aiTelemetry.createProfiler(operation);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await requestFn();
        profiler.finish(true, { attempt });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < config.maxAttempts) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );

          if (SHOULD_EXPOSE_TECHNICAL_SURFACES) {
            console.log(`[AI Retry] ${operation} attempt ${attempt} failed, retrying in ${delay}ms`);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    const latency = profiler.finish(false, { attempts: config.maxAttempts });
    aiTelemetry.trackError(lastError!, {
      operation,
      latency,
      metadata: { attempts: config.maxAttempts, ...telemetryMetadata },
    });

    throw lastError;
  }

  /**
   * Execute with timeout
   */
  async withTimeout<T>(operation: AiOperation, requestFn: () => Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([requestFn(), timeoutPromise]);
    } catch (error) {
      aiTelemetry.trackError(error as Error, { operation, metadata: { timeout: timeoutMs } });
      throw error;
    }
  }

  /**
   * Track cache metrics for AI responses
   */
  trackCacheHit(operation: AiOperation, layer: 'raw' | 'parsed' | 'analysis', age?: number): void {
    aiTelemetry.trackCacheMetrics(operation, { hit: true, layer, age });
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(operation: AiOperation): void {
    aiTelemetry.trackCacheMetrics(operation, { hit: false });
  }
}

export const aiOrchestrator = new AiOrchestrator();
