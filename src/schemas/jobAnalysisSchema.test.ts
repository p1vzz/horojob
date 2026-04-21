import assert from 'node:assert/strict';
import test from 'node:test';
import { JobAnalyzeSuccessResponseSchema } from './jobAnalysisSchema';

test('job analysis schema accepts normalized jobsApi success payload', () => {
  const payload = JobAnalyzeSuccessResponseSchema.parse({
    analysisId: 'analysis-1',
    status: 'done',
    providerUsed: 'browser_fallback',
    providerAttempts: [
      {
        provider: 'http_fetch',
        ok: false,
        reason: 'blocked',
        statusCode: 429,
      },
    ],
    cached: false,
    cache: {
      raw: false,
      parsed: true,
      analysis: false,
    },
    usage: {
      plan: 'premium',
      incremented: true,
    },
    versions: {
      parserVersion: 'parser-v1',
      rubricVersion: 'rubric-v1',
      modelVersion: 'model-v1',
    },
    scores: {
      compatibility: 84,
      aiReplacementRisk: 16,
      overall: 80,
    },
    breakdown: [{ key: 'role_fit', label: 'Role Fit', score: 84, note: 'Strong match' }],
    jobSummary: 'A role with product ownership.',
    tags: ['product', 'remote'],
    descriptors: ['leadership'],
    job: {
      title: 'Product Manager',
      company: 'Acme',
      location: 'Remote',
      employmentType: 'Full-time',
      source: 'linkedin',
    },
  });

  assert.equal(payload.providerUsed, 'browser_fallback');
  assert.equal(payload.cache.analysis, false);
  assert.equal(payload.job?.title, 'Product Manager');
});
