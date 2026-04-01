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

export type DashboardInsightSourceMode = 'live' | 'preview' | 'fallback';

export type BurnoutInsightSnapshot = {
  algorithmVersion: string;
  score: number;
  severityLabel: string;
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
  dateLabel: 'Today',
  headline: 'System Strain Detected',
  summary:
    'Saturn and Moon pressure are stacking above your recovery buffer. Protect deep focus and reduce switching today.',
  reasons: [
    'Saturn hard-aspect load is elevated, increasing pressure on sustained effort.',
    'Moon volatility adds emotional drag and weaker energy recovery loops.',
    'Context-switch and rush-bias tags are higher than your stabilization baseline.',
  ],
  components: [
    { label: 'Saturn Load', value: 47, color: '#FF6B6B' },
    { label: 'Moon Load', value: 34, color: '#FF8A8A' },
    { label: 'Mismatch', value: 23, color: '#FFB26B' },
    { label: 'Recovery Buffer', value: 18, color: '#F8D0A0' },
  ],
};

export const FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT: LunarProductivitySnapshot = {
  algorithmVersion: 'lunar-productivity-risk-v1',
  score: 78,
  severityLabel: 'High',
  dateLabel: 'Today',
  headline: 'Lunar Focus Window Shifting',
  summary:
    'Moon phase pressure is rising into your core work block. Protect deep-focus tasks and reduce context switching before peak hours.',
  reasons: [
    'Waxing-phase acceleration is increasing decision velocity and interruption risk.',
    'Moon hard aspects are pulling attention into reactive loops during your midday window.',
    'Focus momentum is below lunar rhythm baseline, so recovery time should be scheduled earlier.',
  ],
  components: [
    { label: 'Phase Load', value: 42, color: '#F5F7FF' },
    { label: 'Emotion Tide', value: 36, color: '#DCE7FF' },
    { label: 'Focus Resonance', value: 28, color: '#C8D8FF' },
    { label: 'Recovery Buffer', value: 21, color: '#AFC2F3' },
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

export function formatDashboardInsightSourceLabel(mode: DashboardInsightSourceMode) {
  if (mode === 'live') return 'LIVE';
  if (mode === 'fallback') return 'FALLBACK';
  return 'PREVIEW';
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

function resolveBurnoutHeadline(severity: BurnoutSeverity) {
  if (severity === 'critical') return 'System Strain Detected';
  if (severity === 'high') return 'Burnout Pressure Building';
  if (severity === 'warn') return 'Recovery Buffer Tightening';
  return 'Recovery Window Stable';
}

function resolveLunarHeadline(severity: LunarProductivitySeverity) {
  if (severity === 'critical') return 'Lunar Focus Window Collapsing';
  if (severity === 'high') return 'Lunar Focus Window Shifting';
  if (severity === 'warn') return 'Lunar Focus Drift Emerging';
  return 'Lunar Rhythm Stable';
}

function resolveBurnoutSummary(payload: BurnoutPlanResponse, referenceDate: Date = new Date()) {
  const severityLabel = formatBurnoutSeverityLabel(payload.risk.severity).toLowerCase();
  return `Burnout risk is ${payload.risk.score}% (${severityLabel}) based on Saturn pressure, Moon load, and the current recovery buffer for ${formatDashboardInsightDateLabel(
    payload.dateKey,
    referenceDate
  ).toLowerCase()}.`;
}

function resolveLunarSummary(payload: LunarProductivityPlanResponse, referenceDate: Date = new Date()) {
  const severityLabel = formatLunarSeverityLabel(payload.risk.severity).toLowerCase();
  const phase = payload.risk.signals.moonPhase.replace(/_/g, ' ');
  return `Lunar productivity risk is ${payload.risk.score}% (${severityLabel}) with ${phase} conditions influencing focus stability and recovery timing ${formatDashboardInsightDateLabel(
    payload.dateKey,
    referenceDate
  ).toLowerCase()}.`;
}

function buildBurnoutReasons(payload: BurnoutPlanResponse) {
  return [
    `Saturn load is ${clampInsightValue(payload.risk.components.saturnLoad)}, signalling sustained pressure on effort and pacing.`,
    `Moon load is ${clampInsightValue(payload.risk.components.moonLoad)}, increasing emotional drag across the workday.`,
    `Mismatch pressure combines workload strain and tag pressure at ${clampInsightValue(
      (payload.risk.components.workloadMismatch + payload.risk.components.tagPressure) / 2
    )}, so stabilizing breaks should start earlier than usual.`,
  ];
}

function buildLunarReasons(payload: LunarProductivityPlanResponse) {
  return [
    `Phase load is ${clampInsightValue(payload.risk.components.moonPhaseLoad)} during the ${payload.risk.signals.moonPhase.replace(/_/g, ' ')} cycle.`,
    `Emotional tide is ${clampInsightValue(payload.risk.components.emotionalTide)} with ${payload.risk.signals.hardAspectCount} hard lunar aspects in play.`,
    `Focus resonance compresses alignment and circadian drag into ${clampInsightValue(
      (payload.risk.components.focusResonance + payload.risk.components.circadianAlignment) / 2
    )}, so recovery blocks should be scheduled earlier.`,
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
    dateLabel: formatDashboardInsightDateLabel(payload.dateKey, referenceDate),
    headline: resolveBurnoutHeadline(payload.risk.severity),
    summary: resolveBurnoutSummary(payload, referenceDate),
    reasons: buildBurnoutReasons(payload),
    components: [
      { label: 'Saturn Load', value: clampInsightValue(payload.risk.components.saturnLoad), color: '#FF6B6B' },
      { label: 'Moon Load', value: clampInsightValue(payload.risk.components.moonLoad), color: '#FF8A8A' },
      {
        label: 'Mismatch',
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
    dateLabel: formatDashboardInsightDateLabel(payload.dateKey, referenceDate),
    headline: resolveLunarHeadline(payload.risk.severity),
    summary: resolveLunarSummary(payload, referenceDate),
    reasons: buildLunarReasons(payload),
    components: [
      {
        label: 'Phase Load',
        value: clampInsightValue(payload.risk.components.moonPhaseLoad),
        color: '#F5F7FF',
      },
      {
        label: 'Emotion Tide',
        value: clampInsightValue(payload.risk.components.emotionalTide),
        color: '#DCE7FF',
      },
      {
        label: 'Focus Resonance',
        value: clampInsightValue(
          (payload.risk.components.focusResonance + payload.risk.components.circadianAlignment) / 2
        ),
        color: '#C8D8FF',
      },
      {
        label: 'Recovery Buffer',
        value: clampInsightValue(payload.risk.components.recoveryBuffer),
        color: '#AFC2F3',
      },
    ],
  };
}
