import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Crown, Sparkles, Sun, TrendingUp, Orbit, Bell, CalendarDays, Infinity, Moon, Shield, Lock } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
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
  sortPackages,
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
    title: 'Full Natal Chart Analysis',
    description: 'Unlock the complete career natal chart with all planetary positions and house placements.',
    badge: 'Deep Insights',
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
    title: 'Unlimited Scans & Reports',
    description: 'Scan unlimited job postings and get detailed compatibility reports for each.',
    badge: 'No Limits',
    Icon: Infinity,
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
        Alert.alert('Premium Activated', 'Your premium subscription is active now.');
        navigation.goBack();
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
                  Access all premium features and take control of your cosmic career journey.
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
