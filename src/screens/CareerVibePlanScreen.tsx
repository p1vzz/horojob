import React from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, RefreshCw, Sparkles, Clock3, ShieldCheck } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CareerVibePlanResponse } from '../services/astrologyApiCore';
import { syncCareerVibePlanCache, type CareerVibePlanSourceMode } from '../services/careerVibePlanSync';
import type { AppNavigationProp } from '../types/navigation';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';
import {
  buildCareerVibeMetricRows,
  formatCareerVibePlanHeaderSubtitle,
  formatCareerVibePlanInlineError,
  normalizeCareerVibeList,
  type CareerVibeMetricRow,
} from './careerVibePlanScreenCore';

const { width, height } = Dimensions.get('window');
const CAREER_VIBE_PENDING_POLL_INTERVAL_MS = 5_000;
const CAREER_VIBE_PENDING_POLL_MAX_ATTEMPTS = 12;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-[11px] tracking-[2px] font-black uppercase mb-3" style={{ color: 'rgba(212,212,224,0.45)' }}>
      {children}
    </Text>
  );
}

function MetricRow({ row }: { row: CareerVibeMetricRow }) {
  return (
    <View
      className="rounded-[18px] px-4 py-3 mb-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View>
          <Text className="text-[14px] font-semibold" style={{ color: 'rgba(244,244,248,0.95)' }}>
            {row.label}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(212,212,224,0.46)' }}>
            {row.detail}
          </Text>
        </View>
        <Text className="text-[15px] font-black" style={{ color: row.color }}>
          {row.value}%
        </Text>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
        <View className="h-full rounded-full" style={{ width: `${row.value}%`, backgroundColor: row.color }} />
      </View>
    </View>
  );
}

function StrategyBlock({ title, body, accent }: { title: string; body: string; accent: string }) {
  return (
    <View
      className="rounded-[18px] px-4 py-4 mb-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <Text className="text-[13px] font-black mb-2" style={{ color: accent }}>
        {title}
      </Text>
      <Text className="text-[14px] leading-[21px]" style={{ color: 'rgba(232,232,240,0.84)' }}>
        {body}
      </Text>
    </View>
  );
}

function TextList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className="flex-row items-start">
          <View className="w-1.5 h-1.5 rounded-full mr-2 mt-[7px]" style={{ backgroundColor: accent }} />
          <Text className="flex-1 text-[13px] leading-[19px]" style={{ color: 'rgba(226,226,236,0.82)' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ChipList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <View className="flex-row flex-wrap">
      {items.map((item) => (
        <View
          key={item}
          className="px-3 py-1.5 rounded-[10px] mr-2 mb-2"
          style={{
            backgroundColor: `${accent}1A`,
            borderColor: `${accent}33`,
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: accent }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CareerVibePlanLoadingState() {
  const pulse = React.useRef(new Animated.Value(0)).current;
  const orbit = React.useRef(new Animated.Value(0)).current;
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    orbitLoop.start();
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      orbitLoop.stop();
      shimmerLoop.stop();
    };
  }, [orbit, pulse, shimmer]);

  const badgeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.42],
  });
  const ringRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const skeletonOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.78],
  });

  return (
    <View
      className="rounded-[24px] px-5 py-7 items-center overflow-hidden"
      style={{
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 26,
          width: 124,
          height: 124,
          borderRadius: 62,
          backgroundColor: 'rgba(201,168,76,0.18)',
          opacity: glowOpacity,
          transform: [{ scale: badgeScale }],
        }}
      />
      <View className="w-[86px] h-[86px] items-center justify-center mb-5">
        <Animated.View
          style={{
            position: 'absolute',
            width: 86,
            height: 86,
            borderRadius: 43,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.32)',
            borderTopColor: '#C9A84C',
            transform: [{ rotate: ringRotate }],
          }}
        />
        <Animated.View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(201,168,76,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.28)',
            transform: [{ scale: badgeScale }],
          }}
        >
          <Sparkles size={22} color="#C9A84C" />
        </Animated.View>
      </View>

      <Text className="text-[15px] font-black" style={{ color: 'rgba(246,246,250,0.96)' }}>
        Building today&apos;s plan
      </Text>
      <Text className="text-[13px] leading-[20px] text-center mt-2 mb-5" style={{ color: 'rgba(212,212,224,0.6)' }}>
        Reading today&apos;s work signals and shaping your next move.
      </Text>

      <View className="w-full">
        {[0, 1, 2].map((item) => (
          <Animated.View
            key={item}
            style={{
              height: item === 0 ? 12 : 10,
              width: item === 0 ? '100%' : item === 1 ? '82%' : '58%',
              borderRadius: 8,
              marginTop: item === 0 ? 0 : 10,
              backgroundColor: 'rgba(255,255,255,0.12)',
              opacity: skeletonOpacity,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export const CareerVibePlanScreen = () => {
  const navigation = useNavigation<AppNavigationProp<'CareerVibePlan'>>();
  const { theme } = useThemeMode();
  const [plan, setPlan] = React.useState<CareerVibePlanResponse | null>(null);
  const [sourceMode, setSourceMode] = React.useState<CareerVibePlanSourceMode>('empty');
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const contentReveal = React.useRef(new Animated.Value(0)).current;
  const mountedRef = React.useRef(true);
  const pendingPollCountRef = React.useRef(0);

  const loadPlan = React.useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setErrorText(null);

    try {
      const result = await syncCareerVibePlanCache({ refresh });
      if (!mountedRef.current) return;
      setSourceMode(result.snapshot.source);
      if (result.snapshot.payload) {
        setPlan(result.snapshot.payload);
        setErrorText(result.snapshot.errorText);
      } else {
        setPlan(null);
        setErrorText(result.snapshot.errorText ?? 'Career Vibe is unavailable right now.');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setErrorText(error instanceof Error ? error.message : 'Career Vibe is unavailable right now.');
    } finally {
      if (mountedRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    void loadPlan(false);
    return () => {
      mountedRef.current = false;
    };
  }, [loadPlan]);

  React.useEffect(() => {
    if (plan?.narrativeStatus !== 'pending') {
      pendingPollCountRef.current = 0;
      return;
    }
    if (isInitialLoading || isRefreshing) return;
    if (pendingPollCountRef.current >= CAREER_VIBE_PENDING_POLL_MAX_ATTEMPTS) {
      setErrorText('Career Vibe is taking longer than expected. Try again in a moment.');
      return;
    }

    const timer = setTimeout(() => {
      pendingPollCountRef.current += 1;
      void loadPlan(false);
    }, CAREER_VIBE_PENDING_POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isInitialLoading, isRefreshing, loadPlan, plan?.narrativeStatus]);

  React.useEffect(() => {
    if (!plan) {
      contentReveal.setValue(0);
      return;
    }

    Animated.timing(contentReveal, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [contentReveal, plan]);

  const metricRows = React.useMemo(() => (plan ? buildCareerVibeMetricRows(plan.metrics) : []), [plan]);
  const headerSubtitle = formatCareerVibePlanHeaderSubtitle(
    plan,
    sourceMode,
    SHOULD_EXPOSE_TECHNICAL_SURFACES,
  );
  const inlineErrorText = errorText
    ? formatCareerVibePlanInlineError(errorText, sourceMode, SHOULD_EXPOSE_TECHNICAL_SURFACES)
    : null;
  const readyPlanContent = plan?.plan ?? null;
  const narrativeUnavailableText = React.useMemo(() => {
    if (!plan || readyPlanContent) return null;
    if (errorText) return "Today's full plan could not be prepared. Your work metrics are still available below.";
    if (plan.narrativeStatus === 'pending') return "Today's full plan is still preparing. Your work metrics are ready below.";
    return "Today's full plan could not be prepared. Your work metrics are still available below.";
  }, [errorText, plan, readyPlanContent]);
  const bestFor = readyPlanContent ? normalizeCareerVibeList(readyPlanContent.bestFor, 'Focused delivery') : [];
  const avoid = readyPlanContent ? normalizeCareerVibeList(readyPlanContent.avoid, 'Starting too many parallel threads') : [];
  const drivers = plan ? normalizeCareerVibeList(plan.explanation.drivers, 'Daily transit metrics define the base work mode.') : [];
  const cautions = plan ? normalizeCareerVibeList(plan.explanation.cautions, 'Keep one review checkpoint before external sharing.') : [];
  const metricNotes = plan ? normalizeCareerVibeList(plan.explanation.metricNotes, 'Metrics describe today\'s work conditions.') : [];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient id="careerVibePlanTop" cx="24%" cy="-4%" rx="76%" ry="48%" fx="24%" fy="-4%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(201,168,76,0.24)" stopOpacity="0.24" />
              <Stop offset="62%" stopColor="rgba(201,168,76,0.05)" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="careerVibePlanBottom" cx="92%" cy="106%" rx="72%" ry="52%" fx="92%" fy="106%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(56,204,136,0.18)" stopOpacity="0.18" />
              <Stop offset="58%" stopColor="rgba(101,184,255,0.05)" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#careerVibePlanTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#careerVibePlanBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
          <View className="px-5 pt-2" style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }}>
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center flex-1 pr-3">
                <Pressable
                  onPress={() => navigation.goBack()}
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.045)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                  }}
                >
                  <ChevronLeft size={18} color="rgba(226,226,236,0.78)" />
                </Pressable>
                <View className="flex-1">
                  <Text className="text-[16px] font-black" style={{ color: 'rgba(246,246,250,0.98)' }}>
                    Career Vibe Plan
                  </Text>
                  <Text className="text-[11px] mt-1" numberOfLines={1} style={{ color: 'rgba(212,212,224,0.46)' }}>
                    {headerSubtitle}
                  </Text>
                </View>
              </View>
              {SHOULD_EXPOSE_TECHNICAL_SURFACES ? (
                <Pressable
                  onPress={() => void loadPlan(true)}
                  disabled={isRefreshing || isInitialLoading}
                  className="flex-row items-center px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.12)',
                    borderColor: 'rgba(201,168,76,0.22)',
                    borderWidth: 1,
                    opacity: isRefreshing || isInitialLoading ? 0.55 : 1,
                  }}
                >
                  <RefreshCw size={13} color="#C9A84C" />
                  <Text className="text-[12px] font-black ml-1.5" style={{ color: '#C9A84C' }}>
                    {isRefreshing ? 'Syncing' : 'Refresh'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {isInitialLoading && !plan ? <CareerVibePlanLoadingState /> : null}

            {errorText && !plan ? (
              <View
                className="rounded-[24px] px-5 py-6"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.045)',
                  borderColor: 'rgba(201,168,76,0.16)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[16px] font-black mb-2" style={{ color: 'rgba(246,246,250,0.98)' }}>
                  Career Vibe is unavailable
                </Text>
                <Text className="text-[13px] leading-[20px] mb-4" style={{ color: 'rgba(226,226,236,0.72)' }}>
                  {inlineErrorText}
                </Text>
                <Pressable
                  onPress={() => void loadPlan(false)}
                  className="self-start px-4 py-2 rounded-full"
                  style={{ backgroundColor: 'rgba(201,168,76,0.16)' }}
                >
                  <Text className="text-[13px] font-black" style={{ color: '#C9A84C' }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {plan ? (
              <Animated.View
                style={{
                  opacity: contentReveal,
                  transform: [
                    {
                      translateY: contentReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                    },
                  ],
                }}
              >
                {readyPlanContent ? (
                  <View
                    className="rounded-[26px] px-5 py-5 mb-5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.055)',
                      borderColor: 'rgba(201,168,76,0.14)',
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center mb-3">
                      <Sparkles size={16} color="#C9A84C" />
                      <Text className="text-[12px] font-black tracking-[1.6px] uppercase ml-2" style={{ color: '#C9A84C' }}>
                        {plan.modeLabel}
                      </Text>
                    </View>
                    <Text className="text-[23px] leading-[29px] font-black mb-3" style={{ color: 'rgba(248,248,252,0.98)' }}>
                      {readyPlanContent.headline}
                    </Text>
                    <Text className="text-[14px] leading-[22px]" style={{ color: 'rgba(226,226,236,0.76)' }}>
                      {readyPlanContent.summary}
                    </Text>

                    <View className="mt-5 rounded-[18px] px-4 py-4" style={{ backgroundColor: 'rgba(201,168,76,0.10)' }}>
                      <Text className="text-[11px] font-black tracking-[1.6px] uppercase mb-2" style={{ color: '#C9A84C' }}>
                        Best move
                      </Text>
                      <Text className="text-[15px] leading-[22px] font-semibold" style={{ color: 'rgba(250,250,252,0.94)' }}>
                        {readyPlanContent.primaryAction}
                      </Text>
                    </View>

                    <View className="flex-row items-center mt-4">
                      <Clock3 size={14} color="#65B8FF" />
                      <Text className="text-[13px] font-black ml-2" style={{ color: '#65B8FF' }}>
                        Peak window: {readyPlanContent.peakWindow}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    className="rounded-[26px] px-5 py-5 mb-5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.055)',
                      borderColor: 'rgba(201,168,76,0.14)',
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center mb-3">
                      <Sparkles size={16} color="#C9A84C" />
                      <Text className="text-[12px] font-black tracking-[1.6px] uppercase ml-2" style={{ color: '#C9A84C' }}>
                        {plan.modeLabel}
                      </Text>
                    </View>
                    <Text className="text-[22px] leading-[28px] font-black mb-3" style={{ color: 'rgba(248,248,252,0.98)' }}>
                      {plan.narrativeStatus === 'pending' ? 'Your plan is preparing' : 'Career Vibe is unavailable'}
                    </Text>
                    <Text className="text-[14px] leading-[22px]" style={{ color: 'rgba(226,226,236,0.76)' }}>
                      {narrativeUnavailableText}
                    </Text>
                    <Pressable
                      onPress={() => void loadPlan(true)}
                      disabled={isRefreshing}
                      className="self-start px-4 py-2 rounded-full mt-5"
                      style={{ backgroundColor: 'rgba(201,168,76,0.16)', opacity: isRefreshing ? 0.6 : 1 }}
                    >
                      <Text className="text-[13px] font-black" style={{ color: '#C9A84C' }}>
                        {isRefreshing ? 'Trying again' : 'Try Again'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {inlineErrorText ? (
                  <View
                    className="rounded-[18px] px-4 py-3 mb-5"
                    style={{
                      backgroundColor: 'rgba(201,168,76,0.10)',
                      borderColor: 'rgba(201,168,76,0.18)',
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(244,220,150,0.9)' }}>
                      {inlineErrorText}
                    </Text>
                  </View>
                ) : null}

                <SectionLabel>Metrics</SectionLabel>
                <View className="mb-4">
                  {metricRows.map((row) => (
                    <MetricRow key={row.label} row={row} />
                  ))}
                </View>

                {readyPlanContent ? (
                  <>
                    <SectionLabel>Work Modes</SectionLabel>
                    <View className="mb-4">
                      <StrategyBlock title="Focus strategy" body={readyPlanContent.focusStrategy} accent="#C9A84C" />
                      <StrategyBlock title="Communication" body={readyPlanContent.communicationStrategy} accent="#38CC88" />
                      <StrategyBlock title="AI work" body={readyPlanContent.aiWorkStrategy} accent="#65B8FF" />
                      <StrategyBlock title="Risk guardrail" body={readyPlanContent.riskGuardrail} accent="#E18272" />
                    </View>

                    <SectionLabel>Best For</SectionLabel>
                    <View className="mb-4">
                      <ChipList items={bestFor} accent="#38CC88" />
                    </View>

                    <SectionLabel>Avoid</SectionLabel>
                    <View className="mb-5">
                      <TextList items={avoid} accent="#E18272" />
                    </View>
                  </>
                ) : null}

                <SectionLabel>Why This Plan</SectionLabel>
                <View
                  className="rounded-[22px] px-4 py-4 mb-5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.045)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[13px] font-black mb-3" style={{ color: '#C9A84C' }}>
                    Drivers
                  </Text>
                  <TextList items={drivers} accent="#C9A84C" />
                  <Text className="text-[13px] font-black mt-5 mb-3" style={{ color: '#E18272' }}>
                    Cautions
                  </Text>
                  <TextList items={cautions} accent="#E18272" />
                </View>

                <SectionLabel>Metric Notes</SectionLabel>
                <View
                  className="rounded-[22px] px-4 py-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.045)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                  }}
                >
                  <TextList items={metricNotes} accent="#65B8FF" />
                  {SHOULD_EXPOSE_TECHNICAL_SURFACES ? (
                    <View className="flex-row items-center mt-5 pt-4" style={{ borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1 }}>
                      <ShieldCheck size={14} color="rgba(212,212,224,0.46)" />
                      <Text className="text-[11px] ml-2 flex-1" style={{ color: 'rgba(212,212,224,0.46)' }}>
                        {plan.schemaVersion} | {plan.model} | {plan.promptVersion} | {plan.narrativeStatus}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
