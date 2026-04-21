import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInterviewStrategyPreparationAlert } from './interviewStrategySettingsCore';

test('interview strategy alert resolver explains missing natal dependencies', () => {
  assert.deepEqual(
    resolveInterviewStrategyPreparationAlert({
      status: 404,
      payload: { error: 'Natal chart not found. Generate natal chart first.' },
    }),
    {
      title: 'Natal Chart Required',
      message: 'Your natal chart needs to finish preparing before Interview Strategy can update your windows.',
    },
  );

  assert.deepEqual(
    resolveInterviewStrategyPreparationAlert({
      status: 404,
      payload: { error: 'Birth profile not found. Complete onboarding first.' },
    }),
    {
      title: 'Birth Profile Required',
      message: 'Complete your birth profile first, then Interview Strategy can prepare your windows.',
    },
  );

  assert.deepEqual(resolveInterviewStrategyPreparationAlert(new Error('Complete your birth profile to prepare your career map.')), {
    title: 'Birth Profile Required',
    message: 'Complete your birth profile first, then Interview Strategy can prepare your windows.',
  });
});

test('interview strategy alert resolver handles long generation and transit failures', () => {
  const timeout = new Error('Request timed out after 90000ms');
  timeout.name = 'FetchTimeoutError';

  assert.deepEqual(resolveInterviewStrategyPreparationAlert(timeout), {
    title: 'Still Generating',
    message: 'Future transit preparation can take up to a minute. Try again in a moment.',
  });

  assert.deepEqual(
    resolveInterviewStrategyPreparationAlert({
      status: 502,
      payload: { error: 'Daily transit data unavailable for interview strategy generation.' },
    }),
    {
      title: 'Transit Data Unavailable',
      message: 'Future transit data could not be prepared right now. Try again in a moment.',
    },
  );
});
