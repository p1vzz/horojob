import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JOBS_ANALYZE_TIMEOUT_MS,
  JOBS_HISTORY_TIMEOUT_MS,
  JOBS_METRICS_TIMEOUT_MS,
  JOBS_PREFLIGHT_TIMEOUT_MS,
  JOBS_SCREENSHOT_ANALYZE_TIMEOUT_MS,
  createJobsApi,
} from './jobsApiCore';

type JobsRequestInit = RequestInit & {
  timeoutMs?: number;
};

class FakeApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

test('jobs api preflight sends expected payload', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ source: 'linkedin' }), { status: 200 });
    },
    parseJsonBody: async () => ({ source: 'linkedin' }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.preflightJobUrl('https://www.linkedin.com/jobs/view/1234567890/');
  assert.equal(payload.source, 'linkedin');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/jobs/preflight');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(calls[0].init?.timeoutMs, JOBS_PREFLIGHT_TIMEOUT_MS);
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.url, 'https://www.linkedin.com/jobs/view/1234567890/');
});

test('jobs api screenshot analyze maps screenshots and regenerate', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ status: 'done' }), { status: 200 });
    },
    parseJsonBody: async () => ({ status: 'done' }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.analyzeJobScreenshots(['data:image/png;base64,aaa', 'data:image/png;base64,bbb'], true);
  assert.equal(payload.status, 'done');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/api/jobs/analyze-screenshots');
  assert.equal(calls[0].init?.timeoutMs, JOBS_SCREENSHOT_ANALYZE_TIMEOUT_MS);
  const body = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(body, {
    screenshots: [{ dataUrl: 'data:image/png;base64,aaa' }, { dataUrl: 'data:image/png;base64,bbb' }],
    regenerate: true,
  });
});

test('jobs api metrics and alerts use windowHours query', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ sources: [] }), { status: 200 });
    },
    parseJsonBody: async () => ({ sources: [] }),
    ApiError: FakeApiError as never,
  });

  await api.fetchJobMetrics();
  await api.fetchJobMetrics(48);
  await api.fetchJobAlerts();
  await api.fetchJobAlerts(12);

  assert.deepEqual(
    calls.map((call) => call.path),
    [
    '/api/jobs/metrics?windowHours=24',
    '/api/jobs/metrics?windowHours=48',
    '/api/jobs/alerts?windowHours=24',
    '/api/jobs/alerts?windowHours=12',
    ]
  );
  assert.deepEqual(
    calls.map((call) => call.init?.timeoutMs),
    [
      JOBS_METRICS_TIMEOUT_MS,
      JOBS_METRICS_TIMEOUT_MS,
      JOBS_METRICS_TIMEOUT_MS,
      JOBS_METRICS_TIMEOUT_MS,
    ]
  );
});

test('jobs api history endpoints use expected contract and parsing', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      if (path === '/api/jobs/history?limit=6') {
        return new Response(
          JSON.stringify([
            {
              url: 'https://www.linkedin.com/jobs/view/1234567890/',
              savedAt: '2026-04-24T08:00:00.000Z',
              meta: {
                source: 'linkedin',
                cached: true,
                provider: 'http_fetch',
              },
              analysis: {
                analysisId: 'analysis-1',
                status: 'done',
                scanDepth: 'full',
                requestedScanDepth: 'full',
                providerUsed: 'http_fetch',
              },
            },
          ]),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ importedCount: 2 }), { status: 200 });
    },
    parseJsonBody: async (response) => JSON.parse(await response.text()),
    ApiError: FakeApiError as never,
  });

  const history = await api.fetchJobHistory(6);
  const imported = await api.importJobHistory(history);

  assert.equal(history.length, 1);
  assert.equal(history[0]?.analysis.analysisId, 'analysis-1');
  assert.equal(history[0]?.meta.cached, true);
  assert.equal(imported.importedCount, 2);
  assert.deepEqual(
    calls.map((call) => call.path),
    ['/api/jobs/history?limit=6', '/api/jobs/history/import'],
  );
  assert.equal(calls[0]?.init?.timeoutMs, JOBS_HISTORY_TIMEOUT_MS);
  assert.equal(calls[1]?.init?.timeoutMs, JOBS_HISTORY_TIMEOUT_MS);
  assert.equal(calls[1]?.init?.method, 'POST');
  assert.equal(JSON.parse(String(calls[1]?.init?.body)).entries[0].analysis.analysisId, 'analysis-1');
});

test('jobs api throws ApiError on analyze failure', async () => {
  const api = createJobsApi({
    authorizedFetch: async () => new Response(JSON.stringify({ code: 'usage_limit_reached' }), { status: 429 }),
    parseJsonBody: async () => ({ code: 'usage_limit_reached' }),
    ApiError: FakeApiError as never,
  });

  await assert.rejects(
    () => api.analyzeJobUrl('https://www.linkedin.com/jobs/view/1234567890/', false),
    (error: unknown) => {
      assert.ok(error instanceof FakeApiError);
      assert.equal(error.status, 429);
      assert.equal(error.message, 'Failed to analyze vacancy URL');
      assert.deepEqual(error.payload, { code: 'usage_limit_reached' });
      return true;
    },
  );
});

test('jobs api analyze uses extended timeout for long-running scraper work', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ status: 'done' }), { status: 200 });
    },
    parseJsonBody: async () => ({ status: 'done' }),
    ApiError: FakeApiError as never,
  });

  await api.analyzeJobUrl('https://www.linkedin.com/jobs/view/1234567890/', true);

  assert.equal(calls[0].path, '/api/jobs/analyze');
  assert.equal(calls[0].init?.timeoutMs, JOBS_ANALYZE_TIMEOUT_MS);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    url: 'https://www.linkedin.com/jobs/view/1234567890/',
    regenerate: true,
    scanDepth: 'auto',
  });
});

test('jobs api analyze can request explicit full scan depth', async () => {
  const calls: Array<{ path: string; init?: JobsRequestInit }> = [];
  const api = createJobsApi({
    authorizedFetch: async (path, init) => {
      calls.push({ path, init });
      return new Response(JSON.stringify({ status: 'done' }), { status: 200 });
    },
    parseJsonBody: async () => ({ status: 'done', scanDepth: 'full', requestedScanDepth: 'full' }),
    ApiError: FakeApiError as never,
  });

  await api.analyzeJobUrl('https://www.linkedin.com/jobs/view/1234567890/', {
    scanDepth: 'full',
  });

  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    url: 'https://www.linkedin.com/jobs/view/1234567890/',
    regenerate: false,
    scanDepth: 'full',
  });
});

test('jobs api normalizes sparse preflight payloads into safe scanner defaults', async () => {
  const api = createJobsApi({
    authorizedFetch: async () => new Response(JSON.stringify({ source: 'linkedin' }), { status: 200 }),
    parseJsonBody: async () => ({
      source: 'linkedin',
      routing: {
        primary: 'http_fetch',
      },
      cache: {
        negative: {
          hit: true,
          status: 'blocked',
        },
      },
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.preflightJobUrl('https://www.linkedin.com/jobs/view/1234567890/');
  assert.equal(payload.source, 'linkedin');
  assert.equal(payload.routing.fallback, 'browser_fallback');
  assert.equal(payload.nextStage, 'fetching_http_fetch');
  assert.equal(payload.cache.negative.status, 'blocked');
  assert.equal(payload.limit.canProceed, true);
  assert.equal(payload.versions.parserVersion, 'unknown');
});

test('jobs api normalizes sparse analyze payloads into safe client shape', async () => {
  const api = createJobsApi({
    authorizedFetch: async () => new Response(JSON.stringify({ status: 'done' }), { status: 200 }),
    parseJsonBody: async () => ({
      analysisId: 'analysis-1',
      scanDepth: 'lite',
      requestedScanDepth: 'auto',
      providerUsed: 'browser_fallback',
      scores: {
        compatibility: 82,
      },
      job: {
        title: 'Product Manager',
        salaryText: '$120,000-$150,000 per year',
        source: 'linkedin',
      },
      screenshot: {
        confidence: 0.84,
      },
      breakdown: [
        {
          label: 'Alignment',
          score: 77,
        },
      ],
      tags: ['remote', 12, null],
      market: {
        occupation: {
          title: 'Product Managers',
        },
        labels: {
          marketScore: 'steady market',
          salaryVisibility: 'market_estimate',
        },
      },
    }),
    ApiError: FakeApiError as never,
  });

  const payload = await api.analyzeJobUrl('https://www.linkedin.com/jobs/view/1234567890/', false);
  assert.equal(payload.scanDepth, 'lite');
  assert.equal(payload.requestedScanDepth, 'auto');
  assert.equal(payload.providerUsed, 'browser_fallback');
  assert.equal(payload.scores.compatibility, 82);
  assert.equal(payload.scores.overall, 0);
  assert.equal(payload.job?.title, 'Product Manager');
  assert.equal(payload.job?.company, null);
  assert.equal(payload.job?.salaryText, '$120,000-$150,000 per year');
  assert.equal(payload.screenshot?.imageCount, 0);
  assert.equal(payload.breakdown[0]?.key, 'breakdown-0');
  assert.equal(payload.market?.occupation.title, 'Product Managers');
  assert.deepEqual(payload.tags, ['remote']);
  assert.deepEqual(payload.descriptors, []);
});
