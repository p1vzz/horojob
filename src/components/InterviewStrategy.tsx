import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Dimensions, Animated, Easing } from 'react-native';
import { Lock, CalendarClock, Sparkles, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G, Mask, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { fetchInterviewStrategyPlan } from '../services/notificationsApi';
import { useAppTheme, useThemeMode } from '../theme/ThemeModeProvider';
import {
  buildInterviewStrategyInsight,
  FALLBACK_INTERVIEW_INSIGHT,
  FALLBACK_INTERVIEW_SLOTS,
  resolveInterviewStrategyScoreTone,
  toInterviewSlotRows,
  type InterviewSlotRow,
} from './interviewStrategyCore';
import { INTERVIEW_STRATEGY_WAVE_LAYER_SPECS } from './interviewStrategyVisuals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 170;

const LockedInterviewCard = ({ onPress, isLight }: { onPress: () => void; isLight: boolean }) => {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={onPress}
      style={{
        height: CARD_HEIGHT,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: isLight ? 'rgba(255,252,246,0.95)' : '#0C0C14',
        borderColor: isLight ? 'rgba(180,152,105,0.22)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        position: 'relative',
      }}
    >
      <View style={{ position: 'absolute', inset: 0, opacity: isLight ? 0.09 : 0.15 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="gridFadeInterview"
              cx={CARD_WIDTH / 2}
              cy={CARD_HEIGHT / 2}
              r={CARD_WIDTH / 1.5}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={isLight ? '#D9C9B0' : 'white'} stopOpacity="1" />
              <Stop offset="100%" stopColor={isLight ? '#D9C9B0' : 'white'} stopOpacity="0" />
            </RadialGradient>
            <Mask id="gridMaskInterview">
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridFadeInterview)" />
            </Mask>
          </Defs>
          <G mask="url(#gridMaskInterview)">
            {[...Array(12)].map((_, i) => (
              <Path key={`v-${i}`} d={`M ${i * 35} 0 L ${i * 35} ${CARD_HEIGHT}`} stroke={isLight ? '#D7C6AC' : 'white'} strokeWidth="0.5" />
            ))}
            {[...Array(6)].map((_, i) => (
              <Path key={`h-${i}`} d={`M 0 ${i * 35} L ${CARD_WIDTH} ${i * 35}`} stroke={isLight ? '#D7C6AC' : 'white'} strokeWidth="0.5" />
            ))}
          </G>
        </Svg>
      </View>

      <LinearGradient
        colors={isLight ? ['rgba(255,255,255,0.45)', 'rgba(246,240,230,0.9)'] : ['rgba(12, 12, 20, 0.2)', 'rgba(12, 12, 20, 0.92)']}
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <View
          className="w-12 h-12 rounded-full justify-center items-center mb-5"
          style={{
            backgroundColor: isLight ? 'rgba(201,168,76,0.14)' : 'rgba(201, 168, 76, 0.08)',
            borderColor: isLight ? 'rgba(176,143,85,0.3)' : 'rgba(201, 168, 76, 0.2)',
            borderWidth: 1,
          }}
        >
          <Lock size={20} color={isLight ? '#A77C2E' : theme.colors.gold} />
        </View>

        <View style={{ width: '100%', borderRadius: 26, overflow: 'hidden' }}>
          <LinearGradient
            colors={['#D4B45B', '#C9A84C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 26 }}
          >
            <CalendarClock size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>Unlock Golden Hour for Interview</Text>
            <Sparkles size={16} color="#000" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </View>

        <Text className="text-[10px] mt-4 font-bold uppercase tracking-widest" style={{ color: isLight ? 'rgba(124,108,81,0.58)' : 'rgba(255,255,255,0.2)' }}>
          Premium Feature
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const InterviewStrategy = ({ onReady }: { onReady?: () => void }) => {
  const navigation = useNavigation<AppNavigationProp>();
  const { isLight, theme } = useThemeMode();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [slots, setSlots] = useState<InterviewSlotRow[]>(FALLBACK_INTERVIEW_SLOTS);
  const [insightText, setInsightText] = useState(FALLBACK_INTERVIEW_INSIGHT);
  const hasSignaledReadyRef = useRef(false);
  const waveLayers = useRef(
    INTERVIEW_STRATEGY_WAVE_LAYER_SPECS.map((spec) => ({
      ...spec,
      progress: new Animated.Value(spec.initialValue),
    }))
  ).current;

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const session = await ensureAuthSession();
        const premium = session.user.subscriptionTier === 'premium';
        if (!mounted) return;
        setIsPremium(premium);
        if (!premium) return;

        try {
          const payload = await fetchInterviewStrategyPlan({ refresh: false });
          if (!mounted) return;
          const sortedSlots = [...payload.plan.slots]
            .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
            .slice(0, 3);
          const nextRows = toInterviewSlotRows(sortedSlots);

          if (nextRows.length > 0) {
            setSlots(nextRows);
            const bestSlot = sortedSlots.reduce((best, current) => {
              if (!best) return current;
              return current.score > best.score ? current : best;
            }, sortedSlots[0]);
            setInsightText(buildInterviewStrategyInsight(bestSlot));
          } else {
            setSlots(FALLBACK_INTERVIEW_SLOTS);
            setInsightText('Generate interview strategy in Settings to unlock fresh Golden Hour windows.');
          }
        } catch (error) {
          if (!mounted) return;
          if (error instanceof ApiError && error.status === 403) {
            setIsPremium(false);
            return;
          }
          setSlots(FALLBACK_INTERVIEW_SLOTS);
          setInsightText(FALLBACK_INTERVIEW_INSIGHT);
        }
      } catch {
        if (mounted) {
          setIsPremium(false);
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
    const loops = waveLayers.map((wave) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave.progress, {
            toValue: 1,
            duration: wave.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(wave.progress, {
            toValue: 0,
            duration: wave.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [waveLayers]);

  useEffect(() => {
    if (!isLoading && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [isLoading, onReady]);

  const topSlots = useMemo(() => slots.slice(0, 3), [slots]);
  const topPickSlotId = useMemo(() => {
    let candidate: InterviewSlotRow | null = null;
    for (const slot of topSlots) {
      if (!candidate || slot.score > candidate.score) {
        candidate = slot;
      }
    }
    return candidate?.id ?? null;
  }, [topSlots]);
  const animatedWaves = useMemo(
    () =>
      waveLayers.map((wave) => ({
        ...wave,
        translateX: wave.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [wave.translateFrom, wave.translateTo],
        }),
        opacity: wave.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [wave.opacityMin, wave.opacityPeak, wave.opacityMin],
        }),
      })),
    [waveLayers]
  );
  const handleOpenPremium = () => navigation.navigate('PremiumPurchase');
  const handleOpenFullCalendar = () => navigation.navigate('Settings');

  return (
    <View className="px-5 py-3">
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text
          className="text-[11px] tracking-[2.5px] font-black uppercase"
          style={{ color: isLight ? 'rgba(126,114,98,0.62)' : 'rgba(255,255,255,0.4)' }}
        >
          Interview Strategy
        </Text>
        {isPremium ? (
          <Pressable onPress={handleOpenFullCalendar} className="flex-row items-center">
            <Text className="text-[11px] font-semibold" style={{ color: 'rgba(201,168,76,0.92)' }}>
              Full Calendar
            </Text>
            <ChevronRight size={13} color="rgba(201,168,76,0.92)" />
          </Pressable>
        ) : (
          <View className="flex-row items-center">
            <Lock size={10} color={theme.colors.gold} opacity={0.5} />
            <Text className="text-[10px] font-bold ml-1 uppercase" style={{ color: theme.colors.gold, opacity: 0.6 }}>
              PRO
            </Text>
          </View>
        )}
      </View>

      {isPremium ? (
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isLight ? 'rgba(180,151,103,0.26)' : 'rgba(201,168,76,0.2)',
            backgroundColor: isLight ? 'rgba(255,252,246,0.95)' : 'rgba(11,11,18,0.95)',
            padding: 14,
          }}
        >
          <LinearGradient
            colors={
              isLight
                ? ['rgba(201,168,76,0.1)', 'rgba(56,204,136,0.05)', 'rgba(255,255,255,0.32)']
                : ['rgba(201,168,76,0.08)', 'rgba(56,204,136,0.06)', 'rgba(10,10,20,0.08)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          <LinearGradient
            colors={
              isLight
                ? ['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']
                : ['rgba(255,255,255,0.055)', 'transparent', 'rgba(0,0,0,0.14)']
            }
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isLight ? 0.65 : 0.58,
            }}
          />
          {animatedWaves.map((wave) => {
            const gradientId = `interviewWave-${wave.id}`;
            return (
              <Animated.View
                key={wave.id}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                left: wave.left,
                right: wave.right,
                top: wave.top,
                height: wave.height,
                opacity: wave.opacity,
                  transform: [{ translateX: wave.translateX }],
                }}
              >
                <Svg width="100%" height="100%" viewBox={`0 0 420 ${wave.viewBoxHeight}`} preserveAspectRatio="none">
                  <Defs>
                    <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor={isLight ? 'rgba(181,160,125,0)' : 'rgba(255,255,255,0)'} />
                      <Stop offset="50%" stopColor={isLight ? 'rgba(175,151,109,0.2)' : wave.middleColor} />
                      <Stop offset="100%" stopColor={isLight ? 'rgba(181,160,125,0)' : 'rgba(255,255,255,0)'} />
                    </SvgLinearGradient>
                  </Defs>
                  <Path
                    d={wave.path}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={wave.strokeWidth}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
            );
          })}
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
            <LinearGradient
              colors={
                isLight
                  ? ['rgba(255,252,246,0.86)', 'rgba(255,252,246,0)']
                  : ['rgba(11,11,18,0.78)', 'rgba(11,11,18,0)']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 28,
              }}
            />
            <LinearGradient
              colors={
                isLight
                  ? ['rgba(255,252,246,0)', 'rgba(255,252,246,0.86)']
                  : ['rgba(11,11,18,0)', 'rgba(11,11,18,0.78)']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 28,
              }}
            />
            <LinearGradient
              colors={
                isLight
                  ? ['rgba(255,252,246,0.72)', 'rgba(255,252,246,0)']
                  : ['rgba(11,11,18,0.64)', 'rgba(11,11,18,0)']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 22,
              }}
            />
            <LinearGradient
              colors={
                isLight
                  ? ['rgba(255,252,246,0)', 'rgba(255,252,246,0.9)']
                  : ['rgba(11,11,18,0)', 'rgba(11,11,18,0.82)']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 30,
              }}
            />
          </View>

          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-[14px] items-center justify-center mr-3"
              style={{
                backgroundColor: isLight ? 'rgba(201,168,76,0.16)' : 'rgba(201,168,76,0.14)',
                borderColor: isLight ? 'rgba(172,140,86,0.32)' : 'rgba(201,168,76,0.3)',
                borderWidth: 1,
              }}
            >
              <CalendarClock size={20} color="#C9A84C" />
            </View>
            <View className="flex-1">
              <Text className="text-[25px] font-semibold tracking-tight" style={{ color: isLight ? 'rgba(64,55,45,0.95)' : 'rgba(240,240,248,0.95)' }}>
                Golden Hours
              </Text>
              <Text className="text-[12px] mt-0.5" style={{ color: isLight ? 'rgba(129,116,97,0.86)' : 'rgba(212,212,224,0.56)' }}>
                Cosmic windows for success
              </Text>
            </View>
          </View>

          <>
            <View className="mt-3">
              {topSlots.map((slot) => {
                const tone = resolveInterviewStrategyScoreTone(slot.score);
                const isTopSlot = slot.id === topPickSlotId;
                return (
                  <View
                    key={slot.id}
                    className="rounded-[14px] px-3 py-2.5 mb-2.5"
                    style={{
                      backgroundColor: tone.background,
                      borderColor: tone.border,
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{
                          backgroundColor: tone.accent,
                          shadowColor: tone.accent,
                          shadowOpacity: isLight ? 0.18 : isTopSlot ? 0.7 : 0.25,
                          shadowRadius: isTopSlot ? 8 : 3,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-[22px] font-semibold"
                          style={{ color: isLight ? 'rgba(65,57,46,0.95)' : 'rgba(233,233,242,0.94)' }}
                        >
                          {slot.title}
                        </Text>
                        <Text
                          className="text-[11px] mt-0.5"
                          style={{ color: isLight ? 'rgba(129,116,97,0.86)' : 'rgba(212,212,224,0.55)' }}
                        >
                          {slot.timeRange}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View
                          className="px-2.5 py-0.5 rounded-full mr-2"
                          style={{
                            backgroundColor: `${tone.accent}22`,
                            borderWidth: 1,
                            borderColor: `${tone.accent}66`,
                          }}
                        >
                          <Text className="text-[11px] font-bold" style={{ color: tone.accent }}>
                            {slot.score}%
                          </Text>
                        </View>
                        {isTopSlot ? (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.08)',
                              borderWidth: 1,
                              borderColor: `${tone.accent}66`,
                            }}
                          >
                            <Text className="text-[10px] font-bold" style={{ color: tone.accent }}>
                              Top Pick
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View
                      className="h-[2px] rounded-full mt-2"
                      style={{ backgroundColor: isLight ? 'rgba(172,148,111,0.3)' : 'rgba(255,255,255,0.08)' }}
                    >
                      <View
                        className="h-[2px] rounded-full"
                        style={{
                          width: `${slot.score}%`,
                          backgroundColor: tone.accent,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View
              className="rounded-[14px] px-3 py-3"
              style={{
                backgroundColor: isLight ? 'rgba(127,101,228,0.1)' : 'rgba(92,70,212,0.14)',
                borderColor: isLight ? 'rgba(121,96,214,0.28)' : 'rgba(92,70,212,0.36)',
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center mb-1">
                <Sparkles size={13} color="#8C7CFF" />
                <Text className="text-[12px] font-semibold ml-2" style={{ color: '#8C7CFF' }}>
                  Cosmic Insight
                </Text>
              </View>
              <Text className="text-[12px] leading-[18px]" style={{ color: isLight ? 'rgba(81,66,133,0.88)' : 'rgba(222,216,255,0.83)' }}>
                {insightText}
              </Text>
            </View>
          </>

          {isLoading ? (
            <Text className="text-[10px] mt-2" style={{ color: isLight ? 'rgba(129,116,97,0.76)' : 'rgba(212,212,224,0.46)' }}>
              Syncing premium interview windows...
            </Text>
          ) : null}
        </View>
      ) : (
        <LockedInterviewCard onPress={handleOpenPremium} isLight={isLight} />
      )}
    </View>
  );
};
