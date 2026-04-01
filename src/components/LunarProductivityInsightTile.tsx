import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoonStar, Sparkles, Orbit } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeModeProvider';
import {
  formatDashboardInsightSourceLabel,
  formatDashboardInsightSyncLabel,
  type DashboardInsightSourceMode,
} from '../services/dashboardInsightSnapshots';
import { DashboardInsightHydrationOverlay } from './DashboardInsightHydrationOverlay';
import {
  LUNAR_PRODUCTIVITY_TILE_COPY,
  toLunarProductivityMetricRows,
  type LunarProductivitySnapshot,
} from './lunarProductivityInsightCore';
import {
  LUNAR_PRODUCTIVITY_VISUALS,
  resolveLunarProductivityInsightSourcePalette,
} from './lunarProductivityInsightVisuals';

export function LunarProductivityInsightTile({
  snapshot,
  sourceMode,
  isHydrating = false,
  lastSyncedAt = null,
  onRetry,
}: {
  snapshot: LunarProductivitySnapshot;
  sourceMode: DashboardInsightSourceMode;
  isHydrating?: boolean;
  lastSyncedAt?: string | null;
  onRetry?: (() => void) | null;
}) {
  const theme = useAppTheme();
  const metricRows = toLunarProductivityMetricRows(snapshot.components);
  const sourcePalette = resolveLunarProductivityInsightSourcePalette(sourceMode);
  const sourceLabel = formatDashboardInsightSourceLabel(sourceMode);
  const syncLabel = formatDashboardInsightSyncLabel(lastSyncedAt);
  const canRetry = sourceMode === 'fallback' && !isHydrating && !!onRetry;

  return (
    <View className="px-5 py-2">
      <LinearGradient
        colors={LUNAR_PRODUCTIVITY_VISUALS.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 rounded-[24px] overflow-hidden relative"
        style={{
          borderWidth: 1,
          borderColor: LUNAR_PRODUCTIVITY_VISUALS.cardBorder,
        }}
      >
        <LinearGradient
          colors={LUNAR_PRODUCTIVITY_VISUALS.cardOverlay}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: LUNAR_PRODUCTIVITY_VISUALS.cardOverlayOpacity,
          }}
        />

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: LUNAR_PRODUCTIVITY_VISUALS.orbOffsetRight,
            top: LUNAR_PRODUCTIVITY_VISUALS.orbOffsetTop,
            width: LUNAR_PRODUCTIVITY_VISUALS.orbSize,
            height: LUNAR_PRODUCTIVITY_VISUALS.orbSize,
          }}
        >
          <LinearGradient
            colors={LUNAR_PRODUCTIVITY_VISUALS.orbGradient}
            style={{
              width: LUNAR_PRODUCTIVITY_VISUALS.orbSize,
              height: LUNAR_PRODUCTIVITY_VISUALS.orbSize,
              borderRadius: 999,
              opacity: LUNAR_PRODUCTIVITY_VISUALS.orbOpacity,
            }}
          />
        </View>

        <View className="flex-row items-center mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: LUNAR_PRODUCTIVITY_VISUALS.badgeBg,
              borderColor: LUNAR_PRODUCTIVITY_VISUALS.badgeBorder,
              borderWidth: 1,
            }}
          >
            <MoonStar size={13} color={theme.colors.lunarWhite} style={{ marginRight: 6 }} />
            <Text
              className="text-[11px] font-semibold tracking-[1.5px] uppercase"
              style={{ color: LUNAR_PRODUCTIVITY_VISUALS.badgeText }}
            >
              {LUNAR_PRODUCTIVITY_TILE_COPY.badge}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full ml-2"
            style={{
              backgroundColor: sourcePalette.backgroundColor,
              borderColor: sourcePalette.borderColor,
              borderWidth: 1,
            }}
          >
            <Text className="text-[9px] font-semibold tracking-[1.2px]" style={{ color: sourcePalette.textColor }}>
              {sourceLabel}
            </Text>
          </View>
          <View className="ml-auto items-end">
            {isHydrating ? (
              <View
                className="px-2 py-1 rounded-full mb-1"
                style={{
                  backgroundColor: LUNAR_PRODUCTIVITY_VISUALS.syncBg,
                  borderColor: LUNAR_PRODUCTIVITY_VISUALS.syncBorder,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[9px] font-semibold tracking-[1.2px]" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.syncText }}>
                  SYNCING
                </Text>
              </View>
            ) : canRetry ? (
              <Pressable
                onPress={onRetry ?? undefined}
                className="px-2 py-1 rounded-full mb-1"
                style={{
                  backgroundColor: LUNAR_PRODUCTIVITY_VISUALS.retryBg,
                  borderColor: LUNAR_PRODUCTIVITY_VISUALS.retryBorder,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[9px] font-semibold tracking-[1.2px]" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.retryText }}>
                  RETRY LIVE
                </Text>
              </Pressable>
            ) : null}
            <Text className="text-[10px]" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.dateText }}>
              {snapshot.dateLabel}
            </Text>
            {syncLabel ? (
              <Text className="text-[9px] mt-0.5" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.dateText }}>
                {syncLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-end mb-1.5">
            <Text className="text-[42px] font-bold leading-[44px]" style={{ color: theme.colors.lunarWhite }}>
              {snapshot.score}
            </Text>
            <Text className="text-[20px] font-bold ml-1 mb-[3px]" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.scorePercent }}>
              %
            </Text>
            <Text
              className="text-[13px] ml-2.5 mb-[7px] font-semibold uppercase tracking-[1px]"
              style={{ color: LUNAR_PRODUCTIVITY_VISUALS.severity }}
            >
              {snapshot.severityLabel}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color={LUNAR_PRODUCTIVITY_VISUALS.headlineIcon} style={{ marginRight: 6 }} />
            <Text className="text-[16px] font-semibold tracking-tight" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.headline }}>
              {snapshot.headline}
            </Text>
          </View>

          <Text className="text-[13px] leading-[21px] mb-3" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.summary }}>
            {snapshot.summary}
          </Text>

          <View
            className="px-2.5 py-1 rounded-md self-start"
            style={{
              backgroundColor: LUNAR_PRODUCTIVITY_VISUALS.algorithmBg,
              borderColor: LUNAR_PRODUCTIVITY_VISUALS.algorithmBorder,
              borderWidth: 1,
            }}
          >
            <Text className="text-[11px] font-semibold tracking-[0.5px]" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.algorithmText }}>
              {snapshot.algorithmVersion}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          {snapshot.reasons.map((reason, index) => (
            <View key={index} className="flex-row mb-2 items-start">
              <Orbit size={12} color={LUNAR_PRODUCTIVITY_VISUALS.reasonIcon} style={{ marginTop: 2, marginRight: 7 }} />
              <Text className="text-[12px] leading-[18px] flex-1" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.reasonText }}>
                {reason}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-y-2">
          {metricRows.map((item) => (
            <View key={item.label} className="w-1/2 pr-2">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-[10px] uppercase tracking-[1px] font-semibold" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.metricLabel }}>
                  {item.label}
                </Text>
                <Text className="text-[10px] font-bold" style={{ color: item.color }}>
                  {item.value}
                </Text>
              </View>
              <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: LUNAR_PRODUCTIVITY_VISUALS.metricTrack }}>
                <View className="h-full rounded-full" style={{ width: item.width, backgroundColor: item.color }} />
              </View>
            </View>
          ))}
        </View>

        <Text className="text-[10px] mt-4" style={{ color: LUNAR_PRODUCTIVITY_VISUALS.footnote }}>
          {LUNAR_PRODUCTIVITY_TILE_COPY.footnote}
        </Text>

        {isHydrating ? (
          <DashboardInsightHydrationOverlay
            veilColor={LUNAR_PRODUCTIVITY_VISUALS.hydrationVeil}
            shimmerColors={LUNAR_PRODUCTIVITY_VISUALS.hydrationShimmer}
          />
        ) : null}
      </LinearGradient>
    </View>
  );
}
