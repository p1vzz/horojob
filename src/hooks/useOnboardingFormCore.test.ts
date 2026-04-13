import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOnboardingSubmitPayload,
  countOnboardingFilledFields,
  formatOnboardingDate,
  formatOnboardingTime,
  isValidOnboardingName,
  normalizeOnboardingNameInput,
  normalizeOnboardingNameValue,
  resolveOnboardingSubmitError,
} from './useOnboardingFormCore';

test('onboarding core formats date and time consistently', () => {
  const date = new Date(2026, 2, 30, 8, 5, 0, 0);
  assert.equal(formatOnboardingDate(date), '30/03/2026');
  assert.equal(formatOnboardingTime(date), '08:05');
});

test('onboarding core counts filled wheel fields', () => {
  assert.equal(
    countOnboardingFilledFields({
      name: 'Alex',
      birthDate: '30/03/2026',
      birthTime: '08:05',
      unknownTime: false,
      citySelected: true,
    }),
    4
  );

  assert.equal(
    countOnboardingFilledFields({
      name: 'Alex',
      birthDate: '30/03/2026',
      birthTime: '',
      unknownTime: true,
      citySelected: false,
    }),
    3
  );

  assert.equal(
    countOnboardingFilledFields({
      name: '   ',
      birthDate: '30/03/2026',
      birthTime: '08:05',
      unknownTime: false,
      citySelected: true,
    }),
    3
  );
});

test('onboarding core builds payload with normalized values', () => {
  const payload = buildOnboardingSubmitPayload({
    name: '  Alex   42   Doe  ',
    birthDate: '30/03/2026',
    birthTime: '08:05',
    unknownTime: false,
    city: 'Warsaw',
    cityGeo: {
      latitude: 52.2297,
      longitude: 21.0122,
      country: 'PL',
      admin1: 'Mazowieckie',
    },
  });

  assert.deepEqual(payload, {
    name: 'Alex Doe',
    birthDate: '30/03/2026',
    birthTime: '08:05',
    unknownTime: false,
    city: 'Warsaw',
    latitude: 52.2297,
    longitude: 21.0122,
    country: 'PL',
    admin1: 'Mazowieckie',
  });

  const unknownTimePayload = buildOnboardingSubmitPayload({
    name: 'Alex',
    birthDate: '30/03/2026',
    birthTime: '08:05',
    unknownTime: true,
    city: 'Warsaw',
    cityGeo: null,
  });

  assert.equal(unknownTimePayload.birthTime, null);
  assert.equal(unknownTimePayload.latitude, null);
});

test('onboarding core normalizes and validates names', () => {
  assert.equal(normalizeOnboardingNameInput('  Alex   42   Doe  '), 'Alex Doe ');
  assert.equal(normalizeOnboardingNameValue('  Alex   42   Doe  '), 'Alex Doe');
  assert.equal(normalizeOnboardingNameInput('   '), '');
  assert.equal(isValidOnboardingName('Alex Doe'), true);
  assert.equal(isValidOnboardingName(' Alex '), true);
  assert.equal(isValidOnboardingName('123'), false);
  assert.equal(isValidOnboardingName('   '), false);
});

test('onboarding core resolves submit error messages', () => {
  assert.equal(
    resolveOnboardingSubmitError({
      status: 503,
      payload: { error: 'maintenance' },
    }),
    'Server is temporarily unavailable. Please try again in a minute.'
  );

  assert.equal(
    resolveOnboardingSubmitError({
      status: 400,
      payload: { error: 'invalid birth date' },
    }),
    'invalid birth date'
  );

  assert.equal(
    resolveOnboardingSubmitError({
      status: 400,
      payload: {},
    }),
    'Could not save birth details (400).'
  );

  assert.equal(resolveOnboardingSubmitError(new Error('offline')), 'offline');
  assert.equal(
    resolveOnboardingSubmitError({ message: 'not api shape' }),
    'Could not save birth details. Check connection and try again.'
  );
});
