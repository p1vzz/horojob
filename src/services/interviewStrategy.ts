import type { InterviewStrategyPreferences } from '../types/interviewStrategy';

const DEFAULT_PREFERENCES: InterviewStrategyPreferences = {
  slotDurationMinutes: 60,
  allowedWeekdays: [1, 2, 3, 4, 5],
  workdayStartMinute: 540,
  workdayEndMinute: 1080,
  quietHoursStartMinute: 1290,
  quietHoursEndMinute: 480,
  slotsPerWeek: 5,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isSlotDurationMinutes(input: unknown): input is 30 | 45 | 60 {
  return input === 30 || input === 45 || input === 60;
}

function normalizeWeekdays(input: unknown) {
  if (!Array.isArray(input)) return [...DEFAULT_PREFERENCES.allowedWeekdays];
  const unique = Array.from(
    new Set(
      input
        .map((value) => (typeof value === 'number' ? Math.trunc(value) : Number.NaN))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    )
  ).sort((a, b) => a - b);
  if (unique.length === 0) return [...DEFAULT_PREFERENCES.allowedWeekdays];
  return unique;
}

function normalizeMinute(value: unknown, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return clamp(Math.trunc(value), 0, 1439);
}

function normalizeSlotsPerWeek(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_PREFERENCES.slotsPerWeek;
  return clamp(Math.trunc(value), 1, 10);
}

export function getDefaultInterviewStrategyPreferences(): InterviewStrategyPreferences {
  return { ...DEFAULT_PREFERENCES };
}

export function normalizeInterviewStrategyPreferences(
  input?: Partial<InterviewStrategyPreferences> | InterviewStrategyPreferences | null
): InterviewStrategyPreferences {
  if (!input) return getDefaultInterviewStrategyPreferences();

  const slotDurationMinutes = isSlotDurationMinutes(input.slotDurationMinutes)
    ? input.slotDurationMinutes
    : DEFAULT_PREFERENCES.slotDurationMinutes;
  const allowedWeekdays = normalizeWeekdays(input.allowedWeekdays);
  const quietHoursStartMinute = normalizeMinute(input.quietHoursStartMinute, DEFAULT_PREFERENCES.quietHoursStartMinute);
  const quietHoursEndMinute = normalizeMinute(input.quietHoursEndMinute, DEFAULT_PREFERENCES.quietHoursEndMinute);
  const workdayStartMinute = normalizeMinute(input.workdayStartMinute, DEFAULT_PREFERENCES.workdayStartMinute);
  let workdayEndMinute = normalizeMinute(input.workdayEndMinute, DEFAULT_PREFERENCES.workdayEndMinute);
  if (workdayEndMinute <= workdayStartMinute + slotDurationMinutes) {
    workdayEndMinute = clamp(workdayStartMinute + slotDurationMinutes + 60, slotDurationMinutes, 1439);
  }

  return {
    slotDurationMinutes,
    allowedWeekdays,
    workdayStartMinute,
    workdayEndMinute,
    quietHoursStartMinute,
    quietHoursEndMinute,
    slotsPerWeek: normalizeSlotsPerWeek(input.slotsPerWeek),
  };
}

