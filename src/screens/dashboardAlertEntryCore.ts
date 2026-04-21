import type { DashboardAlertFocus } from '../types/navigation';
import type { AnalyticsProperties } from '../services/analyticsCore';

export const DASHBOARD_ALERT_OPENED_FROM_PUSH_EVENT = 'dashboard_alert_opened_from_push';
export const DASHBOARD_ALERT_PUSH_TARGET_FOCUSED_EVENT = 'dashboard_alert_push_target_focused';
export const DASHBOARD_ALERT_PUSH_TARGET_HIDDEN_EVENT = 'dashboard_alert_push_target_hidden';

export function resolveDashboardAlertFocus(notificationType: unknown): DashboardAlertFocus | null {
  if (notificationType === 'burnout_alert') return 'burnout';
  if (notificationType === 'lunar_productivity_alert') return 'lunar';
  return null;
}

export function resolveDashboardAlertScrollY(layoutY: number | null | undefined, topInset = 16) {
  if (!Number.isFinite(layoutY)) return null;
  return Math.max(0, Math.round((layoutY ?? 0) - topInset));
}

export function normalizeDashboardAlertNotificationType(notificationType: unknown) {
  return typeof notificationType === 'string' && notificationType.trim().length > 0
    ? notificationType
    : null;
}

export function buildDashboardAlertPushAnalyticsProperties(input: {
  focus: DashboardAlertFocus;
  alertFocusKey?: number | null;
  notificationType?: unknown;
  outcome?: 'opened' | 'focused' | 'hidden';
  reason?: string | null;
}): AnalyticsProperties {
  return {
    source: 'push',
    alertFocus: input.focus,
    alertFocusKey: Number.isFinite(input.alertFocusKey) ? input.alertFocusKey ?? null : null,
    notificationType: normalizeDashboardAlertNotificationType(input.notificationType),
    outcome: input.outcome ?? null,
    reason: input.reason ?? null,
  };
}
