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

export type BirthProfileEditableField = 'name' | 'birthDate' | 'birthTime' | 'city';

type BirthProfileDraftValidation =
  | {
      ok: true;
      algorithmChanged: boolean;
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

function validateBirthProfileName(nameInput: string) {
  const name = normalizeSpaces(nameInput);
  if (name.length < 1) {
    return { ok: false as const, message: 'Enter your name.' };
  }
  if (name.length > 80) {
    return { ok: false as const, message: 'Name must be 80 characters or less.' };
  }
  return { ok: true as const, name };
}

function validateBirthProfileDate(birthDateInput: string) {
  const birthDate = parseBirthDate(birthDateInput);
  if (!birthDate) {
    return { ok: false as const, message: 'Use date format DD/MM/YYYY and make sure the date is in the past.' };
  }
  return { ok: true as const, birthDate };
}

function validateBirthProfileTime(input: Pick<BirthProfileDraft, 'birthTime' | 'unknownTime'>) {
  const birthTime = input.unknownTime ? null : parseBirthTime(input.birthTime);
  if (!input.unknownTime && !birthTime) {
    return { ok: false as const, message: 'Use time format HH:MM, or mark birth time as unknown.' };
  }
  return { ok: true as const, birthTime, unknownTime: input.unknownTime };
}

function validateBirthProfileCity(cityInput: string) {
  const city = normalizeSpaces(cityInput);
  if (city.length < 2) {
    return { ok: false as const, message: 'Enter a birth city.' };
  }
  if (city.length > 160) {
    return { ok: false as const, message: 'Birth city must be 160 characters or less.' };
  }
  return { ok: true as const, city };
}

export function validateBirthProfileFieldDraft(
  field: BirthProfileEditableField,
  draft: BirthProfileDraft,
  currentProfile: OnboardingData | null
): BirthProfileDraftValidation {
  if (!currentProfile) {
    return { ok: false, message: 'Complete your birth profile before editing individual fields.' };
  }

  if (field === 'name') {
    const validated = validateBirthProfileName(draft.name);
    if (!validated.ok) return validated;
    const input: OnboardingData = {
      ...currentProfile,
      name: validated.name,
    };
    const changed = normalizeComparableText(input.name) !== normalizeComparableText(currentProfile.name);
    return {
      ok: true,
      algorithmChanged: false,
      changed,
      input,
    };
  }

  if (field === 'birthDate') {
    const validated = validateBirthProfileDate(draft.birthDate);
    if (!validated.ok) return validated;
    const input: OnboardingData = {
      ...currentProfile,
      birthDate: validated.birthDate,
    };
    const changed = input.birthDate !== currentProfile.birthDate;
    return {
      ok: true,
      algorithmChanged: changed,
      changed,
      input,
    };
  }

  if (field === 'birthTime') {
    const validated = validateBirthProfileTime(draft);
    if (!validated.ok) return validated;
    const input: OnboardingData = {
      ...currentProfile,
      birthTime: validated.birthTime,
      unknownTime: validated.unknownTime,
    };
    const changed = input.birthTime !== (currentProfile.birthTime ?? null) || input.unknownTime !== currentProfile.unknownTime;
    return {
      ok: true,
      algorithmChanged: changed,
      changed,
      input,
    };
  }

  const validated = validateBirthProfileCity(draft.city);
  if (!validated.ok) return validated;
  const cityChanged = normalizeComparableText(validated.city) !== normalizeComparableText(currentProfile.city);
  const input: OnboardingData = {
    ...currentProfile,
    city: validated.city,
    latitude: cityChanged ? null : currentProfile.latitude ?? null,
    longitude: cityChanged ? null : currentProfile.longitude ?? null,
    country: cityChanged ? null : currentProfile.country ?? null,
    admin1: cityChanged ? null : currentProfile.admin1 ?? null,
  };
  return {
    ok: true,
    algorithmChanged: cityChanged,
    changed: cityChanged,
    input,
  };
}

export function validateBirthProfileDraft(
  draft: BirthProfileDraft,
  currentProfile: OnboardingData | null
): BirthProfileDraftValidation {
  const nameValidation = validateBirthProfileName(draft.name);
  if (!nameValidation.ok) return nameValidation;

  const dateValidation = validateBirthProfileDate(draft.birthDate);
  if (!dateValidation.ok) return dateValidation;

  const timeValidation = validateBirthProfileTime(draft);
  if (!timeValidation.ok) return timeValidation;

  const cityValidation = validateBirthProfileCity(draft.city);
  if (!cityValidation.ok) return cityValidation;

  const name = nameValidation.name;
  const birthDate = dateValidation.birthDate;
  const birthTime = timeValidation.birthTime;
  const city = cityValidation.city;
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

  const algorithmChanged =
    !currentProfile ||
    input.birthDate !== currentProfile.birthDate ||
    input.birthTime !== (currentProfile.birthTime ?? null) ||
    input.unknownTime !== currentProfile.unknownTime ||
    normalizeComparableText(input.city) !== normalizeComparableText(currentProfile.city);
  const changed = algorithmChanged || normalizeComparableText(input.name) !== normalizeComparableText(currentProfile.name);

  return {
    ok: true,
    algorithmChanged,
    changed,
    input,
  };
}
