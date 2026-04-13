import React from 'react';
import { Animated, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Orbit } from 'lucide-react-native';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  formatDashboardInsightSyncLabel,
  type DashboardInsightSourceMode,
} from '../services/dashboardInsightSnapshots';
import { DashboardInsightHydrationOverlay } from './DashboardInsightHydrationOverlay';
import {
  BURNOUT_INSIGHT_TILE_COPY,
  toBurnoutInsightMetricRows,
  type BurnoutInsightSnapshot,
} from './burnoutInsightCore';
import {
  DARK_BURNOUT_INSIGHT_PALETTE,
  LIGHT_BURNOUT_INSIGHT_PALETTE,
} from './burnoutInsightVisuals';

export function BurnoutInsightTile({
  snapshot,
  sourceMode,
  isHydrating = false,
  lastSyncedAt = null,
  highlighted = false,
  highlightKey = null,
  onRetry,
}: {
  snapshot: BurnoutInsightSnapshot;
  sourceMode: DashboardInsightSourceMode;
  isHydrating?: boolean;
  lastSyncedAt?: string | null;
  highlighted?: boolean;
  highlightKey?: number | null;
  onRetry?: (() => void) | null;
}) {
  const { isLight } = useThemeMode();
  const palette = isLight ? LIGHT_BURNOUT_INSIGHT_PALETTE : DARK_BURNOUT_INSIGHT_PALETTE;
  const metricRows = toBurnoutInsightMetricRows(snapshot.components);
  const syncLabel = formatDashboardInsightSyncLabel(lastSyncedAt);
  const isFallback = sourceMode === 'fallback';
  const canRetry = isFallback && !isHydrating && !!onRetry;
  const highlightOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!highlighted) return;
    highlightOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(highlightOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(highlightOpacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      highlightOpacity.stopAnimation();
    };
  }, [highlightOpacity, highlighted, highlightKey]);

  return (
    <View className="px-5 py-2">
      <LinearGradient
        colors={palette.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 rounded-[24px] overflow-hidden relative"
        style={{
          borderWidth: 1,
          borderColor: palette.cardBorder,
        }}
      >
        <LinearGradient
          colors={palette.cardOverlay}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: palette.cardOverlayOpacity,
          }}
        />
        <LinearGradient
          colors={palette.surfaceHazeGradient}
          start={{ x: 0, y: 0.15 }}
          end={{ x: 1, y: 0.85 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: palette.surfaceHazeOpacity,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: palette.focusRing,
            opacity: highlightOpacity,
          }}
        />

        <View className="flex-row items-center mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: palette.badgeBg,
              borderColor: palette.badgeBorder,
              borderWidth: 1,
            }}
          >
            <AlertTriangle size={13} color={palette.badgeIcon} style={{ marginRight: 6 }} />
            <Text className="text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ color: palette.badgeText }}>
              {BURNOUT_INSIGHT_TILE_COPY.badge}
            </Text>
          </View>
          <View className="ml-auto items-end">
            {isHydrating ? (
              <View
                className="px-2 py-1 rounded-full mb-1"
                style={{
                  backgroundColor: palette.syncBg,
                  borderColor: palette.syncBorder,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[9px] font-semibold tracking-[1.2px]" style={{ color: palette.syncText }}>
                  SYNCING
                </Text>
              </View>
            ) : null}
            <Text className="text-[10px]" style={{ color: palette.dateText }}>
              {snapshot.dateLabel}
            </Text>
            {syncLabel ? (
              <Text className="text-[9px] mt-0.5" style={{ color: palette.dateText }}>
                {syncLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {isFallback ? (
          <View className="py-3">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={17} color={palette.headlineIcon} style={{ marginRight: 7 }} />
              <Text className="text-[16px] font-semibold tracking-tight flex-1" style={{ color: palette.headline }}>
                {BURNOUT_INSIGHT_TILE_COPY.fallbackHeadline}
              </Text>
            </View>
            <Text className="text-[13px] leading-[21px] mb-4" style={{ color: palette.summary }}>
              {BURNOUT_INSIGHT_TILE_COPY.fallbackSummary}
            </Text>
            {canRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry ?? undefined}
                className="self-start px-3 py-2 rounded-full"
                style={{
                  backgroundColor: palette.retryBg,
                  borderColor: palette.retryBorder,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[11px] font-semibold tracking-[0.7px]" style={{ color: palette.retryText }}>
                  {BURNOUT_INSIGHT_TILE_COPY.fallbackAction}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View className="mb-4">
              <View className="flex-row items-end mb-1.5">
                <Text className="text-[42px] font-bold leading-[44px]" style={{ color: palette.score }}>
                  {snapshot.score}
                </Text>
                <Text className="text-[20px] font-bold ml-1 mb-[3px]" style={{ color: palette.scorePercent }}>
                  %
                </Text>
                <Text className="text-[13px] ml-2.5 mb-[7px] font-semibold uppercase tracking-[1px]" style={{ color: palette.severity }}>
                  {snapshot.severityLabel}
                </Text>
              </View>

              <Text className="text-[11px] leading-[16px] mb-3" style={{ color: palette.pressureHint }}>
                {snapshot.pressureHint}
              </Text>

              <View className="flex-row items-center mb-2">
                <AlertTriangle size={16} color={palette.headlineIcon} style={{ marginRight: 6 }} />
                <Text className="text-[16px] font-semibold tracking-tight" style={{ color: palette.headline }}>
                  {snapshot.headline}
                </Text>
              </View>

              <Text className="text-[13px] leading-[21px] mb-3" style={{ color: palette.summary }}>
                {snapshot.summary}
              </Text>
            </View>

            <View className="mb-4">
              {snapshot.reasons.map((reason, index) => (
                <View key={index} className="flex-row mb-2 items-start">
                  <Orbit size={12} color={palette.reasonIcon} style={{ marginTop: 2, marginRight: 7 }} />
                  <Text className="text-[12px] leading-[18px] flex-1" style={{ color: palette.reasonText }}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap gap-y-2">
              {metricRows.map((item) => (
                <View key={item.label} className="w-1/2 pr-2">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-[10px] uppercase tracking-[1px] font-semibold" style={{ color: palette.metricLabel }}>
                      {item.label}
                    </Text>
                    <Text className="text-[10px] font-bold" style={{ color: item.color }}>
                      {item.value}
                    </Text>
                  </View>
                  <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: palette.metricTrack }}>
                    <View className="h-full rounded-full" style={{ width: item.width, backgroundColor: item.color }} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {isHydrating ? (
          <DashboardInsightHydrationOverlay
            veilColor={palette.hydrationVeil}
            shimmerColors={palette.hydrationShimmer}
          />
        ) : null}
      </LinearGradient>
    </View>
  );
}
