import {
  FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT,
  type DashboardInsightMetric,
  type LunarProductivitySnapshot,
} from '../services/dashboardInsightSnapshots';

export type LunarProductivityMetric = DashboardInsightMetric;
export { FROZEN_LUNAR_PRODUCTIVITY_SNAPSHOT };
export type { LunarProductivitySnapshot };

export type LunarProductivityMetricRow = LunarProductivityMetric & {
  width: `${number}%`;
};

export const LUNAR_PRODUCTIVITY_TILE_COPY = {
  badge: 'Lunar Productivity',
  fallbackHeadline: 'Could not update lunar guidance',
  fallbackSummary:
    "Today's lunar productivity guidance is temporarily unavailable. No score is shown until current data loads.",
  fallbackAction: 'Try Again',
} as const;

export function clampLunarProductivityValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function toLunarProductivityMetricRows(metrics: LunarProductivityMetric[]): LunarProductivityMetricRow[] {
  return metrics.map((metric) => {
    const value = clampLunarProductivityValue(metric.value);
    return {
      ...metric,
      value,
      width: `${value}%`,
    };
  });
}
