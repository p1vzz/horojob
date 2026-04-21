import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Lock, CalendarClock, Sparkles, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { syncInterviewStrategyPlan } from '../services/interviewStrategyPlanSync';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  buildInterviewStrategyInsight,
  DEFAULT_INTERVIEW_INSIGHT,
  NO_INTERVIEW_WINDOWS_INSIGHT,
  NO_INTERVIEW_WINDOWS_TITLE,
  resolveInterviewStrategyScoreTone,
  resolveInterviewStrategyTimingLabel,
  toInterviewSlotRows,
  type InterviewSlotRow,
} from './interviewStrategyCore';
import { trackAnalyticsEvent } from '../services/analytics';
import type { DashboardCareerFeaturePrerequisites } from '../hooks/useDashboardPrerequisites';

const CARD_HEIGHT = 148;

const SkeletonLine = ({ width, height = 12 }: { width: number | `${number}%`; height?: number }) => (
  <View
    style={{
      width,
      height,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.08)',
    }}
  />
);

const LockedInterviewCard = ({
  onPress,
  isLight,
  gold,
}: {
  onPress: () => void;
  isLight: boolean;
  gold: string;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={onPress}
      style={{
        minHeight: CARD_HEIGHT,
        borderRadius: 20,
        backgroundColor: isLight ? 'rgba(255,252,246,0.72)' : 'rgba(255,255,255,0.045)',
        borderColor: isLight ? 'rgba(180,152,105,0.24)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 16,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-[10px] justify-center items-center mr-2.5"
          style={{
            backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)',
            borderColor: isLight ? 'rgba(176,143,85,0.26)' : 'rgba(201,168,76,0.18)',
            borderWidth: 1,
          }}
        >
          <Lock size={15} color={gold} />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-semibold" style={{ color: isLight ? 'rgba(64,55,45,0.95)' : 'rgba(240,240,248,0.94)' }}>
            Interview Strategy
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: isLight ? 'rgba(129,116,97,0.78)' : 'rgba(212,212,224,0.5)' }}>
            Premium timing windows
          </Text>
        </View>
      </View>

      <Text className="text-[15px] leading-[21px] font-semibold" style={{ color: isLight ? 'rgba(64,55,45,0.92)' : 'rgba(233,233,242,0.88)' }}>
        Find stronger moments for interviews and follow-ups.
      </Text>
      <View className="flex-row items-center mt-auto pt-4">
        <Text className="text-[12px] font-semibold" style={{ color: gold }}>
          Unlock
        </Text>
        <ChevronRight size={14} color={gold} />
      </View>
    </TouchableOpacity>
  );
};

const LoadingInterviewCard = ({ isLight }: { isLight: boolean }) => (
  <View
    style={{
      minHeight: CARD_HEIGHT,
      borderRadius: 20,
      backgroundColor: isLight ? 'rgba(255,252,246,0.72)' : 'rgba(255,255,255,0.045)',
      borderColor: isLight ? 'rgba(180,152,105,0.24)' : 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 16,
    }}
  >
    <View className="flex-row items-center mb-3">
      <View
        className="w-8 h-8 rounded-[10px] justify-center items-center mr-2.5"
        style={{
          backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)',
          borderColor: isLight ? 'rgba(176,143,85,0.26)' : 'rgba(201,168,76,0.18)',
          borderWidth: 1,
        }}
      >
        <CalendarClock size={15} color="rgba(201,168,76,0.82)" />
      </View>
      <View className="flex-1">
        <SkeletonLine width="48%" height={14} />
        <View style={{ height: 8 }} />
        <SkeletonLine width="36%" height={11} />
      </View>
    </View>
    {[0, 1, 2].map((index) => (
      <View
        key={index}
        className="rounded-[12px] px-3 py-2.5 mb-2.5"
        style={{
          backgroundColor: isLight ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.035)',
          borderColor: isLight ? 'rgba(172,140,86,0.18)' : 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <SkeletonLine width={index === 0 ? '68%' : index === 1 ? '56%' : '62%'} height={13} />
        <View style={{ height: 8 }} />
        <SkeletonLine width="42%" height={10} />
      </View>
    ))}
  </View>
);

const BlockedInterviewCard = ({
  prerequisites,
  onPress,
  isLight,
  gold,
}: {
  prerequisites: DashboardCareerFeaturePrerequisites;
  onPress: () => void;
  isLight: boolean;
  gold: string;
}) => {
  const isChecking = prerequisites.reason === 'checking';
  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={isChecking ? undefined : onPress}
      disabled={isChecking}
      style={{
        minHeight: CARD_HEIGHT,
        borderRadius: 20,
        backgroundColor: isLight ? 'rgba(255,252,246,0.72)' : 'rgba(255,255,255,0.045)',
        borderColor: isLight ? 'rgba(180,152,105,0.24)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 16,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-[10px] justify-center items-center mr-2.5"
          style={{
            backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)',
            borderColor: isLight ? 'rgba(176,143,85,0.26)' : 'rgba(201,168,76,0.18)',
            borderWidth: 1,
          }}
        >
          <CalendarClock size={15} color={gold} />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-semibold" style={{ color: isLight ? 'rgba(64,55,45,0.95)' : 'rgba(240,240,248,0.94)' }}>
            Interview Strategy
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: isLight ? 'rgba(129,116,97,0.78)' : 'rgba(212,212,224,0.5)' }}>
            Career map required
          </Text>
        </View>
      </View>

      <Text className="text-[15px] leading-[21px] font-semibold" style={{ color: isLight ? 'rgba(64,55,45,0.92)' : 'rgba(233,233,242,0.88)' }}>
        {prerequisites.blockTitle}
      </Text>
      <Text className="text-[12px] leading-[18px] mt-1.5" style={{ color: isLight ? 'rgba(129,116,97,0.82)' : 'rgba(212,212,224,0.58)' }}>
        {prerequisites.blockBody}
      </Text>
      <View className="flex-row items-center mt-auto pt-4" style={{ opacity: isChecking ? 0.62 : 1 }}>
        <Text className="text-[12px] font-semibold" style={{ color: gold }}>
          {prerequisites.actionLabel}
        </Text>
        <ChevronRight size={14} color={gold} />
      </View>
    </TouchableOpacity>
  );
};

export const InterviewStrategy = ({
  onReady,
  careerPrerequisites,
}: {
  onReady?: () => void;
  careerPrerequisites?: DashboardCareerFeaturePrerequisites;
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const { isLight, theme } = useThemeMode();
  const [isPremium, setIsPremium] = useState(careerPrerequisites?.isPremium === true);
  const [hasResolvedPlan, setHasResolvedPlan] = useState(careerPrerequisites?.isPremium !== null && careerPrerequisites?.isPremium !== undefined);
  const [isInterviewEnabled, setIsInterviewEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [slots, setSlots] = useState<InterviewSlotRow[]>([]);
  const [insightText, setInsightText] = useState(DEFAULT_INTERVIEW_INSIGHT);
  const hasSignaledReadyRef = useRef(false);
  const hasTrackedViewRef = useRef(false);
  const isPrerequisiteChecking = Boolean(
    careerPrerequisites?.isChecking && !careerPrerequisites.isReadyForCareerFeatures
  );
  const isPrerequisiteBlocked = Boolean(
    careerPrerequisites && !careerPrerequisites.isReadyForCareerFeatures && !isPrerequisiteChecking
  );

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (careerPrerequisites && !careerPrerequisites.isReadyForCareerFeatures) {
        if (careerPrerequisites.isPremium !== null) {
          setIsPremium(careerPrerequisites.isPremium);
          setHasResolvedPlan(true);
        }
        setSlots([]);
        setInsightText('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const session = await ensureAuthSession();
        const premium = session.user.subscriptionTier === 'premium';
        if (!mounted) return;
        setIsPremium(premium);
        setHasResolvedPlan(true);
        if (!premium) return;

        try {
          const { payload } = await syncInterviewStrategyPlan({ autoEnable: true });
          if (!mounted) return;
          setIsInterviewEnabled(payload.settings.enabled);
          if (!payload.settings.enabled) {
            setSlots([]);
            setInsightText('');
            return;
          }

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
            setSlots([]);
            setInsightText(NO_INTERVIEW_WINDOWS_INSIGHT);
          }
        } catch (error) {
          if (!mounted) return;
          if (error instanceof ApiError && error.status === 403) {
            setIsPremium(false);
            return;
          }
          setSlots([]);
          setInsightText(NO_INTERVIEW_WINDOWS_INSIGHT);
        }
      } catch {
        if (mounted) {
          setIsPremium(false);
          setHasResolvedPlan(true);
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
  }, [careerPrerequisites?.isPremium, careerPrerequisites?.isReadyForCareerFeatures]);

  useEffect(() => {
    if (!isLoading && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [isLoading, onReady]);

  useEffect(() => {
    if (isLoading || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    trackAnalyticsEvent('interview_strategy_dashboard_card_viewed', {
      isPremium,
      isInterviewEnabled,
      slotCount: slots.length,
    });
    if (isPremium && isInterviewEnabled && slots.length === 0) {
      trackAnalyticsEvent('interview_strategy_no_slots_shown', {
        source: 'dashboard',
      });
    }
  }, [isInterviewEnabled, isLoading, isPremium, slots.length]);

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
  const handleOpenPremium = () => navigation.navigate('PremiumPurchase');
  const handleOpenFullCalendar = () => navigation.navigate('Settings');
  const handleOpenNatalChart = () => navigation.navigate('NatalChart');
  const shouldShowLoadingCard = isPrerequisiteChecking || (!hasResolvedPlan && !isPrerequisiteBlocked) || (isPremium && isLoading);
  const shouldDisableManage = shouldShowLoadingCard || isPrerequisiteBlocked;

  if (isPremium && !isLoading && !isInterviewEnabled) {
    return null;
  }

  return (
    <View className="px-5 py-3">
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text
          className="text-[13px] font-semibold"
          style={{ color: isLight ? 'rgba(126,114,98,0.72)' : 'rgba(255,255,255,0.48)' }}
        >
          Interview Strategy
        </Text>
        {isPremium && !shouldDisableManage ? (
          <Pressable onPress={handleOpenFullCalendar} className="flex-row items-center">
            <Text className="text-[11px] font-semibold" style={{ color: 'rgba(201,168,76,0.92)' }}>
              Manage
            </Text>
            <ChevronRight size={13} color="rgba(201,168,76,0.92)" />
          </Pressable>
        ) : isPremium ? (
          <View className="flex-row items-center">
            <Text className="text-[10px] font-semibold" style={{ color: theme.colors.gold, opacity: 0.68 }}>
              Preparing
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Lock size={10} color={theme.colors.gold} opacity={0.5} />
            <Text className="text-[10px] font-semibold ml-1" style={{ color: theme.colors.gold, opacity: 0.68 }}>
              Premium
            </Text>
          </View>
        )}
      </View>

      {shouldShowLoadingCard ? (
        <LoadingInterviewCard isLight={isLight} />
      ) : isPrerequisiteBlocked && (isPremium || careerPrerequisites?.isPremium === null) && careerPrerequisites ? (
        <BlockedInterviewCard
          prerequisites={careerPrerequisites}
          onPress={handleOpenNatalChart}
          isLight={isLight}
          gold={theme.colors.gold}
        />
      ) : isPremium ? (
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isLight ? 'rgba(180,151,103,0.24)' : 'rgba(255,255,255,0.1)',
            backgroundColor: isLight ? 'rgba(255,252,246,0.72)' : 'rgba(255,255,255,0.045)',
            padding: 14,
          }}
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-8 h-8 rounded-[10px] items-center justify-center mr-2.5"
              style={{
                backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.08)',
                borderColor: isLight ? 'rgba(172,140,86,0.24)' : 'rgba(201,168,76,0.18)',
                borderWidth: 1,
              }}
            >
              <CalendarClock size={15} color={theme.colors.gold} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold" style={{ color: isLight ? 'rgba(64,55,45,0.94)' : 'rgba(240,240,248,0.92)' }}>
                Upcoming interview windows
              </Text>
              <Text className="text-[12px] mt-0.5" style={{ color: isLight ? 'rgba(129,116,97,0.78)' : 'rgba(212,212,224,0.52)' }}>
                Stronger days for interviews and follow-ups
              </Text>
            </View>
          </View>

          <View>
            {topSlots.length > 0 ? topSlots.map((slot) => {
                const isTopSlot = slot.id === topPickSlotId;
                const tone = resolveInterviewStrategyScoreTone(slot.score, { isTopPick: isTopSlot });
                const timingLabel = resolveInterviewStrategyTimingLabel(slot.score, { isTopPick: isTopSlot });
                return (
                  <View
                    key={slot.id}
                    className="rounded-[12px] px-3 py-2.5 mb-2.5"
                    style={{
                      backgroundColor: tone.background,
                      borderColor: tone.border,
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-1.5 h-8 rounded-full mr-2.5"
                        style={{
                          backgroundColor: tone.accent,
                          shadowColor: tone.accent,
                          shadowOpacity: isLight ? 0.12 : isTopSlot ? 0.45 : 0.16,
                          shadowRadius: isTopSlot ? 6 : 2,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-[14px] font-semibold"
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
                          className="px-2 py-0.5 rounded-[8px]"
                          style={{
                            backgroundColor: `${tone.accent}22`,
                            borderWidth: 1,
                            borderColor: `${tone.accent}66`,
                          }}
                        >
                          <Text className="text-[11px] font-semibold" style={{ color: tone.accent }}>
                            {timingLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }) : (
                <View
                  className="rounded-[12px] px-3 py-3 mb-2.5"
                  style={{
                    backgroundColor: isLight ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.035)',
                    borderColor: isLight ? 'rgba(172,140,86,0.22)' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className="text-[14px] font-semibold"
                    style={{ color: isLight ? 'rgba(65,57,46,0.95)' : 'rgba(233,233,242,0.94)' }}
                  >
                    {NO_INTERVIEW_WINDOWS_TITLE}
                  </Text>
                  <Text
                    className="text-[12px] mt-1 leading-[18px]"
                    style={{ color: isLight ? 'rgba(129,116,97,0.86)' : 'rgba(212,212,224,0.58)' }}
                  >
                    {NO_INTERVIEW_WINDOWS_INSIGHT}
                  </Text>
                </View>
              )}
          </View>

          {topSlots.length > 0 ? (
            <View className="flex-row mt-1.5">
              <Sparkles size={13} color={theme.colors.gold} style={{ marginTop: 2, marginRight: 7 }} />
              <Text className="text-[12px] leading-[18px] flex-1" style={{ color: isLight ? 'rgba(96,82,58,0.84)' : 'rgba(212,212,224,0.6)' }}>
                {insightText}
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <Text className="text-[10px] mt-2" style={{ color: isLight ? 'rgba(129,116,97,0.76)' : 'rgba(212,212,224,0.46)' }}>
              Preparing interview windows...
            </Text>
          ) : null}
        </View>
      ) : (
        <LockedInterviewCard onPress={handleOpenPremium} isLight={isLight} gold={theme.colors.gold} />
      )}
    </View>
  );
};
