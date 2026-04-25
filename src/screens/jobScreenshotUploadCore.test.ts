import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_SCREENSHOT_IMAGE_BYTES,
  MAX_SCREENSHOT_TOTAL_BYTES,
  SCREENSHOT_UPLOAD_TEXTS,
  buildScannerImportFromScreenshotAnalysis,
  buildScreenshotItems,
  mergeScreenshotItems,
  selectionLimitForAdditionalScreenshots,
  toScreenshotAnalyzeErrorMessage,
  toScreenshotMbText,
  validateScreenshotPayloadSize,
  type ScreenshotAnalyzeApiErrorLike,
} from './jobScreenshotUploadCore';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';

function isFakeApiError(value: unknown): value is ScreenshotAnalyzeApiErrorLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'status' in value &&
      typeof (value as { status?: unknown }).status === 'number' &&
      'payload' in value
  );
}

function createAnalyzeResult(): JobAnalyzeSuccessResponse {
  return {
    analysisId: 'analysis-1',
    status: 'done',
    scanDepth: 'full',
    requestedScanDepth: 'full',
    providerUsed: 'screenshot_vision',
    cached: false,
    cache: {
      raw: false,
      parsed: false,
      analysis: false,
    },
    usage: {
      plan: 'premium',
      depth: 'full',
      incremented: true,
    },
    versions: {
      parserVersion: 'parser-1',
      rubricVersion: 'rubric-1',
      modelVersion: 'model-1',
    },
    scores: {
      compatibility: 88,
      aiReplacementRisk: 12,
      overall: 83,
    },
    breakdown: [],
    jobSummary: 'summary',
    tags: ['remote'],
    descriptors: [],
    market: null,
    job: {
      title: 'Product Manager',
      company: 'Acme',
      location: 'Remote',
      employmentType: 'full_time',
      source: 'linkedin',
    },
    screenshot: {
      imageCount: 2,
      confidence: 0.83,
      reason: 'High confidence',
    },
  };
}

test('screenshot core formats megabytes and selection limit safely', () => {
  assert.equal(toScreenshotMbText(1_048_576), '1.00 MB');
  assert.equal(selectionLimitForAdditionalScreenshots(0), 6);
  assert.equal(selectionLimitForAdditionalScreenshots(5), 1);
  assert.equal(selectionLimitForAdditionalScreenshots(8), 1);
});

test('screenshot core builds screenshot items from picker assets', () => {
  const items = buildScreenshotItems(
    [
      {
        uri: 'file:///vacancy-1.png',
        base64: 'aGVsbG8=',
        mimeType: 'image/png',
        fileSize: 3456,
      },
      {
        uri: 'file:///vacancy-2.jpg',
        base64: 'aW1hZ2U=',
      },
      {
        uri: 'file:///skip.jpg',
      },
    ],
    (asset, index) => `${asset.uri}:${index}`
  );

  assert.equal(items.length, 2);
  assert.equal(items[0]?.id, 'file:///vacancy-1.png:0');
  assert.equal(items[0]?.dataUrl, 'data:image/png;base64,aGVsbG8=');
  assert.equal(items[0]?.bytes, 3456);
  assert.equal(items[1]?.dataUrl, 'data:image/jpeg;base64,aW1hZ2U=');
  assert.equal(items[1]?.bytes, 6);
});

test('screenshot core merges screenshot items by uri and respects the max limit', () => {
  const merged = mergeScreenshotItems(
    [
      { id: '1', uri: 'file:///1.png', dataUrl: 'a', bytes: 100 },
      { id: '2', uri: 'file:///2.png', dataUrl: 'b', bytes: 100 },
    ],
    [
      { id: '3', uri: 'file:///2.png', dataUrl: 'c', bytes: 100 },
      { id: '4', uri: 'file:///3.png', dataUrl: 'd', bytes: 100 },
      { id: '5', uri: 'file:///4.png', dataUrl: 'e', bytes: 100 },
      { id: '6', uri: 'file:///5.png', dataUrl: 'f', bytes: 100 },
      { id: '7', uri: 'file:///6.png', dataUrl: 'g', bytes: 100 },
    ]
  );

  assert.deepEqual(
    merged.map((item) => item.uri),
    ['file:///1.png', 'file:///2.png', 'file:///3.png', 'file:///4.png', 'file:///5.png', 'file:///6.png']
  );
});

test('screenshot core validates payload size before network upload', () => {
  assert.equal(
    validateScreenshotPayloadSize([
      {
        id: 'large',
        uri: 'file:///large.png',
        dataUrl: 'data:image/png;base64,aaa',
        bytes: MAX_SCREENSHOT_IMAGE_BYTES + 1,
      },
    ]),
    'One screenshot is too large (1.53 MB). Crop it or choose a smaller image.'
  );

  assert.equal(
    validateScreenshotPayloadSize([
      {
        id: '1',
        uri: 'file:///1.png',
        dataUrl: 'data:image/png;base64,aaa',
        bytes: MAX_SCREENSHOT_TOTAL_BYTES / 4 + 1,
      },
      {
        id: '2',
        uri: 'file:///2.png',
        dataUrl: 'data:image/png;base64,bbb',
        bytes: MAX_SCREENSHOT_TOTAL_BYTES / 4 + 1,
      },
      {
        id: '3',
        uri: 'file:///3.png',
        dataUrl: 'data:image/png;base64,ccc',
        bytes: MAX_SCREENSHOT_TOTAL_BYTES / 4 + 1,
      },
      {
        id: '4',
        uri: 'file:///4.png',
        dataUrl: 'data:image/png;base64,ddd',
        bytes: MAX_SCREENSHOT_TOTAL_BYTES / 4 + 1,
      },
    ]),
    'Selected screenshots are too large (5.72 MB). Remove one or choose smaller images.'
  );
});

test('screenshot core maps screenshot analyze API errors into stable UI text', () => {
  assert.equal(
    toScreenshotAnalyzeErrorMessage(
      {
        status: 422,
        payload: {
          code: 'screenshot_not_vacancy',
          reason: 'No vacancy title or company block was found.',
        },
      },
      isFakeApiError
    ),
    'Uploaded screenshots do not look like a vacancy page. No vacancy title or company block was found.'
  );

  assert.equal(
    toScreenshotAnalyzeErrorMessage(
      {
        status: 422,
        payload: {
          code: 'screenshot_incomplete_info',
          missingFields: ['title', 'company'],
        },
      },
      isFakeApiError
    ),
    'Not enough vacancy details are visible in screenshots. Missing: title, company.'
  );

  assert.equal(
    toScreenshotAnalyzeErrorMessage(
      {
        status: 429,
        payload: {
          code: 'usage_limit_reached',
        },
      },
      isFakeApiError
    ),
    'You reached your plan limit for vacancy scans.'
  );

  assert.equal(
    toScreenshotAnalyzeErrorMessage(
      {
        status: 500,
        payload: {
          error: 'Vision provider failed.',
        },
      },
      isFakeApiError
    ),
    'Vision provider failed.'
  );

  assert.equal(
    toScreenshotAnalyzeErrorMessage(
      {
        status: 500,
        payload: {},
      },
      isFakeApiError
    ),
    'Screenshot parsing failed (500). Please try again.'
  );

  assert.equal(
    toScreenshotAnalyzeErrorMessage(new Error('boom'), isFakeApiError),
    SCREENSHOT_UPLOAD_TEXTS.genericAnalyzeError
  );
});

test('screenshot core builds scanner import payload with failed url fallback', () => {
  const result = createAnalyzeResult();

  assert.deepEqual(buildScannerImportFromScreenshotAnalysis(result, ' https://example.com/job/1 '), {
    importedMeta: {
      source: 'linkedin',
      cached: false,
      provider: 'screenshot_vision',
    },
    importedUrl: 'https://example.com/job/1',
  });

  assert.deepEqual(buildScannerImportFromScreenshotAnalysis(result, ''), {
    importedMeta: {
      source: 'linkedin',
      cached: false,
      provider: 'screenshot_vision',
    },
    importedUrl: SCREENSHOT_UPLOAD_TEXTS.fallbackImportUrl,
  });
});
