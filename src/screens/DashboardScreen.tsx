import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { DashboardHeader } from '../components/DashboardHeader';
import { BurnoutInsightTile } from '../components/BurnoutInsightTile';
import { LunarProductivityInsightTile } from '../components/LunarProductivityInsightTile';
import { DailyAstroStatus } from '../components/DailyAstroStatus';
import { JobCheckTile } from '../components/JobCheckTile';
import { CareerMatchmakerTile } from '../components/CareerMatchmakerTile';
import { AiSynergyTile } from '../components/AiSynergyTile';
import { InterviewStrategy } from '../components/InterviewStrategy';
import { DeepDiveTile } from '../components/DeepDiveTile';
import { useDashboardInsights } from '../hooks/useDashboardInsights';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { DASHBOARD_BACKGROUND_GRADIENTS } from './dashboardScreenVisuals';

const { width, height } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { theme } = useThemeMode();
  const { burnout, lunar, refreshBurnout, refreshLunar } = useDashboardInsights();

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient
              id={DASHBOARD_BACKGROUND_GRADIENTS.top.id}
              cx={DASHBOARD_BACKGROUND_GRADIENTS.top.cx}
              cy={DASHBOARD_BACKGROUND_GRADIENTS.top.cy}
              rx={DASHBOARD_BACKGROUND_GRADIENTS.top.rx}
              ry={DASHBOARD_BACKGROUND_GRADIENTS.top.ry}
              fx={DASHBOARD_BACKGROUND_GRADIENTS.top.fx}
              fy={DASHBOARD_BACKGROUND_GRADIENTS.top.fy}
              gradientUnits="userSpaceOnUse"
            >
              {DASHBOARD_BACKGROUND_GRADIENTS.top.stops.map((stop) => (
                <Stop
                  key={`${DASHBOARD_BACKGROUND_GRADIENTS.top.id}-${stop.offset}`}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </RadialGradient>
            <RadialGradient
              id={DASHBOARD_BACKGROUND_GRADIENTS.bottom.id}
              cx={DASHBOARD_BACKGROUND_GRADIENTS.bottom.cx}
              cy={DASHBOARD_BACKGROUND_GRADIENTS.bottom.cy}
              rx={DASHBOARD_BACKGROUND_GRADIENTS.bottom.rx}
              ry={DASHBOARD_BACKGROUND_GRADIENTS.bottom.ry}
              fx={DASHBOARD_BACKGROUND_GRADIENTS.bottom.fx}
              fy={DASHBOARD_BACKGROUND_GRADIENTS.bottom.fy}
              gradientUnits="userSpaceOnUse"
            >
              {DASHBOARD_BACKGROUND_GRADIENTS.bottom.stops.map((stop) => (
                <Stop
                  key={`${DASHBOARD_BACKGROUND_GRADIENTS.bottom.id}-${stop.offset}`}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill={`url(#${DASHBOARD_BACKGROUND_GRADIENTS.top.id})`} />
          <Rect x="0" y="0" width={width} height={height} fill={`url(#${DASHBOARD_BACKGROUND_GRADIENTS.bottom.id})`} />
        </Svg>
      </View>

      <SafeAreaView className="flex-1" style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} className="flex-1">
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }}>
            <DashboardHeader />
            <BurnoutInsightTile
              snapshot={burnout.snapshot}
              sourceMode={burnout.source}
              isHydrating={burnout.isHydrating}
              lastSyncedAt={burnout.lastSyncedAt}
              onRetry={refreshBurnout}
            />
            <LunarProductivityInsightTile
              snapshot={lunar.snapshot}
              sourceMode={lunar.source}
              isHydrating={lunar.isHydrating}
              lastSyncedAt={lunar.lastSyncedAt}
              onRetry={refreshLunar}
            />
            <DailyAstroStatus />
            <JobCheckTile />
            <CareerMatchmakerTile />
            <AiSynergyTile />
            <InterviewStrategy />
            <DeepDiveTile />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
