import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobAnalyzeSuccessResponse, JobPreflightResponse } from '../services/jobsApi';
import type { ScannerImportedMeta } from '../types/navigation';
import type { JobScanHistoryEntry } from '../utils/jobScanHistoryStorage';
import type { JobScanCache } from '../utils/jobScanStorage';
import {
  buildImportedScannerMeta,
  buildScanMetaFromResult,
  normalizeScannerInitialUrl,
  resolveHistorySelection,
  resolveLastScanRestore,
  resolvePreflightGate,
  resolveSessionCacheHit,
} from './scannerRuntimeCore';

function createAnalysis(
  overrides: Partial<JobAnalyzeSuccessResponse> = {}
): JobAnalyzeSuccessResponse {
  return {
    analysisId: 'analysis-1',
    status: 'done',
    providerUsed: 'http_fetch',
    cached: false,
    cache: {
      raw: false,
      parsed: false,
      analysis: false,
    },
    usage: {
      plan: 'free',
      incremented: false,
    },
    versions: {
      parserVersion: 'parser-v1',
      rubricVersion: 'rubric-v1',
      modelVersion: 'model-v1',
    },
    scores: {
      compatibility: 84,
      aiReplacementRisk: 18,
      overall: 79,
    },
    breakdown: [],
    jobSummary: 'Normal job summary',
    tags: ['remote'],
    descriptors: [],
    job: {
      title: 'Product Manager',
      company: 'Acme',
      location: 'Remote',
      employmentType: 'full-time',
      source: 'linkedin',
    },
    ...overrides,
  };
}

function createPreflight(
  overrides: Partial<JobPreflightResponse> = {}
): JobPreflightResponse {
  return {
    source: 'linkedin',
    canonicalUrl: 'https://linkedin.com/jobs/view/123',
    canonicalUrlHash: 'hash-123',
    sourceJobId: '123',
    routing: {
      primary: 'http_fetch',
      fallback: 'browser_fallback',
    },
    nextStage: 'fetching_http_fetch',
    cache: {
      raw: { hit: false, updatedAt: null },
      parsed: { hit: false, parserVersion: null, updatedAt: null },
      analysis: { hit: false, rubricVersion: null, modelVersion: null, updatedAt: null },
      negative: { hit: false, status: null, retryAt: null },
    },
    limit: {
      plan: 'free',
      period: 'rolling_7_days',
      limit: 10,
      used: 3,
      remaining: 7,
      nextAvailableAt: null,
      canProceed: true,
    },
    versions: {
      parserVersion: 'parser-v1',
      rubricVersion: 'rubric-v1',
      modelVersion: 'model-v1',
    },
    ...overrides,
  };
}

function createMeta(overrides: Partial<ScannerImportedMeta> = {}): ScannerImportedMeta {
  return {
    source: 'linkedin',
    cached: false,
    provider: 'http_fetch',
    ...overrides,
  };
}

function createHistoryEntry(overrides: Partial<JobScanHistoryEntry> = {}): JobScanHistoryEntry {
  return {
    url: 'https://linkedin.com/jobs/view/123',
    analysis: createAnalysis(),
    meta: createMeta(),
    savedAt: '2026-03-31T10:00:00.000Z',
    ...overrides,
  };
}

function createLastScanCache(overrides: Partial<JobScanCache> = {}): JobScanCache {
  return {
    url: 'https://linkedin.com/jobs/view/123',
    analysis: createAnalysis(),
    meta: createMeta(),
    savedAt: '2026-03-31T10:00:00.000Z',
    ...overrides,
  };
}

test('scanner runtime core builds imported meta fallback from analysis payload', () => {
  const meta = buildImportedScannerMeta(
    createAnalysis({
      providerUsed: 'browser_fallback',
      job: {
        title: 'Designer',
        company: 'Acme',
        location: 'Remote',
        employmentType: 'contract',
        source: 'glassdoor',
      },
    })
  );

  assert.deepEqual(meta, {
    source: 'glassdoor',
    cached: false,
    provider: 'browser_fallback',
  });
});

test('scanner runtime core normalizes initial URLs and analysis meta from fresh result', () => {
  assert.equal(normalizeScannerInitialUrl('  https://linkedin.com/jobs/view/123  '), 'https://linkedin.com/jobs/view/123');
  assert.equal(normalizeScannerInitialUrl(null), '');

  assert.deepEqual(
    buildScanMetaFromResult(createPreflight({ source: 'indeed' }), createAnalysis({ cached: true, providerUsed: 'manual' })),
    {
      source: 'indeed',
      cached: true,
      provider: 'manual',
    }
  );
});

test('scanner runtime core blocks challenge-like history selections', () => {
  const selection = resolveHistorySelection(
    createHistoryEntry({
      analysis: createAnalysis({
        jobSummary: 'Checking your browser before accessing the page',
        tags: ['security'],
      }),
    })
  );

  assert.equal(selection.kind, 'blocked');
  assert.equal(selection.url, 'https://linkedin.com/jobs/view/123');
  assert.equal(selection.errorState.code, 'blocked');
  assert.match(selection.errorState.message, /screenshot fallback/i);
});

test('scanner runtime core discards challenge-like session and last-scan caches', () => {
  const sessionResolution = resolveSessionCacheHit({
    analysis: createAnalysis({
      jobSummary: 'Just a moment while we check your browser',
      tags: ['cloudflare'],
    }),
    meta: createMeta(),
  });
  const restoreResolution = resolveLastScanRestore(
    createLastScanCache({
      analysis: createAnalysis({
        jobSummary: 'Checking if the site connection is secure',
        tags: ['security'],
      }),
    })
  );

  assert.equal(sessionResolution.kind, 'discard_challenge');
  assert.equal(restoreResolution.kind, 'discard_challenge');
});

test('scanner runtime core maps usage limit and negative cache preflight blocks', () => {
  const usageLimitGate = resolvePreflightGate(
    createPreflight({
      limit: {
        plan: 'free',
        period: 'daily_utc',
        limit: 1,
        used: 1,
        remaining: 0,
        nextAvailableAt: '2026-04-01T00:00:00.000Z',
        canProceed: false,
      },
    })
  );
  const negativeGate = resolvePreflightGate(
    createPreflight({
      cache: {
        raw: { hit: false, updatedAt: null },
        parsed: { hit: false, parserVersion: null, updatedAt: null },
        analysis: { hit: false, rubricVersion: null, modelVersion: null, updatedAt: null },
        negative: {
          hit: true,
          status: 'login_wall',
          retryAt: '2026-04-01T12:00:00.000Z',
        },
      },
    })
  );

  assert.equal(usageLimitGate.kind, 'blocked');
  assert.equal(usageLimitGate.errorState.code, 'usage_limit_reached');
  assert.equal(usageLimitGate.errorState.usageContext, 'Usage: 1/1 (daily UTC)');

  assert.equal(negativeGate.kind, 'blocked');
  assert.equal(negativeGate.errorState.code, 'login_wall');
  assert.equal(negativeGate.errorState.retryAt, '2026-04-01T12:00:00.000Z');
});

test('scanner runtime core maps successful preflight next stage into fetch or scoring phase', () => {
  const fetchingGate = resolvePreflightGate(createPreflight({ nextStage: 'fetching_http_fetch' }));
  const scoringGate = resolvePreflightGate(createPreflight({ nextStage: 'running_scoring' }));

  assert.deepEqual(fetchingGate, {
    kind: 'continue',
    phase: 'fetching',
  });
  assert.deepEqual(scoringGate, {
    kind: 'continue',
    phase: 'scoring',
  });
});
