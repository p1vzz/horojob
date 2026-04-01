import type { InterviewStrategyPreferences } from '../../types/interviewStrategy';
import type { SettingsWeekdayOption } from './settingsTypes';

export const SETTINGS_INTERVIEW_DURATION_OPTIONS: Array<InterviewStrategyPreferences['slotDurationMinutes']> = [
  30,
  45,
  60,
];

export const SETTINGS_INTERVIEW_WEEKDAY_OPTIONS: SettingsWeekdayOption[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];
