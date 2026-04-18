import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { ChevronRight, Flame, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Rect, RadialGradient, vec, Blur, Group } from '@shopify/react-native-skia';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect as SvgRect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { CareerVibePlanResponse } from '../services/astrologyApi';
import { syncCareerVibePlanCache, type CareerVibePlanSourceMode } from '../services/careerVibePlanSync';
import type { AppNavigationProp } from '../types/navigation';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../utils/brightnessAdaptation';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';

const FALLBACK_CAREER_PLAN: CareerVibePlanResponse = {
  dateKey: 'sample',
  cached: false,
  schemaVersion: 'career-vibe-plan-v1',
  tier: 'free',
  narrativeSource: 'template',
  model: 'fallback',
  promptVersion: 'fallback',
  generatedAt: '',
  staleAfter: '',
  modeLabel: 'High Execution Mode',
  metrics: {
    energy: 92,
    focus: 78,
    luck: 65,
    opportunity: 65,
    aiSynergy: 82,
  },
  plan: {
    headline: 'Mars in 10th House',
    summary: 'Strong execution energy is available today. Close one important task before opening new threads.',
    primaryAction: 'Close one meaningful deliverable before opening new threads.',
    bestFor: ['Deep work', 'Shipping decisions', 'AI-assisted drafting'],
    avoid: ['Rushing final approvals', 'Breaking deep work with low-value pings'],
    peakWindow: '2-4 PM',
    focusStrategy: 'Put the hardest work in the first protected block, then move admin work after the deliverable is closed.',
    communicationStrategy: 'Use the strongest window for specific asks and follow-ups with a clear next step.',
    aiWorkStrategy: 'Use AI for structured drafts and review checklists, then run a final human approval pass.',
    riskGuardrail: 'Close the loop with one explicit review checkpoint before expanding scope.',
  },
  explanation: {
    drivers: ['Sample plan is shown while fresh career signals are unavailable.'],
    cautions: ['Open Horojob again when the connection is stable to refresh the plan.'],
    metricNotes: [],
  },
  sources: {
    dailyTransitDateKey: 'sample',
    aiSynergyDateKey: null,
    dailyVibeAlgorithmVersion: 'fallback',
    aiSynergyAlgorithmVersion: null,
  },
};

export const DailyAstroStatus = ({ onReady }: { onReady?: () => void }) => {
  const theme = useAppTheme();
  const navigation = useNavigation<AppNavigationProp<'Dashboard'>>();
  const { channels } = useBrightnessAdaptation();
  const [careerPlan, setCareerPlan] = useState<CareerVibePlanResponse>(FALLBACK_CAREER_PLAN);
  const [sourceMode, setSourceMode] = useState<CareerVibePlanSourceMode>('empty');
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const hasSignaledReadyRef = React.useRef(false);
  const openPlan = React.useCallback(() => {
    navigation.navigate('CareerVibePlan');
  }, [navigation]);
  const statusLabel = React.useMemo(() => {
    if (SHOULD_EXPOSE_TECHNICAL_SURFACES) {
      return isLoading ? 'Syncing...' : sourceMode === 'cache' ? 'Saved' : errorText ? 'Sample' : careerPlan.cached ? 'Cached' : 'Today';
    }
    if (isLoading) return 'Updating';
    if (errorText) return 'Preview';
    return 'Today';
  }, [careerPlan.cached, errorText, isLoading, sourceMode]);
  const displayErrorText = React.useMemo(() => {
    if (!errorText) return null;
    if (SHOULD_EXPOSE_TECHNICAL_SURFACES) return errorText;
    if (sourceMode === 'cache') return "Showing your saved plan while today's update is unavailable.";
    return "Today's Career Vibe could not update yet. Reopen Horojob when the connection is stable.";
  }, [errorText, sourceMode]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      try {
        const result = await syncCareerVibePlanCache();
        if (!mounted) return;
        if (result.snapshot.payload) {
          setCareerPlan(result.snapshot.payload);
          setSourceMode(result.snapshot.source);
          setErrorText(result.snapshot.errorText);
        } else {
          setCareerPlan(FALLBACK_CAREER_PLAN);
          setSourceMode('empty');
          setErrorText(result.snapshot.errorText ?? 'Using sample plan. Fresh career signals did not sync.');
        }
      } catch {
        if (mounted) {
          setCareerPlan(FALLBACK_CAREER_PLAN);
          setSourceMode('empty');
          setErrorText('Using sample plan. Fresh career signals did not sync.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= careerPlan.plan.summary.length) {
        setTyped(careerPlan.plan.summary.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [careerPlan.plan.summary]);

  useEffect(() => {
    if (!isLoading && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [isLoading, onReady]);

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
            <Text
              className="text-[16px] font-semibold tracking-tight"
              style={{ color: theme.colors.foreground, flexShrink: 1 }}
            >
              {careerPlan.plan.headline}
            </Text>
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
              <Text className="text-[12px] font-semibold" style={{ color: theme.colors.gold }}>
                {careerPlan.modeLabel}
              </Text>
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
            <Text className="text-[14px] leading-[20px] font-semibold" style={{ color: theme.colors.foreground }}>
              {careerPlan.plan.primaryAction}
            </Text>
          </View>

          <View className="flex-row items-center min-h-[44px]">
            <Text
              className="text-[14px] leading-[22px]"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.75)', channels.textOpacityMultiplier) }}
            >
              {typed}
            </Text>
          </View>

          {displayErrorText ? (
            <Text
              className="text-[11px] leading-[16px] mt-2"
              style={{ color: adaptColorOpacity('rgba(201,168,76,0.72)', channels.textOpacityMultiplier) }}
            >
              {displayErrorText}
            </Text>
          ) : null}

          <View className="mt-3">
            <View className="flex-row flex-wrap">
              {careerPlan.plan.bestFor.slice(0, 3).map((item) => (
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
            <Text
              className="text-[12px] leading-[17px]"
              numberOfLines={2}
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.52)', channels.textOpacityMultiplier) }}
            >
              Avoid: {careerPlan.plan.avoid.slice(0, 2).join(' | ')}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {[
            { label: 'Energy', value: careerPlan.metrics.energy, color: '#C9A84C' },
            { label: 'Focus', value: careerPlan.metrics.focus, color: '#5A3ACC' },
            { label: 'Opportunity', value: careerPlan.metrics.opportunity, color: '#38CC88' },
            { label: 'AI Fit', value: careerPlan.metrics.aiSynergy, color: '#A08CFF' },
          ].map((stat) => (
            <View key={stat.label} style={{ width: '47%' }}>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text
                  className="text-[10px] uppercase tracking-[1px] font-semibold"
                  style={{ color: adaptColorOpacity('rgba(212,212,224,0.45)', channels.textOpacityMultiplier) }}
                >
                  {stat.label}
                </Text>
                <Text className="text-[10px] font-bold" style={{ color: stat.color }}>
                  {stat.value}%
                </Text>
              </View>
              <View
                className="h-1 rounded-full overflow-hidden"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
                }}
              >
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={openPlan}
          className="flex-row items-center justify-center mt-4 rounded-[14px] py-3"
          style={{
            backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
            borderColor: adaptColorOpacity('rgba(201,168,76,0.18)', channels.borderOpacityMultiplier),
            borderWidth: 1,
          }}
        >
          <Text className="text-[13px] font-black" style={{ color: theme.colors.gold }}>
            Open full plan
          </Text>
          <ChevronRight size={15} color={theme.colors.gold} style={{ marginLeft: 4 }} />
        </Pressable>
      </LinearGradient>
    </View>
  );
};
