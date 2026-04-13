import {
  FROZEN_BURNOUT_SNAPSHOT,
  type BurnoutInsightSnapshot,
  type DashboardInsightMetric,
} from '../services/dashboardInsightSnapshots';

export type BurnoutInsightMetric = DashboardInsightMetric;
export { FROZEN_BURNOUT_SNAPSHOT };
export type { BurnoutInsightSnapshot };

export type BurnoutInsightMetricRow = BurnoutInsightMetric & {
  width: `${number}%`;
};

export const BURNOUT_INSIGHT_TILE_COPY = {
  badge: 'Burnout Radar',
  fallbackHeadline: 'Could not update burnout guidance',
  fallbackSummary:
    "Today's burnout guidance is temporarily unavailable. Try again before using this card for planning.",
  fallbackAction: 'Try Again',
} as const;

export function clampBurnoutInsightValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function toBurnoutInsightMetricRows(metrics: BurnoutInsightMetric[]): BurnoutInsightMetricRow[] {
  return metrics.map((metric) => {
    const value = clampBurnoutInsightValue(metric.value);
    return {
      ...metric,
      value,
      width: `${value}%`,
    };
  });
}
