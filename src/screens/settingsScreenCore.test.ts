import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatInterviewCalendarOptionLabel,
  formatInterviewSlotWindow,
  formatMinuteLabel,
  nextOptionFromList,
  resolveDeviceTimezoneIana,
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
