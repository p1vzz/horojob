import type { InterviewStrategySlot } from '../types/interviewStrategy';

export type InterviewSlotRow = {
  id: string;
  title: string;
  timeRange: string;
  score: number;
};

export type InterviewStrategyScoreTone = {
  accent: string;
  border: string;
  background: string;
};

type InterviewStrategyScoreToneOptions = {
  isTopPick?: boolean;
};

type InterviewStrategyDateFormatters = {
  formatDateLabel?: (value: Date) => string;
  formatTimeLabel?: (value: Date) => string;
  referenceDate?: Date;
};

const defaultDateFormatters: Required<Pick<InterviewStrategyDateFormatters, 'formatDateLabel' | 'formatTimeLabel'>> = {
  formatDateLabel: (value) =>
    value.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  formatTimeLabel: (value) =>
    value.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
};

export const DEFAULT_INTERVIEW_INSIGHT =
  'Interview Strategy prepares natal-aware timing windows for interviews and follow-ups automatically.';

export const NO_INTERVIEW_WINDOWS_TITLE = 'No standout interview windows yet';
export const NO_INTERVIEW_WINDOWS_INSIGHT =
  'Your chart does not show a clean interview timing signal for the upcoming month. Keep applying normally; we will refresh this automatically.';

export function clampInterviewStrategyScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatInterviewStrategySlotTitle(
  startAt: string,
  index: number,
  options: Pick<InterviewStrategyDateFormatters, 'formatDateLabel' | 'referenceDate'> = {}
) {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return `Slot ${index + 1}`;

  const referenceDate = options.referenceDate ?? new Date();
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(referenceDate.getDate() + 1);

  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  if (isSameDay(date, referenceDate)) return 'Today';

  const formatDateLabel = options.formatDateLabel ?? defaultDateFormatters.formatDateLabel;
  return formatDateLabel(date);
}

export function formatInterviewStrategyTimeRange(
  startAt: string,
  endAt: string,
  options: Pick<InterviewStrategyDateFormatters, 'formatTimeLabel'> = {}
) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '--:-- - --:--';

  const formatTimeLabel = options.formatTimeLabel ?? defaultDateFormatters.formatTimeLabel;
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
}

function normalizeInterviewInsightText(value: string | null | undefined) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function buildInterviewStrategyInsight(
  slot: InterviewStrategySlot | undefined,
  options: InterviewStrategyDateFormatters = {}
) {
  const directText = normalizeInterviewInsightText(slot?.explanation);
  if (directText.length >= 68) return directText;
  if (!slot) return DEFAULT_INTERVIEW_INSIGHT;

  const dateTitle = formatInterviewStrategySlotTitle(slot.startAt, 0, options);
  const timeRange = formatInterviewStrategyTimeRange(slot.startAt, slot.endAt, options);
  const drivers: string[] = [];

  if ((slot.breakdown.transitNatalScore ?? 0) >= 72) drivers.push('natal-transit timing is supportive');
  if ((slot.breakdown.natalCommunicationScore ?? 0) >= 72) drivers.push('communication signals are elevated');
  if (slot.breakdown.dailyCareerScore >= 72) drivers.push('career momentum is elevated');
  if (slot.breakdown.aiSynergyScore >= 72) drivers.push('AI synergy is supportive');
  if (slot.breakdown.weekdayWeight >= 78) drivers.push('the weekday pattern is strong');
  if (slot.breakdown.hourWeight >= 80) drivers.push('the hour quality is near peak');

  const reason =
    drivers.length > 0
      ? `${drivers.slice(0, 2).join(' and ')}.`
      : 'communication and focus are in a balanced range.';

  return `${dateTitle} (${timeRange}) looks supportive for interviews: ${reason} Use this window for conversations where first impression and clarity matter most.`;
}

export function toInterviewSlotRows(
  slots: InterviewStrategySlot[],
  options: InterviewStrategyDateFormatters = {}
): InterviewSlotRow[] {
  return slots.map((slot, index) => ({
    id: slot.id,
    title: formatInterviewStrategySlotTitle(slot.startAt, index, options),
    timeRange: formatInterviewStrategyTimeRange(slot.startAt, slot.endAt, options),
    score: clampInterviewStrategyScore(slot.score),
  }));
}

export function resolveInterviewStrategyScoreTone(
  score: number,
  options: InterviewStrategyScoreToneOptions = {}
): InterviewStrategyScoreTone {
  if (options.isTopPick) {
    return {
      accent: '#38CC88',
      border: 'rgba(56,204,136,0.32)',
      background: 'rgba(56,204,136,0.08)',
    };
  }
  if (score >= 90) {
    return {
      accent: '#C9A84C',
      border: 'rgba(201,168,76,0.3)',
      background: 'rgba(201,168,76,0.075)',
    };
  }
  if (score >= 80) {
    return {
      accent: '#D9C06B',
      border: 'rgba(217,192,107,0.24)',
      background: 'rgba(217,192,107,0.06)',
    };
  }
  return {
    accent: '#CFC5A7',
    border: 'rgba(207,197,167,0.2)',
    background: 'rgba(255,255,255,0.035)',
  };
}

export function resolveInterviewStrategyTimingLabel(score: number, options: { isTopPick?: boolean } = {}) {
  if (options.isTopPick) return 'Best';
  if (score >= 90) return 'Strong';
  if (score >= 80) return 'Favorable';
  return 'Supportive';
}
