import type { WritableCalendarOption } from '../services/calendar';
import { resolveDeviceTimezoneIana } from '../utils/timezone';
import type { OnboardingData } from '../utils/onboardingStorage';

export { resolveDeviceTimezoneIana };

export type SettingsBirthProfileLoadState = 'loading' | 'ready' | 'missing' | 'failed';

export function shouldShowSettingsInitialLoader(input: {
  birthProfileLoadState: SettingsBirthProfileLoadState;
  settingsBootstrapReady: boolean;
}) {
  return !input.settingsBootstrapReady || input.birthProfileLoadState === 'loading';
}

export function formatMinuteLabel(minuteOfDay: number) {
  const normalized = Math.max(0, Math.min(1439, Math.trunc(minuteOfDay)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function nextOptionFromList(current: number, options: number[]) {
  const index = options.indexOf(current);
  if (index < 0 || index === options.length - 1) return options[0];
  return options[index + 1];
}

type SlotWindowFormatters = {
  formatDateLabel: (value: Date) => string;
  formatTimeLabel: (value: Date) => string;
};

const defaultSlotWindowFormatters: SlotWindowFormatters = {
  formatDateLabel: (value) =>
    value.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  formatTimeLabel: (value) =>
    value.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }),
};

export function formatInterviewSlotWindow(
  startAt: string,
  endAt: string,
  formatters: SlotWindowFormatters = defaultSlotWindowFormatters
) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${formatters.formatDateLabel(start)} ${formatters.formatTimeLabel(start)}-${formatters.formatTimeLabel(end)}`;
}

export function formatInterviewCalendarOptionLabel(option: WritableCalendarOption) {
  if (!option.sourceName || option.sourceName === option.title) return option.title;
  return `${option.title} - ${option.sourceName}`;
}

const BIRTH_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatBirthNameLabel(name: string | null | undefined) {
  const normalized = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  return normalized.length > 0 ? normalized : 'Not set';
}

export function formatBirthDateLabel(birthDate: string | null | undefined) {
  if (!birthDate) return 'Not set';
  const parts = birthDate.split('/');
  if (parts.length !== 3) return birthDate;

  const [dayRaw, monthRaw, yearRaw] = parts;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return birthDate;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return birthDate;
  }

  return `${BIRTH_MONTH_LABELS[month - 1]} ${day}, ${year}`;
}

export function formatBirthTimeLabel(profile: Pick<OnboardingData, 'birthTime' | 'unknownTime'> | null | undefined) {
  if (!profile) return 'Not set';
  if (profile.unknownTime) return 'Unknown';
  return profile.birthTime || 'Not set';
}

export function formatBirthCityLabel(
  profile: Pick<OnboardingData, 'city' | 'admin1' | 'country'> | null | undefined
) {
  if (!profile?.city) return 'Not set';
  return [profile.city, profile.admin1, profile.country].filter(Boolean).join(', ');
}

export type BirthProfileDraft = {
  name: string;
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  city: string;
};

type BirthProfileDraftValidation =
  | {
      ok: true;
      changed: boolean;
      input: OnboardingData;
    }
  | {
      ok: false;
      message: string;
    };

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeComparableText(value: string | null | undefined) {
  return typeof value === 'string' ? normalizeSpaces(value).toLowerCase() : '';
}

function parseBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  if (date.getTime() > Date.now()) {
    return null;
  }
  return value.trim();
}

function parseBirthTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return value.trim();
}

export function createBirthProfileDraft(profile: OnboardingData | null): BirthProfileDraft {
  return {
    name: profile?.name ?? '',
    birthDate: profile?.birthDate ?? '',
    birthTime: profile?.birthTime ?? '',
    unknownTime: profile?.unknownTime ?? false,
    city: profile?.city ?? '',
  };
}

export function validateBirthProfileDraft(
  draft: BirthProfileDraft,
  currentProfile: OnboardingData | null
): BirthProfileDraftValidation {
  const name = normalizeSpaces(draft.name);
  if (name.length < 1) {
    return { ok: false, message: 'Enter your name.' };
  }
  if (name.length > 80) {
    return { ok: false, message: 'Name must be 80 characters or less.' };
  }

  const birthDate = parseBirthDate(draft.birthDate);
  if (!birthDate) {
    return { ok: false, message: 'Use date format DD/MM/YYYY and make sure the date is in the past.' };
  }

  const birthTime = draft.unknownTime ? null : parseBirthTime(draft.birthTime);
  if (!draft.unknownTime && !birthTime) {
    return { ok: false, message: 'Use time format HH:MM, or mark birth time as unknown.' };
  }

  const city = normalizeSpaces(draft.city);
  if (city.length < 2) {
    return { ok: false, message: 'Enter a birth city.' };
  }
  if (city.length > 160) {
    return { ok: false, message: 'Birth city must be 160 characters or less.' };
  }

  const cityChanged = normalizeComparableText(city) !== normalizeComparableText(currentProfile?.city);
  const input: OnboardingData = {
    name,
    birthDate,
    birthTime,
    unknownTime: draft.unknownTime,
    city,
    latitude: cityChanged ? null : currentProfile?.latitude ?? null,
    longitude: cityChanged ? null : currentProfile?.longitude ?? null,
    country: cityChanged ? null : currentProfile?.country ?? null,
    admin1: cityChanged ? null : currentProfile?.admin1 ?? null,
  };

  const changed =
    !currentProfile ||
    normalizeComparableText(input.name) !== normalizeComparableText(currentProfile.name) ||
    input.birthDate !== currentProfile.birthDate ||
    input.birthTime !== (currentProfile.birthTime ?? null) ||
    input.unknownTime !== currentProfile.unknownTime ||
    normalizeComparableText(input.city) !== normalizeComparableText(currentProfile.city);

  return {
    ok: true,
    changed,
    input,
  };
}
