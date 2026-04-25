import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Pressable, type TextProps } from 'react-native';
import { ChevronRight, Flame, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Rect, RadialGradient, vec, Blur, Group } from '@shopify/react-native-skia';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect as SvgRect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { CareerVibePlanResponse } from '../services/astrologyApiCore';
import {
  getCachedCareerVibePlanForCurrentUser,
  syncCareerVibePlanCache,
  type CareerVibePlanSourceMode,
} from '../services/careerVibePlanSync';
import type { AppNavigationProp } from '../types/navigation';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../utils/brightnessAdaptation';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';
import type { DashboardCareerFeaturePrerequisites } from '../hooks/useDashboardPrerequisites';

const CAREER_VIBE_PENDING_POLL_INTERVAL_MS = 5_000;
const CAREER_VIBE_PENDING_POLL_MAX_ATTEMPTS = 12;
const CAREER_VIBE_SUMMARY_LINE_HEIGHT = 22;
const CAREER_VIBE_SUMMARY_MAX_LINES = 5;
const CAREER_VIBE_SUMMARY_MAX_HEIGHT = CAREER_VIBE_SUMMARY_LINE_HEIGHT * CAREER_VIBE_SUMMARY_MAX_LINES;

const estimateSummaryTextHeight = (text: string) => {
  if (!text.trim()) return CAREER_VIBE_SUMMARY_LINE_HEIGHT;
  const estimatedLineCount = Math.ceil(text.length / 48);
  return Math.min(CAREER_VIBE_SUMMARY_MAX_LINES, Math.max(1, estimatedLineCount)) * CAREER_VIBE_SUMMARY_LINE_HEIGHT;
};

const SkeletonBar = ({
  width,
  height,
  color,
}: {
  width: number | `${number}%`;
  height: number;
  color: string;
}) => (
  <View
    style={{
      width,
      height,
      borderRadius: 6,
      backgroundColor: color,
    }}
  />
);

export const DailyAstroStatus = ({
  onReady,
  careerPrerequisites,
}: {
  onReady?: () => void;
  careerPrerequisites?: DashboardCareerFeaturePrerequisites;
}) => {
  const theme = useAppTheme();
  const navigation = useNavigation<AppNavigationProp<'Dashboard'>>();
  const { channels } = useBrightnessAdaptation();
  const [careerPlan, setCareerPlan] = useState<CareerVibePlanResponse | null>(null);
  const [sourceMode, setSourceMode] = useState<CareerVibePlanSourceMode>('empty');
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [measuredSummary, setMeasuredSummary] = useState<{ text: string; height: number } | null>(null);
  const mountedRef = React.useRef(true);
  const hasSignaledReadyRef = React.useRef(false);
  const pendingPollCountRef = React.useRef(0);
  const displayPlan = careerPlan;
  const isPlanNarrativeReady = Boolean(displayPlan?.plan && displayPlan.narrativeStatus === 'ready');
  const isCareerPlanBlocked = careerPrerequisites?.isReadyForCareerFeatures === false;
  const statusLabel = React.useMemo(() => {
    if (SHOULD_EXPOSE_TECHNICAL_SURFACES) {
      return isLoading
        ? 'Syncing...'
        : sourceMode === 'cache'
          ? 'Saved'
          : errorText || !isPlanNarrativeReady
            ? displayPlan?.narrativeStatus ?? 'Unavailable'
            : displayPlan?.cached
              ? 'Cached'
              : 'Today';
    }
    if (isLoading) return 'Updating';
    if (errorText) return 'Unavailable';
    if (displayPlan?.narrativeStatus === 'pending') return 'Preparing';
    if (!isPlanNarrativeReady) return 'Unavailable';
    return 'Today';
  }, [displayPlan?.cached, displayPlan?.narrativeStatus, errorText, isLoading, isPlanNarrativeReady, sourceMode]);
  const displayErrorText = React.useMemo(() => {
    if (!errorText && isPlanNarrativeReady) return null;
    if (SHOULD_EXPOSE_TECHNICAL_SURFACES) return errorText ?? `Narrative status: ${displayPlan?.narrativeStatus ?? 'missing'}`;
    if (sourceMode === 'cache') return "Showing your saved plan while today's update is unavailable.";
    if (errorText) return "Today's Career Vibe could not prepare the full plan yet. Try again when the connection is stable.";
    if (displayPlan?.narrativeStatus === 'pending') return "Today's plan is still preparing. The metrics are ready.";
    return "Today's Career Vibe could not prepare the full plan yet. Try again when the connection is stable.";
  }, [displayPlan?.narrativeStatus, errorText, isPlanNarrativeReady, sourceMode]);
  const summaryText = displayPlan?.plan?.summary ?? displayErrorText ?? '';
  const measuredSummaryHeight = measuredSummary?.text === summaryText ? measuredSummary.height : null;
  const isSummaryMeasurementPending = isPlanNarrativeReady && summaryText.length > 0 && measuredSummaryHeight === null;
  const shouldShowSkeleton =
    (!isCareerPlanBlocked &&
      !errorText &&
      !isPlanNarrativeReady &&
      (isLoading || !displayPlan || displayPlan.narrativeStatus === 'pending')) ||
    isSummaryMeasurementPending;
  const summaryContainerHeight = measuredSummaryHeight ?? CAREER_VIBE_SUMMARY_MAX_HEIGHT;
  const handleSummaryTextLayout = React.useCallback<NonNullable<TextProps['onTextLayout']>>((event) => {
    if (!summaryText) return;
    const lineCount = Math.min(
      CAREER_VIBE_SUMMARY_MAX_LINES,
      Math.max(1, event.nativeEvent.lines.length || 1),
    );
    const height = lineCount * CAREER_VIBE_SUMMARY_LINE_HEIGHT;
    setMeasuredSummary((current) => {
      if (current?.text === summaryText && current.height === height) return current;
      return { text: summaryText, height };
    });
  }, [summaryText]);
  const canPressPlanAction =
    !shouldShowSkeleton &&
    careerPrerequisites?.reason !== 'checking' &&
    (isCareerPlanBlocked || isPlanNarrativeReady);
  const openPlan = React.useCallback(() => {
    if (!canPressPlanAction) return;
    if (isCareerPlanBlocked) {
      navigation.navigate('NatalChart');
      return;
    }
    navigation.navigate('CareerVibePlan');
  }, [canPressPlanAction, isCareerPlanBlocked, navigation]);

  const loadCareerPlan = React.useCallback(async (options: { readLocalCache?: boolean } = {}) => {
    const readLocalCache = options.readLocalCache ?? true;
    setIsLoading(true);
    try {
      if (readLocalCache) {
        const cached = await getCachedCareerVibePlanForCurrentUser();
        if (!mountedRef.current) return;
        if (cached.payload) {
          setCareerPlan(cached.payload);
          setSourceMode(cached.source);
          setErrorText(cached.errorText);
        }
      }

      const result = await syncCareerVibePlanCache();
      if (!mountedRef.current) return;
      if (result.snapshot.payload) {
        setCareerPlan(result.snapshot.payload);
        setSourceMode(result.snapshot.source);
        setErrorText(result.snapshot.errorText);
      } else {
        setCareerPlan(null);
        setSourceMode('empty');
        setErrorText(result.snapshot.errorText ?? 'Fresh career signals did not sync.');
      }
    } catch {
      if (mountedRef.current) {
        setCareerPlan(null);
        setSourceMode('empty');
        setErrorText('Fresh career signals did not sync.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadCareerPlan();
    return () => {
      mountedRef.current = false;
    };
  }, [loadCareerPlan]);

  useEffect(() => {
    if (displayPlan?.narrativeStatus !== 'pending') {
      pendingPollCountRef.current = 0;
      return;
    }
    if (isLoading || isCareerPlanBlocked) return;
    if (pendingPollCountRef.current >= CAREER_VIBE_PENDING_POLL_MAX_ATTEMPTS) {
      setErrorText('Career Vibe is taking longer than expected. Try again in a moment.');
      return;
    }

    const timer = setTimeout(() => {
      pendingPollCountRef.current += 1;
      void loadCareerPlan({ readLocalCache: false });
    }, CAREER_VIBE_PENDING_POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [displayPlan?.narrativeStatus, isCareerPlanBlocked, isLoading, loadCareerPlan]);

  useEffect(() => {
    if (!isSummaryMeasurementPending || !summaryText) return;
    const timer = setTimeout(() => {
      setMeasuredSummary((current) => {
        if (current?.text === summaryText) return current;
        return { text: summaryText, height: estimateSummaryTextHeight(summaryText) };
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [isSummaryMeasurementPending, summaryText]);

  useEffect(() => {
    if (shouldShowSkeleton || !displayPlan?.plan) {
      setTyped('');
      return;
    }
    let i = 0;
    const summary = displayPlan.plan.summary;
    const interval = setInterval(() => {
      if (i <= summary.length) {
        setTyped(summary.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [displayPlan?.plan, shouldShowSkeleton]);

  useEffect(() => {
    if (!isLoading && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [isLoading, onReady]);

  const skeletonColor = adaptColorOpacity('rgba(255,255,255,0.09)', channels.glowOpacityMultiplier);
  const skeletonAccent = adaptColorOpacity('rgba(201,168,76,0.16)', channels.glowOpacityMultiplier);
  if (shouldShowSkeleton) {
    return (
      <View className="px-5 py-2">
        <LinearGradient
          colors={[
            adaptColorOpacity('rgba(201,168,76,0.06)', channels.glowOpacityMultiplier),
            adaptColorOpacity('rgba(90,58,204,0.06)', channels.glowOpacityMultiplier),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5 rounded-[24px] overflow-hidden relative"
          style={{
            minHeight: 392,
            borderWidth: 1,
            borderColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.borderOpacityMultiplier),
          }}
        >
          <LinearGradient
            colors={[
              adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
              'transparent',
              adaptColorOpacity('rgba(0,0,0,0.15)', channels.glowOpacityMultiplier),
            ]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              opacity: adaptOpacity(0.6, channels.glowOpacityMultiplier),
            }}
          />

          {summaryText ? (
            <Text
              accessible={false}
              accessibilityElementsHidden
              className="text-[14px]"
              importantForAccessibility="no-hide-descendants"
              numberOfLines={CAREER_VIBE_SUMMARY_MAX_LINES}
              onTextLayout={handleSummaryTextLayout}
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                top: 20,
                opacity: 0,
                color: 'transparent',
                lineHeight: CAREER_VIBE_SUMMARY_LINE_HEIGHT,
              }}
            >
              {summaryText}
            </Text>
          ) : null}

          <View className="flex-row items-center mb-4">
            <View
              className="w-8 h-8 rounded-[10px] justify-center items-center mr-2.5"
              style={{
                backgroundColor: adaptColorOpacity('rgba(201,168,76,0.12)', channels.glowOpacityMultiplier),
                borderColor: adaptColorOpacity('rgba(201,168,76,0.18)', channels.borderOpacityMultiplier),
                borderWidth: 1,
              }}
            >
              <Flame size={15} color={adaptColorOpacity('rgba(201,168,76,0.82)', channels.textOpacityMultiplier)} />
            </View>
            <View className="flex-1">
              <SkeletonBar width="46%" height={14} color={skeletonAccent} />
              <View style={{ height: 8 }} />
              <SkeletonBar width="32%" height={10} color={skeletonColor} />
            </View>
            <SkeletonBar width={54} height={10} color={skeletonColor} />
          </View>

          <View className="mb-4">
            <SkeletonBar width="70%" height={18} color={skeletonColor} />
            <View style={{ height: 14 }} />
            <SkeletonBar width={124} height={22} color={skeletonAccent} />
          </View>

          <View
            className="rounded-[14px] px-3 py-3 mb-4"
            style={{
              backgroundColor: adaptColorOpacity('rgba(255,255,255,0.05)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(201,168,76,0.14)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <SkeletonBar width={74} height={10} color={skeletonAccent} />
            <View style={{ height: 12 }} />
            <SkeletonBar width="92%" height={14} color={skeletonColor} />
            <View style={{ height: 8 }} />
            <SkeletonBar width="62%" height={14} color={skeletonColor} />
          </View>

          <View style={{ minHeight: 110, marginBottom: 14 }}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View key={`summary-skeleton:${index}`} style={{ marginBottom: index === 4 ? 0 : 9 }}>
                <SkeletonBar
                  width={index === 4 ? '54%' : index === 3 ? '76%' : '96%'}
                  height={13}
                  color={skeletonColor}
                />
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap mb-4">
            {[72, 96, 82].map((item) => (
              <View
                key={`best-skeleton:${item}`}
                className="px-2.5 py-1 rounded-md mr-2 mb-2"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(56,204,136,0.08)', channels.glowOpacityMultiplier),
                  borderColor: adaptColorOpacity('rgba(56,204,136,0.12)', channels.borderOpacityMultiplier),
                  borderWidth: 1,
                }}
              >
                <SkeletonBar width={item} height={13} color={adaptColorOpacity('rgba(56,204,136,0.16)', channels.glowOpacityMultiplier)} />
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((index) => (
              <View key={`metric-skeleton:${index}`} style={{ width: '47%' }}>
                <View className="flex-row justify-between items-center mb-1.5">
                  <SkeletonBar width={64} height={10} color={skeletonColor} />
                  <SkeletonBar width={28} height={10} color={skeletonColor} />
                </View>
                <View
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier) }}
                >
                  <View className="h-full rounded-full" style={{ width: '46%', backgroundColor: skeletonAccent }} />
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  }

  const buttonLabel = shouldShowSkeleton
    ? 'Preparing plan'
    : careerPrerequisites?.isReadyForCareerFeatures === false
      ? careerPrerequisites.actionLabel
      : isPlanNarrativeReady
        ? 'Open full plan'
        : errorText
          ? 'Plan unavailable'
        : displayPlan?.narrativeStatus === 'pending'
          ? 'Preparing plan'
          : 'Plan unavailable';

  return (
    <View className="px-5 py-2">
      <LinearGradient
        colors={[
          adaptColorOpacity('rgba(201,168,76,0.06)', channels.glowOpacityMultiplier),
          adaptColorOpacity('rgba(90,58,204,0.06)', channels.glowOpacityMultiplier),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 rounded-[24px] overflow-hidden relative"
        style={{
          borderWidth: 1,
          borderColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.borderOpacityMultiplier),
        }}
      >
        <LinearGradient
          colors={[
            adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
            'transparent',
            adaptColorOpacity('rgba(0,0,0,0.15)', channels.glowOpacityMultiplier),
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: adaptOpacity(0.6, channels.glowOpacityMultiplier),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -70,
            top: -70,
            width: 240,
            height: 240,
          }}
        >
          <LinearGradient
            colors={[
              adaptColorOpacity('rgba(201,168,76,0.35)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.12)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.03)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.0)', channels.glowOpacityMultiplier),
            ]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.9, y: 0.9 }}
            style={{
              width: 240,
              height: 240,
              borderRadius: 999,
              opacity: adaptOpacity(0.08, channels.glowOpacityMultiplier),
            }}
          />
          {Platform.OS === 'web' ? (
            <Svg
              width={240}
              height={240}
              style={{
                position: 'absolute',
                opacity: adaptOpacity(0.18, channels.glowOpacityMultiplier),
              }}
            >
              <Defs>
                <SvgRadialGradient id="astroRingsWeb" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={adaptColorOpacity('rgba(201,168,76,0.65)', channels.glowOpacityMultiplier)} />
                  <Stop offset="26%" stopColor={adaptColorOpacity('rgba(201,168,76,0.22)', channels.glowOpacityMultiplier)} />
                  <Stop offset="36%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="48%" stopColor={adaptColorOpacity('rgba(201,168,76,0.18)', channels.glowOpacityMultiplier)} />
                  <Stop offset="58%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="70%" stopColor={adaptColorOpacity('rgba(201,168,76,0.14)', channels.glowOpacityMultiplier)} />
                  <Stop offset="80%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="100%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                </SvgRadialGradient>
              </Defs>
              <SvgRect x="0" y="0" width="240" height="240" fill="url(#astroRingsWeb)" />
            </Svg>
          ) : (
            <Canvas style={{ position: 'absolute', width: 240, height: 240, top: -60, right: -60 }}>
              <Group transform={[{ scaleX: 1.5 }, { scaleY: 0.8 }, { rotate: Math.PI / 4 }]}>
                <Rect x={0} y={0} width={100} height={100}>
                  <RadialGradient
                    c={vec(180, 60)}
                    r={150}
                    colors={[
                      adaptColorOpacity('rgba(201,168,76,0.35)', channels.glowOpacityMultiplier),
                      adaptColorOpacity('rgba(201,168,76,0.10)', channels.glowOpacityMultiplier),
                      'transparent',
                    ]}
                    positions={[0, 0.4, 1]}
                  />
                </Rect>
                <Blur blur={20} />
              </Group>
            </Canvas>
          )}
        </View>

        <View className="flex-row items-center mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(201,168,76,0.15)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <Flame size={13} color={theme.colors.gold} style={{ marginRight: 6 }} />
            <Text className="text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ color: theme.colors.gold }}>
              Career Vibe
            </Text>
          </View>
          <Text
            className="text-[10px] ml-auto"
            style={{ color: adaptColorOpacity('rgba(212,212,224,0.4)', channels.textOpacityMultiplier) }}
          >
            {statusLabel}
          </Text>
        </View>

        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Zap size={16} color={theme.colors.gold} style={{ marginRight: 6 }} />
            {shouldShowSkeleton ? (
              <SkeletonBar width="68%" height={18} color={skeletonColor} />
            ) : (
              <Text
                className="text-[16px] font-semibold tracking-tight"
                style={{ color: theme.colors.foreground, flexShrink: 1 }}
              >
                {displayPlan?.plan?.headline ??
                  (errorText || displayPlan?.narrativeStatus !== 'pending' ? 'Career Vibe is unavailable' : "Today's plan is preparing")}
              </Text>
            )}
          </View>

          <View className="mb-3">
            <View
              className="px-2.5 py-0.5 rounded-md self-start"
              style={{
                backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
                borderColor: adaptColorOpacity('rgba(201,168,76,0.15)', channels.borderOpacityMultiplier),
                borderWidth: 1,
              }}
            >
              {shouldShowSkeleton ? (
                <SkeletonBar width={118} height={15} color={skeletonAccent} />
              ) : (
                <Text className="text-[12px] font-semibold" style={{ color: theme.colors.gold }}>
                  {displayPlan?.modeLabel ?? 'Career Vibe'}
                </Text>
              )}
            </View>
          </View>

          <View
            className="rounded-[14px] px-3 py-3 mb-3"
            style={{
              backgroundColor: adaptColorOpacity('rgba(255,255,255,0.05)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(201,168,76,0.14)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <Text
              className="text-[10px] uppercase font-semibold tracking-[1.2px] mb-1"
              style={{ color: adaptColorOpacity('rgba(201,168,76,0.82)', channels.textOpacityMultiplier) }}
            >
              Best move
            </Text>
            {shouldShowSkeleton ? (
              <View style={{ height: 42, justifyContent: 'center' }}>
                <SkeletonBar width="92%" height={13} color={skeletonColor} />
                <View style={{ height: 8 }} />
                <SkeletonBar width="58%" height={13} color={skeletonColor} />
              </View>
            ) : (
              <Text className="text-[14px] leading-[20px] font-semibold" style={{ color: theme.colors.foreground }}>
                {displayPlan?.plan?.primaryAction ?? 'The full plan text is not ready yet.'}
              </Text>
            )}
          </View>

          <View style={{ height: summaryContainerHeight, marginBottom: 12 }}>
            {summaryText ? (
              <Text
                accessible={false}
                accessibilityElementsHidden
                className="text-[14px]"
                importantForAccessibility="no-hide-descendants"
                numberOfLines={CAREER_VIBE_SUMMARY_MAX_LINES}
                onTextLayout={handleSummaryTextLayout}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  opacity: 0,
                  color: 'transparent',
                  lineHeight: CAREER_VIBE_SUMMARY_LINE_HEIGHT,
                }}
              >
                {summaryText}
              </Text>
            ) : null}
            <Text
              className="text-[14px]"
              numberOfLines={CAREER_VIBE_SUMMARY_MAX_LINES}
              style={{
                color: adaptColorOpacity('rgba(212,212,224,0.75)', channels.textOpacityMultiplier),
                lineHeight: CAREER_VIBE_SUMMARY_LINE_HEIGHT,
              }}
            >
              {typed || displayErrorText}
            </Text>
          </View>

          <View className="mt-3">
            <View className="flex-row flex-wrap">
              {shouldShowSkeleton ? [72, 96, 82].map((item) => (
                <View
                  key={`best-skeleton:${item}`}
                  className="px-2.5 py-1 rounded-md mr-2 mb-2"
                  style={{
                    backgroundColor: adaptColorOpacity('rgba(56,204,136,0.08)', channels.glowOpacityMultiplier),
                    borderColor: adaptColorOpacity('rgba(56,204,136,0.12)', channels.borderOpacityMultiplier),
                    borderWidth: 1,
                  }}
                >
                  <SkeletonBar width={item} height={13} color={adaptColorOpacity('rgba(56,204,136,0.16)', channels.glowOpacityMultiplier)} />
                </View>
              )) : (displayPlan?.plan?.bestFor ?? []).slice(0, 3).map((item) => (
                <View
                  key={`best:${item}`}
                  className="px-2.5 py-1 rounded-md mr-2 mb-2"
                  style={{
                    backgroundColor: adaptColorOpacity('rgba(56,204,136,0.1)', channels.glowOpacityMultiplier),
                    borderColor: adaptColorOpacity('rgba(56,204,136,0.16)', channels.borderOpacityMultiplier),
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[11px] font-semibold" style={{ color: '#38CC88' }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
            {shouldShowSkeleton ? (
              <SkeletonBar width="84%" height={13} color={skeletonColor} />
            ) : displayPlan?.plan ? (
              <Text
                className="text-[12px] leading-[17px]"
                numberOfLines={2}
                style={{ color: adaptColorOpacity('rgba(212,212,224,0.52)', channels.textOpacityMultiplier) }}
              >
                Avoid: {displayPlan.plan.avoid.slice(0, 2).join(' | ')}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {[
            { label: 'Energy', value: displayPlan?.metrics.energy ?? null, color: '#C9A84C' },
            { label: 'Focus', value: displayPlan?.metrics.focus ?? null, color: '#5A3ACC' },
            { label: 'Opportunity', value: displayPlan?.metrics.opportunity ?? null, color: '#38CC88' },
            { label: 'AI Fit', value: displayPlan?.metrics.aiSynergy ?? null, color: '#A08CFF' },
          ].map((stat) => (
            <View key={stat.label} style={{ width: '47%' }}>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text
                  className="text-[10px] uppercase tracking-[1px] font-semibold"
                  style={{ color: adaptColorOpacity('rgba(212,212,224,0.45)', channels.textOpacityMultiplier) }}
                >
                  {stat.label}
                </Text>
                {shouldShowSkeleton ? (
                  <SkeletonBar width={28} height={10} color={skeletonColor} />
                ) : (
                  <Text className="text-[10px] font-bold" style={{ color: stat.color }}>
                    {stat.value === null ? '--' : `${stat.value}%`}
                  </Text>
                )}
              </View>
              <View
                className="h-1 rounded-full overflow-hidden"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
                }}
              >
                <View
                  className="h-full rounded-full"
                  style={{ width: shouldShowSkeleton || stat.value === null ? '46%' : `${stat.value}%`, backgroundColor: stat.color }}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={openPlan}
          disabled={!canPressPlanAction}
          className="flex-row items-center justify-center mt-4 rounded-[14px] py-3"
          style={{
            opacity: canPressPlanAction ? 1 : 0.7,
            backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
            borderColor: adaptColorOpacity('rgba(201,168,76,0.18)', channels.borderOpacityMultiplier),
            borderWidth: 1,
          }}
        >
          <Text className="text-[13px] font-black" style={{ color: theme.colors.gold }}>
            {buttonLabel}
          </Text>
          <ChevronRight size={15} color={theme.colors.gold} style={{ marginLeft: 4 }} />
        </Pressable>
      </LinearGradient>
    </View>
  );
};
