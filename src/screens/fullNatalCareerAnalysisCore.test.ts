import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FULL_NATAL_GENERATION_STEPS,
  resolveFullNatalLoaderContent,
  resolveFullNatalAnalysisErrorCopy,
  shouldShowProfileChangeNotice,
} from './fullNatalCareerAnalysisCore';

test('full natal generation loader exposes stable human steps', () => {
  assert.deepEqual(FULL_NATAL_GENERATION_STEPS, [
    'Preparing your birth details',
    'Reading your natal chart',
    'Building your career blueprint',
    'Checking the finished report',
  ]);
});

test('full natal loader content prefers server progress copy and active detail', () => {
  assert.deepEqual(
    resolveFullNatalLoaderContent({
      title: 'Building Career Blueprint',
      subtitle: 'Preparing the report.',
      status: 'running',
      stages: [
        { title: 'Preparing your birth details', detail: 'Checking the details.', state: 'complete' },
        { title: 'Taking a backup route', detail: 'This can take a little longer.', state: 'active' },
      ],
    }),
    {
      title: 'Building Career Blueprint',
      subtitle: 'This can take a little longer.',
      steps: ['Preparing your birth details', 'Taking a backup route'],
      activeStepIndex: 1,
    },
  );
});

test('full natal error copy maps missing natal chart to generate action', () => {
  assert.deepEqual(resolveFullNatalAnalysisErrorCopy({ status: 404, code: 'natal_chart_missing' }), {
    title: 'Natal chart required',
    message: 'Generate your natal chart first so we can build the full career report from current birth data.',
    action: 'generate_natal_chart',
    actionLabel: 'Generate Natal Chart',
  });
});

test('full natal error copy maps timeout and provider failures to retry copy', () => {
  assert.equal(resolveFullNatalAnalysisErrorCopy({ isTimeout: true }).title, 'Generation took too long');
  assert.equal(resolveFullNatalAnalysisErrorCopy({ code: 'full_natal_llm_invalid_response' }).title, 'Report validation failed');
  assert.equal(resolveFullNatalAnalysisErrorCopy({ status: 503 }).title, 'Generator unavailable');
  assert.equal(resolveFullNatalAnalysisErrorCopy({ isNetworkError: true }).title, 'Server unavailable');
});

test('full natal profile change notice respects expiry date', () => {
  const notice = {
    profileUpdatedAt: '2026-04-20T10:00:00.000Z',
    expiresAt: '2026-04-23T10:00:00.000Z',
  };

  assert.equal(shouldShowProfileChangeNotice(notice, Date.parse('2026-04-22T10:00:00.000Z')), true);
  assert.equal(shouldShowProfileChangeNotice(notice, Date.parse('2026-04-24T10:00:00.000Z')), false);
  assert.equal(shouldShowProfileChangeNotice(null, Date.parse('2026-04-22T10:00:00.000Z')), false);
});
