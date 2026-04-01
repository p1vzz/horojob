import type { WritableCalendarOption } from '../services/calendar';

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

export function resolveDeviceTimezoneIana(resolveTimezone: () => string | null = defaultResolveTimezone) {
  try {
    const value = resolveTimezone();
    if (value && value.trim().length > 0) return value.trim();
  } catch {
    // Fallback to product default timezone when runtime cannot resolve IANA.
  }
  return 'America/New_York';
}

function defaultResolveTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
}
