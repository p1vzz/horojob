import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ERROR_TEXTS,
  formatRetryAt,
  formatScreenshotConfidence,
  isLikelyChallengeAnalysis,
  parseScannerApiError,
  sourceHintFromUrl,
  toPhaseSubtitle,
  toPhaseTitle,
  toUsageContext,
} from './scannerUtilsCore';

test('scanner core returns source hints for empty, valid and invalid URLs', () => {
  assert.equal(sourceHintFromUrl('').tone, 'neutral');
  assert.equal(sourceHintFromUrl('linkedin.com/jobs/view/123456789').tone, 'positive');
  assert.equal(
    sourceHintFromUrl('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4401382836').tone,
    'positive'
  );
  assert.equal(sourceHintFromUrl('https://example.com/jobs/123').tone, 'warning');
  assert.equal(sourceHintFromUrl('::bad-url').tone, 'warning');
});

test('scanner core maps phase labels', () => {
  assert.equal(toPhaseTitle('preflight'), 'Preparing Analysis');
  assert.equal(toPhaseSubtitle('scoring'), 'Matching vacancy against your natal chart...');
});

test('scanner core maps source access failures to screenshot-first guidance', () => {
  assert.match(ERROR_TEXTS.blocked, /temporarily blocking automated access/i);
  assert.match(ERROR_TEXTS.login_wall, /requires sign-in or is not public/i);
  assert.match(ERROR_TEXTS.not_found, /upload screenshots instead/i);
  assert.match(ERROR_TEXTS.provider_failed, /title, company, and job description/i);
});

test('scanner core formats retry and screenshot confidence', () => {
  assert.equal(formatRetryAt(null), null);
  assert.equal(formatRetryAt('not-a-date'), null);
  assert.ok(typeof formatRetryAt('2026-03-30T10:00:00.000Z') === 'string');

  assert.equal(formatScreenshotConfidence(Number.NaN), 'n/a');
  assert.equal(formatScreenshotConfidence(0.85), '85%');
  assert.equal(formatScreenshotConfidence(124), '100%');
});

test('scanner core detects challenge-like analysis text', () => {
  assert.equal(
    isLikelyChallengeAnalysis({
      jobSummary: 'Checking your browser before accessing the page',
      tags: ['security'],
    } as never),
    true
  );
  assert.equal(
    isLikelyChallengeAnalysis({
      jobSummary: 'Normal product manager vacancy',
      tags: ['remote'],
    } as never),
    false
  );
});

test('scanner core builds usage context and parses API error payload', () => {
  assert.equal(
    toUsageContext({
    plan: 'free',
    depth: 'full',
    period: 'rolling_7_days',
      limit: 10,
      used: 3,
      remaining: 7,
      nextAvailableAt: null,
      canProceed: true,
    }),
    'Full usage: 3/10 (rolling 7 days)'
  );

  const parsed = parseScannerApiError(
    {
      status: 429,
      payload: {
        code: 'usage_limit_reached',
        retryAt: '2026-03-31T00:00:00.000Z',
        limit: {
          plan: 'free',
          depth: 'full',
          period: 'daily_utc',
          limit: 1,
          used: 1,
          remaining: 0,
          nextAvailableAt: '2026-03-31T00:00:00.000Z',
          canProceed: false,
        },
      },
    },
    (value): value is { status: number; payload: unknown } => {
      return Boolean(value && typeof value === 'object' && typeof (value as { status?: unknown }).status === 'number');
    }
  );

  assert.equal(parsed.code, 'usage_limit_reached');
  assert.equal(parsed.message, ERROR_TEXTS.usage_limit_reached);
  assert.equal(parsed.retryAt, '2026-03-31T00:00:00.000Z');
  assert.equal(parsed.usageContext, 'Full usage: 1/1 (daily UTC)');
});

test('scanner core falls back to unknown on non-api errors', () => {
  const parsed = parseScannerApiError(
    new Error('offline'),
    (value): value is { status: number; payload: unknown } => {
      return Boolean(value && typeof value === 'object' && typeof (value as { status?: unknown }).status === 'number');
    }
  );

  assert.deepEqual(parsed, {
    code: 'unknown',
    message: ERROR_TEXTS.unknown,
    retryAt: null,
    usageContext: null,
  });
});
