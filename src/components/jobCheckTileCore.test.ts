import assert from 'node:assert/strict';
import test from 'node:test';
import { buildJobCheckScannerParams, normalizeJobCheckUrlInput } from './jobCheckTileCore';

test('job check tile core normalizes url input by trimming whitespace', () => {
  assert.equal(normalizeJobCheckUrlInput('  https://example.com/job  '), 'https://example.com/job');
  assert.equal(normalizeJobCheckUrlInput('   '), '');
});

test('job check tile core returns undefined params for empty input', () => {
  assert.equal(buildJobCheckScannerParams('   '), undefined);
});

test('job check tile core builds scanner params with default autoStart=false', () => {
  assert.deepEqual(buildJobCheckScannerParams(' https://example.com/job '), {
    initialUrl: 'https://example.com/job',
    autoStart: false,
  });
});

test('job check tile core forwards explicit autoStart flag', () => {
  assert.deepEqual(buildJobCheckScannerParams('https://example.com/job', { autoStart: true }), {
    initialUrl: 'https://example.com/job',
    autoStart: true,
  });
});
