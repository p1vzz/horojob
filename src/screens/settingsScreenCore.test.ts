import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createBirthProfileDraft,
  formatBirthCityLabel,
  formatBirthDateLabel,
  formatBirthNameLabel,
  formatBirthTimeLabel,
  formatInterviewCalendarOptionLabel,
  formatInterviewSlotWindow,
  formatMinuteLabel,
  nextOptionFromList,
  resolveDeviceTimezoneIana,
  shouldShowSettingsInitialLoader,
  validateBirthProfileDraft,
} from './settingsScreenCore';

test('settings core formats minute labels with clamping and zero padding', () => {
  assert.equal(formatMinuteLabel(-10), '00:00');
  assert.equal(formatMinuteLabel(61), '01:01');
  assert.equal(formatMinuteLabel(1490), '23:59');
});

test('settings core rotates through option list', () => {
  assert.equal(nextOptionFromList(540, [480, 540, 600]), 600);
  assert.equal(nextOptionFromList(600, [480, 540, 600]), 480);
  assert.equal(nextOptionFromList(777, [480, 540, 600]), 480);
});

test('settings core keeps initial loader until bootstrap and birth profile settle', () => {
  assert.equal(
    shouldShowSettingsInitialLoader({ settingsBootstrapReady: false, birthProfileLoadState: 'ready' }),
    true
  );
  assert.equal(
    shouldShowSettingsInitialLoader({ settingsBootstrapReady: true, birthProfileLoadState: 'loading' }),
    true
  );
  assert.equal(
    shouldShowSettingsInitialLoader({ settingsBootstrapReady: true, birthProfileLoadState: 'failed' }),
    false
  );
  assert.equal(
    shouldShowSettingsInitialLoader({ settingsBootstrapReady: true, birthProfileLoadState: 'ready' }),
    false
  );
});

test('settings core formats interview slot window with injected formatters', () => {
  const result = formatInterviewSlotWindow('2026-03-30T10:00:00.000Z', '2026-03-30T10:30:00.000Z', {
    formatDateLabel: () => 'Mon, Mar 30',
    formatTimeLabel: (value) => value.toISOString().slice(11, 16),
  });
  assert.equal(result, 'Mon, Mar 30 10:00-10:30');
});

test('settings core formats calendar option label', () => {
  assert.equal(
    formatInterviewCalendarOptionLabel({ id: '1', title: 'Work', sourceName: 'Google', isPrimary: false }),
    'Work - Google'
  );
  assert.equal(
    formatInterviewCalendarOptionLabel({ id: '2', title: 'Personal', sourceName: 'Personal', isPrimary: false }),
    'Personal'
  );
});

test('settings core resolves timezone with fallback', () => {
  assert.equal(resolveDeviceTimezoneIana(() => '  Europe/Warsaw  '), 'Europe/Warsaw');
  assert.equal(resolveDeviceTimezoneIana(() => ''), 'America/New_York');
  assert.equal(
    resolveDeviceTimezoneIana(() => {
      throw new Error('runtime issue');
    }),
    'America/New_York'
  );
});

test('settings core formats birth profile fields', () => {
  assert.equal(formatBirthNameLabel('  Sam   Lee '), 'Sam Lee');
  assert.equal(formatBirthDateLabel('15/06/1990'), 'Jun 15, 1990');
  assert.equal(formatBirthDateLabel('bad-date'), 'bad-date');
  assert.equal(formatBirthTimeLabel({ birthTime: '14:30', unknownTime: false }), '14:30');
  assert.equal(formatBirthTimeLabel({ birthTime: null, unknownTime: true }), 'Unknown');
  assert.equal(
    formatBirthCityLabel({ city: 'New York', admin1: 'NY', country: 'United States' }),
    'New York, NY, United States'
  );
});

test('settings core validates birth profile draft and clears coordinates when city changes', () => {
  const currentProfile = {
    name: 'Sam',
    birthDate: '15/06/1990',
    birthTime: '14:30',
    unknownTime: false,
    city: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    admin1: 'NY',
    country: 'United States',
  };
  const draft = createBirthProfileDraft(currentProfile);
  assert.deepEqual(draft, {
    name: 'Sam',
    birthDate: '15/06/1990',
    birthTime: '14:30',
    unknownTime: false,
    city: 'New York',
  });

  const unchanged = validateBirthProfileDraft(draft, currentProfile);
  assert.equal(unchanged.ok, true);
  if (unchanged.ok) {
    assert.equal(unchanged.changed, false);
    assert.equal(unchanged.input.latitude, 40.7128);
    assert.equal(unchanged.input.country, 'United States');
  }

  const changedCity = validateBirthProfileDraft({ ...draft, city: ' Boston ' }, currentProfile);
  assert.equal(changedCity.ok, true);
  if (changedCity.ok) {
    assert.equal(changedCity.changed, true);
    assert.equal(changedCity.input.city, 'Boston');
    assert.equal(changedCity.input.latitude, null);
    assert.equal(changedCity.input.longitude, null);
    assert.equal(changedCity.input.country, null);
    assert.equal(changedCity.input.admin1, null);
  }
});

test('settings core rejects invalid birth profile drafts', () => {
  assert.deepEqual(validateBirthProfileDraft(createBirthProfileDraft(null), null), {
    ok: false,
    message: 'Enter your name.',
  });

  assert.deepEqual(
    validateBirthProfileDraft(
      {
        name: 'Sam',
        birthDate: '31/02/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
      },
      null
    ),
    {
      ok: false,
      message: 'Use date format DD/MM/YYYY and make sure the date is in the past.',
    }
  );

  assert.deepEqual(
    validateBirthProfileDraft(
      {
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '99:30',
        unknownTime: false,
        city: 'New York',
      },
      null
    ),
    {
      ok: false,
      message: 'Use time format HH:MM, or mark birth time as unknown.',
    }
  );
});
