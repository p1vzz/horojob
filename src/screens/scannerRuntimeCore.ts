import type { JobAnalyzeSuccessResponse, JobPreflightResponse } from '../services/jobsApi';
import type { ScannerImportedMeta } from '../types/navigation';
import type { JobScanHistoryEntry } from '../utils/jobScanHistoryStorage';
import type { JobScanCache } from '../utils/jobScanStorage';
import {
  ERROR_TEXTS,
  isLikelyChallengeAnalysis,
  toUsageContext,
  type ScannerErrorState,
  type ScannerPhase,
} from './scannerUtilsCore';

export type ScannerSessionCachePayload = {
  analysis: JobAnalyzeSuccessResponse;
  meta: ScannerImportedMeta;
};

export type ScannerSessionCacheResolution =
  | { kind: 'miss' }
  | { kind: 'discard_challenge' }
  | ({ kind: 'use_cached' } & ScannerSessionCachePayload);

export type ScannerHistorySelection =
  | {
      kind: 'blocked';
      url: string;
      errorState: ScannerErrorState;
    }
  | ({
      kind: 'selected';
      url: string;
    } & ScannerSessionCachePayload);

export type ScannerRestoreSelection =
  | { kind: 'miss' }
  | { kind: 'discard_challenge' }
  | ({
      kind: 'restore';
      url: string;
    } & ScannerSessionCachePayload);

export type ScannerPreflightGate =
  | {
      kind: 'blocked';
      errorState: ScannerErrorState;
    }
  | {
      kind: 'continue';
      phase: Extract<ScannerPhase, 'fetching' | 'scoring'>;
    };

export function normalizeScannerInitialUrl(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildImportedScannerMeta(
  importedAnalysis: JobAnalyzeSuccessResponse,
  importedMeta?: ScannerImportedMeta | null
): ScannerImportedMeta {
  if (importedMeta) {
    return importedMeta;
  }

  return {
    source: importedAnalysis.job?.source ?? 'manual',
    cached: false,
    provider: importedAnalysis.providerUsed ?? null,
  };
}

export function buildScanMetaFromResult(
  preflight: Pick<JobPreflightResponse, 'source'>,
  result: Pick<JobAnalyzeSuccessResponse, 'cached' | 'providerUsed'>
): ScannerImportedMeta {
  return {
    source: preflight.source,
    cached: result.cached,
    provider: result.providerUsed,
  };
}

export function resolveHistorySelection(entry: JobScanHistoryEntry): ScannerHistorySelection {
  if (isLikelyChallengeAnalysis(entry.analysis)) {
    return {
      kind: 'blocked',
      url: entry.url,
      errorState: {
        code: 'blocked',
        message: 'Cached security challenge page detected. Re-run the scan or use screenshot fallback.',
        retryAt: null,
        usageContext: null,
      },
    };
  }

  return {
    kind: 'selected',
    url: entry.url,
    analysis: entry.analysis,
    meta: entry.meta,
  };
}

export function resolveSessionCacheHit(
  sessionCache: ScannerSessionCachePayload | null | undefined
): ScannerSessionCacheResolution {
  if (!sessionCache) {
    return { kind: 'miss' };
  }

  if (isLikelyChallengeAnalysis(sessionCache.analysis)) {
    return { kind: 'discard_challenge' };
  }

  return {
    kind: 'use_cached',
    analysis: sessionCache.analysis,
    meta: sessionCache.meta,
  };
}

export function resolveLastScanRestore(cache: JobScanCache | null | undefined): ScannerRestoreSelection {
  if (!cache) {
    return { kind: 'miss' };
  }

  if (isLikelyChallengeAnalysis(cache.analysis)) {
    return { kind: 'discard_challenge' };
  }

  return {
    kind: 'restore',
    url: cache.url,
    analysis: cache.analysis,
    meta: cache.meta,
  };
}

export function resolvePreflightGate(preflight: JobPreflightResponse): ScannerPreflightGate {
  if (!preflight.limit.canProceed) {
    return {
      kind: 'blocked',
      errorState: {
        code: 'usage_limit_reached',
        message: ERROR_TEXTS.usage_limit_reached,
        retryAt: preflight.limit.nextAvailableAt,
        usageContext: toUsageContext(preflight.limit),
      },
    };
  }

  const negativeStatus = preflight.cache.negative.hit ? preflight.cache.negative.status : null;
  if (negativeStatus) {
    return {
      kind: 'blocked',
      errorState: {
        code: negativeStatus,
        message: ERROR_TEXTS[negativeStatus] ?? ERROR_TEXTS.cooldown,
        retryAt: preflight.cache.negative.retryAt,
        usageContext: null,
      },
    };
  }

  return {
    kind: 'continue',
    phase: preflight.nextStage === 'running_scoring' || preflight.nextStage === 'done' ? 'scoring' : 'fetching',
  };
}
