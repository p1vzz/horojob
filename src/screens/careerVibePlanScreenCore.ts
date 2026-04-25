import type { CareerVibePlanResponse } from '../services/astrologyApiCore';

export type CareerVibeMetricRow = {
  label: string;
  value: number;
  color: string;
  detail: string;
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateLabel(iso: string) {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildCareerVibeMetricRows(metrics: CareerVibePlanResponse['metrics']): CareerVibeMetricRow[] {
  return [
    {
      label: 'Energy',
      value: clampScore(metrics.energy),
      color: '#C9A84C',
      detail: 'Execution capacity',
    },
    {
      label: 'Focus',
      value: clampScore(metrics.focus),
      color: '#7C5CFF',
      detail: 'Deep work support',
    },
    {
      label: 'Opportunity',
      value: clampScore(metrics.opportunity),
      color: '#38CC88',
      detail: 'Timing quality',
    },
    {
      label: 'AI Fit',
      value: clampScore(metrics.aiSynergy),
      color: '#65B8FF',
      detail: 'AI collaboration fit',
    },
  ];
}

export function normalizeCareerVibeList(items: string[], fallback: string) {
  const values = items
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return values.length > 0 ? values : [fallback];
}

export function formatCareerVibePlanMeta(plan: CareerVibePlanResponse) {
  const source = plan.narrativeStatus === 'ready' && plan.narrativeSource === 'llm'
    ? 'Ready'
    : plan.narrativeStatus === 'pending'
      ? 'Preparing'
      : plan.narrativeStatus === 'failed'
        ? 'Failed'
        : 'Unavailable';
  const cache = plan.cached ? 'Cached' : 'Fresh';
  const generatedAt = formatDateLabel(plan.generatedAt);
  return [cache, source, generatedAt].filter(Boolean).join(' | ');
}

export function formatCareerVibePlanHeaderSubtitle(
  plan: CareerVibePlanResponse | null,
  sourceMode: 'live' | 'cache' | 'empty',
  showTechnicalHints: boolean,
) {
  if (!plan) return "Building today's work plan";
  if (showTechnicalHints) {
    return [formatCareerVibePlanMeta(plan), sourceMode === 'cache' ? 'Saved on device' : null].filter(Boolean).join(' | ');
  }
  if (plan.narrativeStatus === 'pending') return "Today's work plan is preparing";
  if (!plan.plan) return "Today's work plan is unavailable";
  return sourceMode === 'cache' ? "Today's saved work plan" : "Today's work plan";
}

export function formatCareerVibePlanInlineError(
  rawMessage: string,
  sourceMode: 'live' | 'cache' | 'empty',
  showTechnicalHints: boolean,
) {
  if (showTechnicalHints) return rawMessage;
  if (sourceMode === 'cache') return "Showing your saved plan while today's update is unavailable.";
  return "Today's Career Vibe could not update yet. Try again when the connection is stable.";
}

export function resolveCareerVibePlanErrorMessage(error: unknown) {
  const status = typeof (error as { status?: unknown })?.status === 'number'
    ? (error as { status: number }).status
    : null;

  if (status === 401) return 'Sign in again to refresh Career Vibe.';
  if (status === 404) return 'Complete your birth profile first, then open Career Vibe again.';

  const payload = (error as { payload?: unknown })?.payload;
  if (payload && typeof payload === 'object') {
    const message = (payload as Record<string, unknown>).error;
    if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Career Vibe is unavailable right now.';
}
