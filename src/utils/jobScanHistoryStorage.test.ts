import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobScanHistoryEntry } from './jobScanHistoryStorage';
import {
  getJobScanHistoryEntryKey,
  mergeJobScanHistoryEntries,
  selectJobScanHistoryEntriesForSync,
} from './jobScanHistoryStorage';

function buildEntry(input: {
  url: string;
  savedAt: string;
  analysisId: string;
}): JobScanHistoryEntry {
  return {
    url: input.url,
    savedAt: input.savedAt,
    meta: {
      source: 'linkedin',
      cached: false,
      provider: 'http_fetch',
    },
    analysis: {
      analysisId: input.analysisId,
      status: 'done',
      scanDepth: 'full',
      requestedScanDepth: 'full',
      providerUsed: 'http_fetch',
      cached: false,
      cache: {
        raw: false,
        parsed: false,
        analysis: false,
      },
      usage: {
        plan: 'free',
        depth: 'full',
        incremented: true,
      },
      versions: {
        parserVersion: 'parser-v1',
        rubricVersion: 'rubric-v1',
        modelVersion: 'model-v1',
      },
      scores: {
        compatibility: 80,
        aiReplacementRisk: 20,
        overall: 75,
      },
      breakdown: [],
      jobSummary: 'Example summary',
      tags: ['remote'],
      descriptors: ['strategy'],
      market: null,
      job: {
        title: 'Product Manager',
        company: 'Acme',
        location: 'Remote',
        salaryText: null,
        employmentType: 'Full-time',
        source: 'linkedin',
      },
    },
  };
}

test('mergeJobScanHistoryEntries keeps the newest entry per normalized url', () => {
  const older = buildEntry({
    url: 'https://www.linkedin.com/jobs/view/1234567890/',
    savedAt: '2026-04-20T08:00:00.000Z',
    analysisId: 'analysis-1',
  });
  const newer = buildEntry({
    url: 'https://WWW.LINKEDIN.COM/jobs/view/1234567890/#details',
    savedAt: '2026-04-21T08:00:00.000Z',
    analysisId: 'analysis-2',
  });
  const distinct = buildEntry({
    url: 'Screenshot Upload',
    savedAt: '2026-04-22T08:00:00.000Z',
    analysisId: 'analysis-3',
  });

  const merged = mergeJobScanHistoryEntries([older, newer, distinct], 8);

  assert.equal(merged.length, 2);
  assert.equal(merged[0]?.analysis.analysisId, 'analysis-3');
  assert.equal(merged[1]?.analysis.analysisId, 'analysis-2');
});

test('selectJobScanHistoryEntriesForSync returns only missing or newer local entries', () => {
  const remoteCurrent = buildEntry({
    url: 'https://www.linkedin.com/jobs/view/1234567890/',
    savedAt: '2026-04-20T08:00:00.000Z',
    analysisId: 'analysis-1',
  });
  const localNewer = buildEntry({
    url: 'https://www.linkedin.com/jobs/view/1234567890/',
    savedAt: '2026-04-21T08:00:00.000Z',
    analysisId: 'analysis-2',
  });
  const localMissing = buildEntry({
    url: 'https://wellfound.com/jobs/abc',
    savedAt: '2026-04-22T08:00:00.000Z',
    analysisId: 'analysis-3',
  });

  const entriesToSync = selectJobScanHistoryEntriesForSync(
    [localNewer, localMissing],
    [remoteCurrent],
  );

  assert.deepEqual(
    entriesToSync.map((entry) => getJobScanHistoryEntryKey(entry)),
    [
      getJobScanHistoryEntryKey(localMissing),
      getJobScanHistoryEntryKey(localNewer),
    ],
  );
});
