import React from 'react';
import { View, ScrollView, Dimensions, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardReadyGate } from '../components/DashboardReadyGate';
import { BurnoutInsightTile } from '../components/BurnoutInsightTile';
import { LunarProductivityInsightTile } from '../components/LunarProductivityInsightTile';
import { DailyAstroStatus } from '../components/DailyAstroStatus';
import { JobCheckTile } from '../components/JobCheckTile';
import { CareerMatchmakerTile } from '../components/CareerMatchmakerTile';
import { AiSynergyTile } from '../components/AiSynergyTile';
import { InterviewStrategy } from '../components/InterviewStrategy';
import { DeepDiveTile } from '../components/DeepDiveTile';
import { useDashboardInsights } from '../hooks/useDashboardInsights';
import { useDashboardPrerequisites } from '../hooks/useDashboardPrerequisites';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptOpacity } from '../utils/brightnessAdaptation';
import { DASHBOARD_BACKGROUND_GRADIENTS } from './dashboardScreenVisuals';
import {
  buildDashboardAlertPushAnalyticsProperties,
  DASHBOARD_ALERT_PUSH_TARGET_FOCUSED_EVENT,
  DASHBOARD_ALERT_PUSH_TARGET_HIDDEN_EVENT,
  resolveDashboardAlertScrollY,
} from './dashboardAlertEntryCore';
import { trackAnalyticsEvent } from '../services/analytics';
import type { AppScreenProps, DashboardAlertFocus } from '../types/navigation';

const { width, height } = Dimensions.get('window');
type AlertCardOffsets = Record<DashboardAlertFocus, number | null>;
type DashboardScreenProps = AppScreenProps<'Dashboard'> | AppScreenProps<'Profile'>;

export const DashboardScreen = ({ route }: DashboardScreenProps) => {
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();
  const routeAlertFocus = route.name === 'Dashboard' ? route.params?.alertFocus ?? null : null;
  const routeAlertFocusKey = route.name === 'Dashboard' ? route.params?.alertFocusKey ?? 0 : 0;
  const routeOpenedFromPush = route.name === 'Dashboard' ? route.params?.openedFromPush === true : false;
  const routeNotificationType = route.name === 'Dashboard' ? route.params?.notificationType ?? null : null;
  const {
    burnout,
    lunar,
    refreshBurnout,
    refreshLunar,
    isInitialReady,
    burnoutVisible,
    lunarVisible,
  } = useDashboardInsights({
    showBurnoutUnavailableOnError: routeAlertFocus === 'burnout',
    showLunarUnavailableOnError: routeAlertFocus === 'lunar',
  });
  const dashboardPrerequisites = useDashboardPrerequisites();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const pendingAlertFocusRef = React.useRef<{
    focus: DashboardAlertFocus;
    key: number;
    openedFromPush: boolean;
    notificationType: string | null;
  } | null>(null);
  const focusClearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [alertCardOffsets, setAlertCardOffsets] = React.useState<AlertCardOffsets>({
    burnout: null,
    lunar: null,
  });
  const [activeAlertFocus, setActiveAlertFocus] = React.useState<DashboardAlertFocus | null>(null);
  const [activeAlertFocusKey, setActiveAlertFocusKey] = React.useState<number | null>(null);
  const recordAlertCardOffset = React.useCallback((focus: DashboardAlertFocus, y: number) => {
    setAlertCardOffsets((current) => (current[focus] === y ? current : { ...current, [focus]: y }));
  }, []);
  const handleBurnoutLayout = React.useCallback((event: LayoutChangeEvent) => {
    recordAlertCardOffset('burnout', event.nativeEvent.layout.y);
  }, [recordAlertCardOffset]);
  const handleLunarLayout = React.useCallback((event: LayoutChangeEvent) => {
    recordAlertCardOffset('lunar', event.nativeEvent.layout.y);
  }, [recordAlertCardOffset]);
  const isDashboardReady = isInitialReady && !dashboardPrerequisites.shouldShowDashboardGate;

  React.useEffect(() => {
    if (!routeAlertFocus) return;
    pendingAlertFocusRef.current = {
      focus: routeAlertFocus,
      key: routeAlertFocusKey,
      openedFromPush: routeOpenedFromPush,
      notificationType: routeNotificationType,
    };
  }, [routeAlertFocus, routeAlertFocusKey, routeNotificationType, routeOpenedFromPush]);

  React.useEffect(() => {
    if (!isDashboardReady || !pendingAlertFocusRef.current) return;

    const pending = pendingAlertFocusRef.current;
    if (pending.focus === 'burnout' && !burnoutVisible) {
      if (pending.openedFromPush) {
        trackAnalyticsEvent(
          DASHBOARD_ALERT_PUSH_TARGET_HIDDEN_EVENT,
          buildDashboardAlertPushAnalyticsProperties({
            focus: pending.focus,
            alertFocusKey: pending.key,
            notificationType: pending.notificationType,
            outcome: 'hidden',
            reason: 'threshold_not_confirmed',
          })
        );
      }
      pendingAlertFocusRef.current = null;
      return;
    }

    if (pending.focus === 'lunar' && !lunarVisible) {
      if (pending.openedFromPush) {
        trackAnalyticsEvent(
          DASHBOARD_ALERT_PUSH_TARGET_HIDDEN_EVENT,
          buildDashboardAlertPushAnalyticsProperties({
            focus: pending.focus,
            alertFocusKey: pending.key,
            notificationType: pending.notificationType,
            outcome: 'hidden',
            reason: 'threshold_not_confirmed',
          })
        );
      }
      pendingAlertFocusRef.current = null;
      return;
    }

    const scrollY = resolveDashboardAlertScrollY(alertCardOffsets[pending.focus]);
    if (scrollY === null) return;

    pendingAlertFocusRef.current = null;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      setActiveAlertFocus(pending.focus);
      setActiveAlertFocusKey(pending.key);
      if (pending.openedFromPush) {
        trackAnalyticsEvent(
          DASHBOARD_ALERT_PUSH_TARGET_FOCUSED_EVENT,
          buildDashboardAlertPushAnalyticsProperties({
            focus: pending.focus,
            alertFocusKey: pending.key,
            notificationType: pending.notificationType,
            outcome: 'focused',
          })
        );
      }

      if (focusClearTimerRef.current) {
        clearTimeout(focusClearTimerRef.current);
      }
      focusClearTimerRef.current = setTimeout(() => {
        setActiveAlertFocus((current) => (current === pending.focus ? null : current));
        setActiveAlertFocusKey(null);
      }, 2200);
    });
  }, [alertCardOffsets, burnoutVisible, isDashboardReady, lunarVisible]);

  React.useEffect(() => () => {
    if (focusClearTimerRef.current) {
      clearTimeout(focusClearTimerRef.current);
    }
  }, []);

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
                  stopOpacity={adaptOpacity(
                    Number.parseFloat(stop.opacity),
                    channels.glowOpacityMultiplier
                  ).toString()}
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
                  stopOpacity={adaptOpacity(
                    Number.parseFloat(stop.opacity),
                    channels.glowOpacityMultiplier
                  ).toString()}
                />
              ))}
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill={`url(#${DASHBOARD_BACKGROUND_GRADIENTS.top.id})`} />
          <Rect x="0" y="0" width={width} height={height} fill={`url(#${DASHBOARD_BACKGROUND_GRADIENTS.bottom.id})`} />
        </Svg>
      </View>

      <SafeAreaView className="flex-1" style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          pointerEvents={isDashboardReady ? 'auto' : 'none'}
          style={{ opacity: isDashboardReady ? 1 : 0 }}
        >
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }}>
            <DashboardHeader />
            {burnoutVisible ? (
              <View onLayout={handleBurnoutLayout}>
                <BurnoutInsightTile
                  snapshot={burnout.snapshot}
                  sourceMode={burnout.source}
                  isHydrating={burnout.isHydrating}
                  lastSyncedAt={burnout.lastSyncedAt}
                  highlighted={activeAlertFocus === 'burnout'}
                  highlightKey={activeAlertFocusKey}
                  onRetry={refreshBurnout}
                />
              </View>
            ) : null}
            {lunarVisible ? (
              <View onLayout={handleLunarLayout}>
                <LunarProductivityInsightTile
                  snapshot={lunar.snapshot}
                  sourceMode={lunar.source}
                  isHydrating={lunar.isHydrating}
                  lastSyncedAt={lunar.lastSyncedAt}
                  highlighted={activeAlertFocus === 'lunar'}
                  highlightKey={activeAlertFocusKey}
                  onRetry={refreshLunar}
                />
              </View>
            ) : null}
            <DailyAstroStatus careerPrerequisites={dashboardPrerequisites} />
            <JobCheckTile careerPrerequisites={dashboardPrerequisites} />
            <CareerMatchmakerTile careerPrerequisites={dashboardPrerequisites} />
            <AiSynergyTile />
            <InterviewStrategy careerPrerequisites={dashboardPrerequisites} />
            <DeepDiveTile careerPrerequisites={dashboardPrerequisites} />
          </View>
        </ScrollView>
        {isDashboardReady ? null : <DashboardReadyGate />}
      </SafeAreaView>
    </View>
  );
};
