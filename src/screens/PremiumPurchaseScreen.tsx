import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Crown, Sparkles, Sun, TrendingUp, Orbit, Bell, CalendarDays, Moon, Shield, Lock } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { ensureAuthSession, updateCurrentSessionUser } from '../services/authSession';
import { syncRevenueCatSubscription } from '../services/billingApi';
import {
  configureRevenueCatForUser,
  getMainRevenueCatOffering,
  hasPremiumRevenueCatEntitlement,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '../services/revenueCat';
import { syncMorningBriefingCache } from '../services/morningBriefingSync';
import { useThemeMode } from '../theme/ThemeModeProvider';
import type { AppNavigationProp } from '../types/navigation';
import {
  mapPackageToPlan,
  normalizePreviewSegments,
  sortPackages,
  type NormalizedPremiumPreviewSegment,
  type PremiumPackageTypes,
  type PremiumPlan,
} from './premiumPurchaseScreenCore';

type Plan = PremiumPlan<PurchasesPackage>;

const FEATURES = [
  {
    title: 'Morning Career Briefing',
    description: 'Start each day with personalized astrological career insights right on your home screen.',
    badge: 'Widget',
    Icon: Sun,
    iconColor: '#E6D96B',
    iconBg: 'rgba(230,217,107,0.14)',
    badgeBg: 'rgba(230,217,107,0.16)',
    badgeColor: '#E6D96B',
  },
  {
    title: 'Personal Career Roadmap',
    description: 'Level up your skills as planets move. Collect cosmic buffs and track your career XP.',
    badge: 'Gamification',
    Icon: TrendingUp,
    iconColor: '#4BD1A0',
    iconBg: 'rgba(75,209,160,0.14)',
    badgeBg: 'rgba(75,209,160,0.16)',
    badgeColor: '#4BD1A0',
  },
  {
    title: 'Full Career Blueprint',
    description: 'Unlock a structured career report with archetypes, role fit, blind spots, and a 90-day plan.',
    badge: 'Deep Report',
    Icon: Orbit,
    iconColor: '#8861FF',
    iconBg: 'rgba(136,97,255,0.14)',
    badgeBg: 'rgba(136,97,255,0.16)',
    badgeColor: '#9B7EFF',
  },
  {
    title: 'Burnout Alert System',
    description: 'Get notified when planetary transits suggest you should slow down and recharge.',
    badge: 'Smart Alerts',
    Icon: Bell,
    iconColor: '#FF6B8A',
    iconBg: 'rgba(255,107,138,0.14)',
    badgeBg: 'rgba(255,107,138,0.16)',
    badgeColor: '#FF7894',
  },
  {
    title: 'Interview Strategy',
    description: 'Fill your calendar with lucky days for interviews based on your natal chart.',
    badge: 'Calendar Sync',
    Icon: CalendarDays,
    iconColor: '#E6D96B',
    iconBg: 'rgba(230,217,107,0.14)',
    badgeBg: 'rgba(230,217,107,0.16)',
    badgeColor: '#E6D96B',
  },
  {
    title: '10 Daily Job Checks',
    description: 'Run up to 10 successful job checks per day with compatibility, AI risk, and factor breakdown.',
    badge: '10/day',
    Icon: Shield,
    iconColor: '#65B8FF',
    iconBg: 'rgba(101,184,255,0.14)',
    badgeBg: 'rgba(101,184,255,0.16)',
    badgeColor: '#65B8FF',
  },
  {
    title: 'Lunar Productivity',
    description: 'Get lunar guidance that tells you when to protect deep work and when to use your strongest focus window.',
    badge: 'Lunar Alerts',
    Icon: Moon,
    iconColor: '#F5F7FF',
    iconBg: 'rgba(245,247,255,0.14)',
    badgeBg: 'rgba(245,247,255,0.16)',
    badgeColor: '#F5F7FF',
  },
];

const AI_INSIGHT_SEGMENTS = normalizePreviewSegments([
  { label: 'Cognitive Flow', value: 31, color: '#79D99C' },
  { label: 'Automation', value: 30, color: '#35BEE8' },
  { label: 'Decisions', value: 23, color: '#5C46D4' },
  { label: 'AI Collab', value: 16, color: '#E6D96B' },
]);

const DEEP_REPORT_ROWS = [
  {
    title: 'Archetype evidence',
    detail: '3-4 scored career archetypes tied to chart signals.',
    accent: '#79D99C',
  },
  {
    title: 'Role-fit matrix',
    detail: 'Five practical domains with fit scores and example roles.',
    accent: '#35BEE8',
  },
  {
    title: 'Blind spots',
    detail: 'Three risks with mitigation, not vague warning copy.',
    accent: '#E6D96B',
  },
  {
    title: 'Phase plan',
    detail: '0-6, 6-18, and 18-36 month actions with KPIs.',
    accent: '#5C46D4',
  },
];

const AI_INSIGHT_POINTS = [
  'Daily AI synergy from cognitive flow and automation readiness',
  'Premium career insights with five strategy notes and actions',
  "Drivers, cautions, and action priorities for today's work",
];

const { width, height } = Dimensions.get('window');

const PACKAGE_TYPES: PremiumPackageTypes<PACKAGE_TYPE> = {
  ANNUAL: PACKAGE_TYPE.ANNUAL,
  MONTHLY: PACKAGE_TYPE.MONTHLY,
  SIX_MONTH: PACKAGE_TYPE.SIX_MONTH,
  THREE_MONTH: PACKAGE_TYPE.THREE_MONTH,
  TWO_MONTH: PACKAGE_TYPE.TWO_MONTH,
  WEEKLY: PACKAGE_TYPE.WEEKLY,
  LIFETIME: PACKAGE_TYPE.LIFETIME,
  CUSTOM: PACKAGE_TYPE.CUSTOM,
  UNKNOWN: PACKAGE_TYPE.UNKNOWN,
};

const PACKAGE_ORDER: PACKAGE_TYPE[] = [
  PACKAGE_TYPES.ANNUAL,
  PACKAGE_TYPES.MONTHLY,
  PACKAGE_TYPES.SIX_MONTH,
  PACKAGE_TYPES.THREE_MONTH,
  PACKAGE_TYPES.TWO_MONTH,
  PACKAGE_TYPES.WEEKLY,
  PACKAGE_TYPES.LIFETIME,
  PACKAGE_TYPES.CUSTOM,
  PACKAGE_TYPES.UNKNOWN,
];

function polarPoint(center: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function describeDonutSlice(center: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) {
  const outerStart = polarPoint(center, outerRadius, startAngle);
  const outerEnd = polarPoint(center, outerRadius, endAngle);
  const innerStart = polarPoint(center, innerRadius, startAngle);
  const innerEnd = polarPoint(center, innerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function PremiumRadialChart({ segments }: { segments: NormalizedPremiumPreviewSegment[] }) {
  const center = 78;
  const baseOuterRadius = 38;
  const innerRadius = 17;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;

  return (
    <View className="items-center">
      <Svg width={156} height={156} viewBox="0 0 156 156">
        <G>
          {segments.map((segment) => {
            const sweep = total > 0 ? (segment.value / total) * 360 : 0;
            const rawStart = cursor;
            const rawEnd = cursor + sweep;
            const start = rawStart + 1.4;
            const end = rawEnd - 1.4;
            const mid = start + (end - start) / 2;
            const outerRadius = baseOuterRadius + segment.percentage * 0.72;
            cursor = rawEnd;
            const labelPoint = polarPoint(center, outerRadius + 13, mid);

            return (
              <G key={segment.label}>
                <Path
                  d={describeDonutSlice(center, outerRadius, innerRadius, start, end)}
                  fill={segment.color}
                  opacity={0.9}
                />
                <SvgText
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill="rgba(240,240,248,0.86)"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {segment.percentage}%
                </SvgText>
              </G>
            );
          })}
          <Circle cx={center} cy={center} r={innerRadius + 1} fill="#0C0C18" />
        </G>
      </Svg>
      <View className="flex-row flex-wrap justify-center mt-0.5 px-1">
        {segments.map((segment) => (
          <View
            key={segment.label}
            className="flex-row items-center justify-center mb-1"
            style={{ width: '50%' }}
          >
            <View className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: segment.color }} />
            <Text className="text-[9px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
              {segment.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PremiumPointList({ points }: { points: string[] }) {
  return (
    <View className="mt-4">
      {points.map((point) => (
        <View key={point} className="flex-row items-start mb-2">
          <View style={{ width: 12, alignItems: 'center', paddingTop: 6, marginRight: 6 }}>
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E6D96B' }} />
          </View>
          <Text className="text-[11px] leading-[16px] flex-1" style={{ color: 'rgba(226,226,238,0.72)' }}>
            {point}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PremiumReportPanel() {
  return (
    <View
      className="rounded-[8px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-[10px] tracking-[2px] font-semibold uppercase" style={{ color: 'rgba(212,212,224,0.42)' }}>
            Deep Reports
          </Text>
          <Text className="text-[16px] font-semibold mt-1 leading-[22px]" style={{ color: 'rgba(240,240,248,0.96)' }}>
            Full Career Blueprint
          </Text>
        </View>
        <Sparkles size={16} color="#E6D96B" />
      </View>

      <Text className="text-[12px] leading-[18px] mb-4" style={{ color: 'rgba(212,212,224,0.62)' }}>
        A structured premium report turns your natal chart into career archetypes, role-fit evidence, blind spots, phase planning, and next-step strategy.
      </Text>

      <View className="flex-row mb-3">
        {[
          { value: '5', label: 'role-fit domains' },
          { value: '3', label: 'career phases' },
          { value: '90', label: 'day action plan' },
        ].map((stat, index) => (
          <View
            key={stat.label}
            className="flex-1 rounded-[8px] px-2 py-2"
            style={{
              marginRight: index === 2 ? 0 : 8,
              backgroundColor: 'rgba(230,217,107,0.08)',
              borderColor: 'rgba(230,217,107,0.16)',
              borderWidth: 1,
            }}
          >
            <Text className="text-[18px] font-bold" style={{ color: '#E6D96B' }}>
              {stat.value}
            </Text>
            <Text className="text-[9px] leading-[13px]" style={{ color: 'rgba(212,212,224,0.58)' }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View>
        {DEEP_REPORT_ROWS.map((row, index) => (
          <View
            key={row.title}
            className="flex-row items-start py-2"
            style={{
              borderTopColor: index === 0 ? 'transparent' : 'rgba(255,255,255,0.06)',
              borderTopWidth: index === 0 ? 0 : 1,
            }}
          >
            <View
              className="w-1.5 rounded-full mr-3 mt-1"
              style={{ height: 28, backgroundColor: row.accent }}
            />
            <View className="flex-1">
              <Text className="text-[12px] font-semibold" style={{ color: 'rgba(236,236,246,0.92)' }}>
                {row.title}
              </Text>
              <Text className="text-[10px] leading-[15px] mt-0.5" style={{ color: 'rgba(212,212,224,0.58)' }}>
                {row.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PremiumAiInsightPanel({
  stats,
  points,
}: {
  stats: Array<{ value: string; label: string }>;
  points: string[];
}) {
  return (
    <View
      className="rounded-[8px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-[10px] tracking-[2px] font-semibold uppercase" style={{ color: 'rgba(212,212,224,0.42)' }}>
            AI Insights
          </Text>
          <Text className="text-[16px] font-semibold mt-1 leading-[22px]" style={{ color: 'rgba(240,240,248,0.96)' }}>
            AI Work Strategy
          </Text>
        </View>
        <Sparkles size={16} color="#E6D96B" />
      </View>

      <Text className="text-[12px] leading-[18px] mb-4" style={{ color: 'rgba(212,212,224,0.62)' }}>
        Daily AI synergy blends cognitive flow, automation readiness, decision quality, and collaboration signals into practical work guidance.
      </Text>

      <View className="flex-row items-center">
        <View style={{ width: 156, marginRight: 8 }}>
          <PremiumRadialChart segments={AI_INSIGHT_SEGMENTS} />
        </View>
        <View className="flex-1">
          {stats.map((stat) => (
            <View key={stat.label} className="mb-2">
              <Text className="text-[18px] font-bold" style={{ color: '#E6D96B' }}>
                {stat.value}
              </Text>
              <Text className="text-[10px] leading-[14px]" style={{ color: 'rgba(212,212,224,0.56)' }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PremiumPointList points={points} />
    </View>
  );
}

export const PremiumPurchaseScreen = () => {
  const { theme } = useThemeMode();

  const navigation = useNavigation<AppNavigationProp<'PremiumPurchase'>>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offeringsReloadToken, setOfferingsReloadToken] = useState(0);
  const heroEntry = useRef(new Animated.Value(0)).current;
  const featureEntries = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const planEntries = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const ctaEntry = useRef(new Animated.Value(0)).current;
  const footerEntry = useRef(new Animated.Value(0)).current;
  const planPulse = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const queue: Animated.CompositeAnimation[] = [
      Animated.timing(heroEntry, {
        toValue: 1,
        duration: 360,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      ...featureEntries.map((entry) =>
        Animated.timing(entry, {
          toValue: 1,
          duration: 330,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        })
      ),
      ...planEntries.map((entry) =>
        Animated.timing(entry, {
          toValue: 1,
          duration: 320,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        })
      ),
      Animated.timing(ctaEntry, {
        toValue: 1,
        duration: 340,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(footerEntry, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];
    Animated.stagger(65, queue).start();
  }, [heroEntry, featureEntries, planEntries, ctaEntry, footerEntry]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(planPulse, {
          toValue: 1,
          duration: 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(planPulse, {
          toValue: 0,
          duration: 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [planPulse]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [ctaPulse]);

  useEffect(() => {
    let mounted = true;
    const loadOfferings = async () => {
      setIsLoadingPlans(true);
      setPlansError(null);

      try {
        const session = await ensureAuthSession();
        const configured = await configureRevenueCatForUser(session.user.id);
        if (!configured) {
          throw new Error('RevenueCat is not configured for this platform.');
        }

        const offering = await getMainRevenueCatOffering();
        if (!offering || offering.availablePackages.length === 0) {
          throw new Error('No subscription packages found in RevenueCat offering.');
        }

        const mappedPlans = sortPackages(offering.availablePackages, PACKAGE_ORDER).map((pkg) =>
          mapPackageToPlan(pkg, PACKAGE_TYPES)
        );
        if (!mounted) return;
        setPlans(mappedPlans);
        setSelectedPlanId((prev) => {
          if (prev && mappedPlans.some((plan) => plan.id === prev)) {
            return prev;
          }
          return mappedPlans[0]?.id ?? null;
        });
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load subscription plans.';
        setPlansError(message);
        setPlans([]);
        setSelectedPlanId(null);
      } finally {
        if (mounted) setIsLoadingPlans(false);
      }
    };

    void loadOfferings();

    return () => {
      mounted = false;
    };
  }, [offeringsReloadToken]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const runSubscriptionSync = async () => {
    const synced = await syncRevenueCatSubscription();
    await updateCurrentSessionUser(synced.user);
    await syncMorningBriefingCache({ refresh: true }).catch(() => {
      // Premium widget sync can fail independently from subscription activation.
    });
    return synced;
  };

  const handlePurchase = () => {
    if (!selectedPlan || isPurchasing || isRestoring || isLoadingPlans) return;

    void (async () => {
      setIsPurchasing(true);
      try {
        const customerInfo = await purchaseRevenueCatPackage(selectedPlan.package);
        const synced = await runSubscriptionSync();
        const hasEntitlement = hasPremiumRevenueCatEntitlement(customerInfo);
        if (synced.subscription.tier !== 'premium' && !hasEntitlement) {
          Alert.alert('Purchase Pending', 'Purchase completed, but premium access is still syncing. Please retry in a moment.');
          return;
        }
        Alert.alert(
          'Premium Activated',
          'Your premium subscription is active now. Add the Morning Career Briefing widget to keep today\'s plan on your home screen.',
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Add Widget',
              onPress: () =>
                navigation.navigate('Settings', {
                  openWidgetSetup: true,
                  widgetSetupKey: Date.now(),
                }),
            },
          ],
        );
      } catch (error) {
        if ((error as { userCancelled?: boolean })?.userCancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Purchase failed. Please try again.';
        Alert.alert('Purchase Failed', message);
      } finally {
        setIsPurchasing(false);
      }
    })();
  };

  const handleRestore = () => {
    if (isRestoring || isPurchasing) return;
    void (async () => {
      setIsRestoring(true);
      try {
        await restoreRevenueCatPurchases();
        const synced = await runSubscriptionSync();
        if (synced.subscription.tier === 'premium') {
          Alert.alert('Purchases Restored', 'Premium access has been restored for this account.');
          navigation.goBack();
          return;
        }
        Alert.alert('Nothing To Restore', 'No active premium purchases were found for this account.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Restore failed. Please try again.';
        Alert.alert('Restore Failed', message);
      } finally {
        setIsRestoring(false);
      }
    })();
  };

  const selectedPlanScale = planPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const selectedPlanGlow = planPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.95],
  });

  const buttonGlowScale = ctaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.15],
  });

  const buttonGlowOpacity = ctaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const getStickStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [1.03, 1],
        }),
      },
    ],
  });

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient
              id="premiumGradTop"
              cx="42%"
              cy="-5%"
              rx="70%"
              ry="50%"
              fx="42%"
              fy="-5%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(201,168,76,0.32)" stopOpacity="0.32" />
              <Stop offset="50%" stopColor="rgba(201,168,76,0.09)" stopOpacity="0.09" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="premiumGradBottom"
              cx="84%"
              cy="106%"
              rx="68%"
              ry="48%"
              fx="84%"
              fy="106%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(90,58,204,0.34)" stopOpacity="0.34" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.09)" stopOpacity="0.09" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#premiumGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#premiumGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 430,
              alignSelf: 'center',
            }}
            className="px-5 pt-2"
          >
            <View className="flex-row items-center mb-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <ChevronLeft size={18} color="rgba(212,212,224,0.75)" />
              </Pressable>
              <View className="flex-row items-center">
                <Crown size={14} color="#E6D96B" />
                <Text
                  className="text-[15px] font-semibold ml-2 tracking-tight"
                  style={{ color: 'rgba(233,233,242,0.96)' }}
                >
                  Go Premium
                </Text>
              </View>
            </View>

            <Animated.View style={getStickStyle(heroEntry)}>
              <View
                className="rounded-[22px] p-6 mb-5 items-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                }}
              >
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{
                    backgroundColor: 'rgba(230,217,107,0.12)',
                    borderColor: 'rgba(230,217,107,0.28)',
                    borderWidth: 1,
                    shadowColor: '#E6D96B',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <Sparkles size={22} color="#E6D96B" />
                </View>
                <Text
                  className="text-[21px] font-semibold text-center leading-[30px] tracking-tight"
                  style={{ color: '#F3E8AE' }}
                >
                  Unlock Your Full Potential
                </Text>
                <Text
                  className="text-[13px] mt-2 text-center leading-[20px]"
                  style={{ color: 'rgba(212,212,224,0.62)' }}
                >
                  Get 10 daily job checks, deeper career reports, AI work guidance, and premium planning tools.
                </Text>
              </View>
            </Animated.View>

            <Text
              className="text-[11px] tracking-[2.4px] font-semibold mb-2 px-1"
              style={{ color: 'rgba(212,212,224,0.38)' }}
            >
              WHAT YOU GET
            </Text>

            <View className="gap-3">
              {FEATURES.map((feature, index) => (
                <Animated.View key={feature.title} style={getStickStyle(featureEntries[index])}>
                  <View
                    className="rounded-[18px] p-4"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="w-10 h-10 rounded-[12px] items-center justify-center mr-3"
                        style={{ backgroundColor: feature.iconBg }}
                      >
                        <feature.Icon size={18} color={feature.iconColor} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text
                            className="text-[13px] font-semibold leading-[20px] mr-2"
                            style={{ color: 'rgba(240,240,248,0.95)' }}
                          >
                            {feature.title}
                          </Text>
                          <View
                            className="rounded-full px-2 py-0.5"
                            style={{ backgroundColor: feature.badgeBg }}
                          >
                            <Text
                              className="text-[11px] font-semibold"
                              style={{ color: feature.badgeColor }}
                            >
                              {feature.badge}
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-[13px] leading-[18px]"
                          style={{ color: 'rgba(212,212,224,0.58)' }}
                        >
                          {feature.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            <View className="mt-6 gap-3">
              <Text
                className="text-[11px] tracking-[2.4px] font-semibold px-1"
                style={{ color: 'rgba(212,212,224,0.38)' }}
              >
                DEEP REPORTS & AI INSIGHTS
              </Text>
              <PremiumReportPanel />
              <PremiumAiInsightPanel
                stats={[
                  { value: '4', label: 'signal components' },
                  { value: '5', label: 'premium insights' },
                  { value: '3x', label: 'actions per insight' },
                ]}
                points={AI_INSIGHT_POINTS}
              />
            </View>

            {plansError ? (
              <View
                className="mt-6 rounded-[16px] px-4 py-3"
                style={{
                  backgroundColor: 'rgba(255,107,138,0.12)',
                  borderColor: 'rgba(255,107,138,0.28)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: '#FF9AB0' }}>
                  {plansError}
                </Text>
                <Pressable
                  onPress={() => setOfferingsReloadToken((value) => value + 1)}
                  className="mt-2 self-start rounded-[10px] px-3 py-1.5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.16)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[11px] font-semibold" style={{ color: 'rgba(240,240,248,0.92)' }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              {plans.map((plan, index) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <Animated.View key={plan.id} style={getStickStyle(planEntries[index % planEntries.length])}>
                    <Animated.View
                      style={
                        isSelected
                          ? {
                              transform: [{ scale: selectedPlanScale }],
                            }
                          : undefined
                      }
                    >
                      <Pressable
                        onPress={() => setSelectedPlanId(plan.id)}
                        className="rounded-[22px] px-4 py-4 overflow-hidden"
                        style={{
                          backgroundColor: isSelected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)',
                          borderColor: isSelected ? 'rgba(230,217,107,0.8)' : 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                        }}
                      >
                        {isSelected && (
                          <Animated.View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              left: -30,
                              right: -30,
                              top: -30,
                              bottom: -30,
                              opacity: selectedPlanGlow,
                            }}
                          >
                            <Svg width="100%" height="100%">
                              <Defs>
                                <RadialGradient id="selectedPlanGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                                  <Stop offset="0%" stopColor="#E6D96B" stopOpacity="0.24" />
                                  <Stop offset="60%" stopColor="#E6D96B" stopOpacity="0.08" />
                                  <Stop offset="100%" stopColor="#E6D96B" stopOpacity="0" />
                                </RadialGradient>
                              </Defs>
                              <Rect width="100%" height="100%" fill="url(#selectedPlanGlow)" />
                            </Svg>
                          </Animated.View>
                        )}

                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 pr-2">
                            <View className="flex-row items-center">
                              <Text
                                className="text-[16px] font-semibold tracking-tight mr-2"
                                style={{ color: 'rgba(242,242,250,0.96)' }}
                              >
                                {plan.title}
                              </Text>
                              {plan.badge && (
                                <View
                                  className="rounded-full px-2 py-0.5"
                                  style={{
                                    backgroundColor:
                                      plan.package.packageType === PACKAGE_TYPE.ANNUAL
                                        ? 'rgba(230,217,107,0.95)'
                                        : 'rgba(156,156,176,0.2)',
                                  }}
                                >
                                  <Text
                                    className="text-[11px] font-semibold"
                                    style={{
                                      color:
                                        plan.package.packageType === PACKAGE_TYPE.ANNUAL
                                          ? '#242014'
                                          : 'rgba(230,230,240,0.65)',
                                    }}
                                  >
                                    {plan.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {!!plan.sublabel && (
                              <Text className="text-[13px] mt-1" style={{ color: '#E6D96B' }}>
                                {plan.sublabel}
                              </Text>
                            )}
                          </View>
                          <View className="flex-row items-end">
                            <Text
                              className="text-[24px] font-bold tracking-tight"
                              style={{ color: 'rgba(242,242,250,0.98)' }}
                            >
                              {plan.price}
                            </Text>
                            {!!plan.suffix && (
                              <Text
                                className="text-[14px] mb-[3px] ml-1"
                                style={{ color: 'rgba(212,212,224,0.65)' }}
                              >
                                {plan.suffix}
                              </Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  </Animated.View>
                );
              })}

              {isLoadingPlans ? (
                <View
                  className="rounded-[22px] px-4 py-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[13px]" style={{ color: 'rgba(212,212,224,0.62)' }}>
                    Loading subscription plans...
                  </Text>
                </View>
              ) : null}
            </View>

            <Animated.View className="mt-5 mb-2" style={getStickStyle(ctaEntry)}>
              <View className="relative items-center justify-center">
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 96,
                    zIndex: 0,
                    transform: [{ scale: buttonGlowScale }],
                    opacity: buttonGlowOpacity,
                  }}
                >
                  <Svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="none">
                    <Defs>
                      <RadialGradient id="premiumScanHalo" cx="50%" cy="50%" rx="45%" ry="45%">
                        <Stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
                        <Stop offset="50%" stopColor="#C9A84C" stopOpacity="0.1" />
                        <Stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="160" height="90" fill="url(#premiumScanHalo)" />
                  </Svg>
                </Animated.View>

                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={!selectedPlan || isLoadingPlans || isPurchasing || isRestoring}
                  activeOpacity={0.9}
                  style={{
                    width: '100%',
                    backgroundColor:
                      !selectedPlan || isLoadingPlans || isPurchasing || isRestoring
                        ? 'rgba(201,168,76,0.45)'
                        : '#C9A84C',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Sparkles size={16} color="#06060C" strokeWidth={3} />
                  <Text style={{ color: '#06060C', fontWeight: '800', marginLeft: 6, fontSize: 14 }}>
                    {isPurchasing
                      ? 'Processing purchase...'
                      : isLoadingPlans
                        ? 'Loading plans...'
                        : selectedPlan
                          ? `Continue with ${selectedPlan.title}`
                          : 'Plans unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View style={getStickStyle(footerEntry)}>
              <Text
                className="text-center text-[13px] mt-2"
                style={{ color: 'rgba(212,212,224,0.5)' }}
              >
                Cancel anytime. No questions asked.
              </Text>
              <View className="flex-row items-center justify-center gap-5 mt-2">
                <View className="flex-row items-center">
                  <Shield size={12} color="rgba(142,147,185,0.65)" />
                  <Text className="text-[12px] ml-1" style={{ color: 'rgba(142,147,185,0.65)' }}>
                    Secure Checkout
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Lock size={12} color="rgba(142,147,185,0.65)" />
                  <Text className="text-[12px] ml-1" style={{ color: 'rgba(142,147,185,0.65)' }}>
                    SSL Encrypted
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleRestore}
                disabled={isRestoring || isPurchasing || isLoadingPlans}
                className="mt-3 self-center px-3 py-1.5 rounded-[10px]"
                style={{
                  opacity: isRestoring || isPurchasing || isLoadingPlans ? 0.6 : 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: 'rgba(212,212,224,0.72)' }}>
                  {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
