import type {
  BurnoutPlanResponse,
  BurnoutSeverity,
  LunarProductivityPlanResponse,
  LunarProductivitySeverity,
} from './notificationsApi';

export type DashboardInsightMetric = {
  label: string;
  value: number;
  color: string;
};

export type DashboardInsightSourceMode = 'live' | 'preview' | 'unavailable';

export type BurnoutInsightSnapshot = {
  algorithmVersion: string;
  score: number;
  severityLabel: string;
  pressureHint: string;
  dateLabel: string;
  headline: string;
  summary: string;
  reasons: string[];
  components: DashboardInsightMetric[];
};

export type LunarProductivitySnapshot = {
  algorithmVersion: string;
  score: number;
  severityLabel: string;
  directionLabel: string | null;
  directionTone: 'supportive' | 'disruptive' | 'neutral';
  pressureHint: string;
  dateLabel: string;
  headline: string;
  summary: string;
  reasons: string[];
  components: DashboardInsightMetric[];
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export const FROZEN_BURNOUT_SNAPSHOT: BurnoutInsightSnapshot = {
  algorithmVersion: 'burnout-risk-v1',
  score: 85,
  severityLabel: 'Critical',
  pressureHint: 'Critical strain today: reduce commitments before starting another deep-work block.',
  dateLabel: 'Today',
  headline: 'Reduce Load Before It Spikes',
  summary:
    'Do not stack deep work today. Close the most important item, move optional meetings, and leave recovery space before any new push.',
  reasons: [
    'Sustained-load pressure is elevated, so avoid adding new commitments before the priority item is closed.',
    'Emotional load is running hot; use shorter decision loops and avoid stacking sensitive conversations.',
    'Recovery buffer is thin, so schedule a real pause before the next demanding block.',
  ],
  components: [
    { label: 'Sustained Load', value: 47, color: '#FF6B6B' },
    { label: 'Emotional Load', value: 34, color: '#FF8A8A' },
    { label: 'Workload Friction', value: 23, color: '#FFB26B' },
    { label: 'Recovery Buffer', value: 18, color: '#F8D0A0' },
  ],
};

export const FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT: LunarProductivitySnapshot = {
  algorithmVersion: 'lunar-productivity-risk-v1',
  score: 84,
  severityLabel: 'High',
  directionLabel: 'Disruptive Window',
  directionTone: 'disruptive',
  pressureHint: 'High lunar pressure today means your focus needs protection.',
  dateLabel: 'Today',
  headline: 'Protect Your Focus Window',
  summary:
    'Focus conditions are getting noisier. Finish one priority task early, reduce switching, and move lighter work into the weaker block.',
  reasons: [
    'Attention is more likely to break under switching, so avoid opening multiple threads at once.',
    'Energy and focus are not lining up cleanly, which makes lighter work safer later in the day.',
    'Recovery will matter more than usual, so leave space between blocks instead of stacking tasks back to back.',
  ],
  components: [
    { label: 'Rhythm Pressure', value: 42, color: '#F5F7FF' },
    { label: 'Interruption Risk', value: 36, color: '#DCE7FF' },
    { label: 'Focus Drag', value: 28, color: '#C8D8FF' },
    { label: 'Recovery Capacity', value: 21, color: '#AFC2F3' },
  ],
};

function clampInsightValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function toLocalDayStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDashboardInsightDateLabel(dateKey: string, referenceDate: Date = new Date()) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return 'Today';

  const diffDays = Math.round(
    (toLocalDayStart(parsed).getTime() - toLocalDayStart(referenceDate).getTime()) / DAY_MS
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return `${MONTH_LABELS[parsed.getMonth()]} ${parsed.getDate()}`;
}

function formatDashboardInsightDayContext(dateKey: string, referenceDate: Date = new Date()) {
  const label = formatDashboardInsightDateLabel(dateKey, referenceDate);
  if (label === 'Today') return 'today';
  if (label === 'Tomorrow') return 'tomorrow';
  if (label === 'Yesterday') return 'yesterday';
  return `on ${label}`;
}

export function formatDashboardInsightSyncLabel(lastSyncedAt: string | null | undefined, referenceDate: Date = new Date()) {
  if (!lastSyncedAt) return null;
  const parsed = new Date(lastSyncedAt);
  if (!Number.isFinite(parsed.getTime())) return null;

  const sameDay = toLocalDayStart(parsed).getTime() === toLocalDayStart(referenceDate).getTime();
  const timeLabel = parsed.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (sameDay) {
    return `Updated ${timeLabel}`;
  }

  return `Updated ${formatDashboardInsightDateLabel(
    `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`,
    referenceDate
  )} ${timeLabel}`;
}

function formatBurnoutSeverityLabel(severity: BurnoutSeverity) {
  if (severity === 'critical') return 'Critical';
  if (severity === 'high') return 'High';
  if (severity === 'warn') return 'Warning';
  return 'Low';
}

function formatLunarSeverityLabel(severity: LunarProductivitySeverity) {
  if (severity === 'critical') return 'Critical';
  if (severity === 'high') return 'High';
  if (severity === 'warn') return 'Warning';
  return 'Low';
}

function formatLunarImpactDirectionLabel(direction: LunarProductivityPlanResponse['risk']['impactDirection']) {
  if (direction === 'supportive') return 'Supportive Window';
  if (direction === 'disruptive') return 'Disruptive Window';
  return null;
}

function resolveLunarPressureHint(payload: LunarProductivityPlanResponse) {
  if (payload.risk.impactDirection === 'supportive') {
    return 'Low lunar pressure today means cleaner focus is available.';
  }
  if (payload.risk.impactDirection === 'disruptive') {
    return 'High lunar pressure today means your focus needs protection.';
  }
  return 'Middle lunar pressure usually means no special focus action is needed.';
}

function resolveBurnoutHeadline(severity: BurnoutSeverity) {
  if (severity === 'critical') return 'Reduce Load Before It Spikes';
  if (severity === 'high') return 'Cut Context Switching Now';
  if (severity === 'warn') return 'Protect Recovery Space';
  return 'Keep the Day Steady';
}

function resolveLunarHeadline(payload: LunarProductivityPlanResponse) {
  if (payload.risk.impactDirection === 'supportive') return 'Use Your Best Focus Window';
  const severity = payload.risk.severity;
  if (severity === 'critical') return 'Shield Your Deep Work';
  if (severity === 'high') return 'Protect Your Focus Window';
  if (severity === 'warn') return 'Watch Your Focus Load';
  return 'Focus Conditions Look Stable';
}

function resolveBurnoutPressureHint(payload: BurnoutPlanResponse) {
  if (payload.risk.severity === 'critical') {
    return 'Critical strain today: reduce commitments before starting another deep-work block.';
  }
  if (payload.risk.severity === 'high') {
    return 'High strain today: narrow the day to one priority lane and cut switching.';
  }
  if (payload.risk.severity === 'warn') {
    return 'Recovery buffer is tightening: keep the next block simple and add a real break.';
  }
  return 'Workload strain looks manageable: keep the pace steady and avoid late overbooking.';
}

function resolveBurnoutSummary(payload: BurnoutPlanResponse, referenceDate: Date = new Date()) {
  const dayContext = formatDashboardInsightDayContext(payload.dateKey, referenceDate);
  if (payload.risk.severity === 'critical') {
    return `Do not stack deep work ${dayContext}. Close the most important item, move optional meetings, and leave recovery space before any new push.`;
  }
  if (payload.risk.severity === 'high') {
    return `Finish one priority task before taking on more work ${dayContext}. Batch messages/admin and protect at least one recovery break.`;
  }
  if (payload.risk.severity === 'warn') {
    return `Keep the workload narrower than usual ${dayContext}. Avoid multitasking, add a break after deep work, and push low-value tasks later.`;
  }
  return `Workload strain looks manageable ${dayContext}. Keep the current pace, but avoid packing the end of the day.`;
}

function resolveLunarSummary(payload: LunarProductivityPlanResponse, referenceDate: Date = new Date()) {
  const dayContext = formatDashboardInsightDayContext(payload.dateKey, referenceDate);
  if (payload.risk.impactDirection === 'supportive') {
    return `A stronger focus block is likely ${dayContext}. Use it for the task that needs your best thinking and keep meetings, chat, and admin outside it.`;
  }
  if (payload.risk.severity === 'critical') {
    return `Deep work looks fragile ${dayContext}. Stop adding new tasks, wrap the priority item, and leave recovery space before the next push.`;
  }
  if (payload.risk.severity === 'high') {
    return `Focus conditions are getting noisier ${dayContext}. Finish one priority task early, reduce switching, and move lighter work into the weaker block.`;
  }
  return `Your focus window looks easier to break ${dayContext}. Protect the next deep-work block and batch chat, email, and admin together.`;
}

function buildBurnoutReasons(payload: BurnoutPlanResponse) {
  const sustainedLoad = clampInsightValue(payload.risk.components.saturnLoad);
  const emotionalLoad = clampInsightValue(payload.risk.components.moonLoad);
  const workloadFriction = clampInsightValue(
    (payload.risk.components.workloadMismatch + payload.risk.components.tagPressure) / 2
  );
  const recoveryBuffer = clampInsightValue(payload.risk.components.recoveryBuffer);

  return [
    `Sustained-load pressure is ${sustainedLoad}/100, so keep expectations realistic and avoid adding new commitments.`,
    `Emotional load is ${emotionalLoad}/100; use shorter decision loops and avoid stacking sensitive conversations.`,
    `Workload friction is ${workloadFriction}/100 while recovery is ${recoveryBuffer}/100, so schedule a real pause before the next demanding block.`,
  ];
}

function buildLunarReasons(payload: LunarProductivityPlanResponse) {
  if (payload.risk.impactDirection === 'supportive') {
    return [
      'Single-task work should hold better than usual, so this is a strong window for writing, planning, or problem solving.',
      'Recovery capacity is stronger today, which makes a longer focus block safer than back-to-back reactive work.',
      'Interruptions are less likely to derail momentum, but only if you keep meetings and chat out of the best block.',
    ];
  }
  return [
    'Attention is more likely to break under switching, so avoid opening multiple threads at once.',
    'Energy and focus are not lining up cleanly, which makes shallow work safer than complex work later in the day.',
    'Recovery will matter more than usual, so leave space between blocks instead of stacking tasks back to back.',
  ];
}

export function toBurnoutInsightSnapshotFromPlan(
  payload: BurnoutPlanResponse,
  referenceDate: Date = new Date()
): BurnoutInsightSnapshot {
  return {
    algorithmVersion: payload.risk.algorithmVersion,
    score: clampInsightValue(payload.risk.score),
    severityLabel: formatBurnoutSeverityLabel(payload.risk.severity),
    pressureHint: resolveBurnoutPressureHint(payload),
    dateLabel: formatDashboardInsightDateLabel(payload.dateKey, referenceDate),
    headline: resolveBurnoutHeadline(payload.risk.severity),
    summary: resolveBurnoutSummary(payload, referenceDate),
    reasons: buildBurnoutReasons(payload),
    components: [
      { label: 'Sustained Load', value: clampInsightValue(payload.risk.components.saturnLoad), color: '#FF6B6B' },
      { label: 'Emotional Load', value: clampInsightValue(payload.risk.components.moonLoad), color: '#FF8A8A' },
      {
        label: 'Workload Friction',
        value: clampInsightValue((payload.risk.components.workloadMismatch + payload.risk.components.tagPressure) / 2),
        color: '#FFB26B',
      },
      {
        label: 'Recovery Buffer',
        value: clampInsightValue(payload.risk.components.recoveryBuffer),
        color: '#F8D0A0',
      },
    ],
  };
}

export function toLunarProductivityInsightSnapshotFromPlan(
  payload: LunarProductivityPlanResponse,
  referenceDate: Date = new Date()
): LunarProductivitySnapshot {
  return {
    algorithmVersion: payload.risk.algorithmVersion,
    score: clampInsightValue(payload.risk.score),
    severityLabel: formatLunarSeverityLabel(payload.risk.severity),
    directionLabel: formatLunarImpactDirectionLabel(payload.risk.impactDirection),
    directionTone: payload.risk.impactDirection ?? 'neutral',
    pressureHint: resolveLunarPressureHint(payload),
    dateLabel: formatDashboardInsightDateLabel(payload.dateKey, referenceDate),
    headline: resolveLunarHeadline(payload),
    summary: resolveLunarSummary(payload, referenceDate),
    reasons: buildLunarReasons(payload),
    components: [
      {
        label: 'Rhythm Pressure',
        value: clampInsightValue(payload.risk.components.moonPhaseLoad),
        color: '#F5F7FF',
      },
      {
        label: 'Interruption Risk',
        value: clampInsightValue(payload.risk.components.emotionalTide),
        color: '#DCE7FF',
      },
      {
        label: 'Focus Drag',
        value: clampInsightValue(
          (payload.risk.components.focusResonance + payload.risk.components.circadianAlignment) / 2
        ),
        color: '#C8D8FF',
      },
      {
        label: 'Recovery Capacity',
        value: clampInsightValue(payload.risk.components.recoveryBuffer),
        color: '#AFC2F3',
      },
    ],
  };
}
