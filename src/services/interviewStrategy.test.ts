import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDefaultInterviewStrategyPreferences,
  normalizeInterviewStrategyPreferences,
} from './interviewStrategy';

test('getDefaultInterviewStrategyPreferences returns stable defaults', () => {
  const defaults = getDefaultInterviewStrategyPreferences();
  assert.deepEqual(defaults, {
    slotDurationMinutes: 60,
    allowedWeekdays: [1, 2, 3, 4, 5],
    workdayStartMinute: 540,
    workdayEndMinute: 1080,
    quietHoursStartMinute: 1290,
    quietHoursEndMinute: 480,
    slotsPerWeek: 5,
  });
});

test('normalizeInterviewStrategyPreferences sanitizes invalid payload', () => {
  const normalized = normalizeInterviewStrategyPreferences({
    slotDurationMinutes: 999 as never,
    allowedWeekdays: [8, -1, 5, 5, 3, 3] as never,
    workdayStartMinute: 1400,
    workdayEndMinute: 1000,
    quietHoursStartMinute: -100,
    quietHoursEndMinute: 2000,
    slotsPerWeek: 50,
  });

  assert.equal(normalized.slotDurationMinutes, 60);
  assert.deepEqual(normalized.allowedWeekdays, [3, 5]);
  assert.equal(normalized.workdayStartMinute, 1400);
  assert.ok(normalized.workdayEndMinute > normalized.workdayStartMinute);
  assert.equal(normalized.quietHoursStartMinute, 0);
  assert.equal(normalized.quietHoursEndMinute, 1439);
  assert.equal(normalized.slotsPerWeek, 10);
});

test('normalizeInterviewStrategyPreferences falls back on empty weekdays', () => {
  const normalized = normalizeInterviewStrategyPreferences({
    allowedWeekdays: [],
  });

  assert.deepEqual(normalized.allowedWeekdays, [1, 2, 3, 4, 5]);
});
