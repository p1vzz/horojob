import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ApiError } from '../services/authSession';
import {
  fetchJobAlerts,
  fetchJobMetrics,
  type JobMetricsAlertsReport,
  type JobMetricsReport,
} from '../services/jobsApi';

function formatPct(value: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `${value.toFixed(1)}%`;
}

export const JobParserQualityCard = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<JobMetricsReport | null>(null);
  const [alerts, setAlerts] = React.useState<JobMetricsAlertsReport | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  const load = React.useCallback(async (isManualRefresh: boolean) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);
    try {
      const [metricsPayload, alertsPayload] = await Promise.all([fetchJobMetrics(24), fetchJobAlerts(24)]);
      setMetrics(metricsPayload);
      setAlerts(alertsPayload);
      setUpdatedAt(new Date());
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`Failed to load parser metrics (${error.status}).`);
      } else {
        setErrorMessage('Failed to load parser metrics.');
      }
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const topSources = React.useMemo(() => {
    if (!metrics) return [];
    return [...metrics.sources]
      .sort((a, b) => b.rawFetches + b.negativeEvents - (a.rawFetches + a.negativeEvents))
      .slice(0, 3);
  }, [metrics]);

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between px-1 mb-2.5">
        <Text className="text-[11px] tracking-[2.4px] font-semibold" style={{ color: 'rgba(212,212,224,0.36)' }}>
          DEV PARSER QUALITY
        </Text>
        <Pressable
          onPress={() => {
            if (!isRefreshing) {
              void load(true);
            }
          }}
          className="px-2.5 py-1 rounded-full border"
          style={{
            borderColor: 'rgba(201,168,76,0.35)',
            backgroundColor: 'rgba(201,168,76,0.12)',
          }}
        >
          <Text className="text-[10px] font-semibold" style={{ color: '#C9A84C' }}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </Pressable>
      </View>

      <View
        className="rounded-[18px] px-4 py-3.5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        {isLoading ? (
          <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
            Loading parser metrics...
          </Text>
        ) : errorMessage ? (
          <Text className="text-[12px]" style={{ color: 'rgba(255,135,167,0.95)' }}>
            {errorMessage}
          </Text>
        ) : metrics && alerts ? (
          <>
            <View className="flex-row flex-wrap">
              <View className="w-1/3 pr-2 mb-2">
                <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.42)' }}>
                  RAW
                </Text>
                <Text className="text-[14px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
                  {metrics.totals.rawFetches}
                </Text>
              </View>
              <View className="w-1/3 pr-2 mb-2">
                <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.42)' }}>
                  NEGATIVE
                </Text>
                <Text className="text-[14px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
                  {metrics.totals.negativeEvents}
                </Text>
              </View>
              <View className="w-1/3 mb-2">
                <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.42)' }}>
                  ALERTS
                </Text>
                <Text className="text-[14px] font-semibold" style={{ color: alerts.hasAlerts ? '#FF9FB4' : '#7CE1A8' }}>
                  {alerts.alerts.length}
                </Text>
              </View>
            </View>

            {topSources.length > 0 ? (
              <View
                className="mt-1 pt-2"
                style={{
                  borderTopColor: 'rgba(255,255,255,0.06)',
                  borderTopWidth: 1,
                }}
              >
                {topSources.map((source) => (
                  <View key={source.source} className="flex-row items-center justify-between py-1.5">
                    <Text className="text-[12px] capitalize" style={{ color: 'rgba(233,233,242,0.86)' }}>
                      {source.source}
                    </Text>
                    <Text className="text-[11px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
                      success {formatPct(source.successRatePct)} | browser {formatPct(source.browserFallbackRatePct)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {alerts.hasAlerts ? (
              <View
                className="mt-1 pt-2"
                style={{
                  borderTopColor: 'rgba(255,255,255,0.06)',
                  borderTopWidth: 1,
                }}
              >
                {alerts.alerts.slice(0, 2).map((alert) => (
                  <Text
                    key={alert.id}
                    className="text-[11px] mt-1"
                    style={{ color: alert.severity === 'critical' ? '#FF9FB4' : '#FFD48B' }}
                  >
                    {alert.source}: {alert.message}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text className="text-[10px] mt-2" style={{ color: 'rgba(212,212,224,0.35)' }}>
              {updatedAt ? `Updated: ${updatedAt.toLocaleTimeString()}` : 'Updated: n/a'}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
};
