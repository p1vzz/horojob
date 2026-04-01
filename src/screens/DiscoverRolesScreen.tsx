import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Sparkles, Search } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { fetchDiscoverRoles } from '../services/astrologyApi';
import type { AppNavigationProp } from '../types/navigation';
import { useThemeMode } from '../theme/ThemeModeProvider';

type RecommendedRoleCard = {
  slug: string;
  role: string;
  score: string;
  scoreColor: string;
  scoreBg: string;
  description: string;
  tags: string[];
};

type SearchRoleItem = {
  slug: string;
  role: string;
  field: string;
  score: string;
};

const { width, height } = Dimensions.get('window');

function scoreTone(score: number) {
  if (score >= 90) {
    return {
      scoreColor: '#38CC88',
      scoreBg: 'rgba(56,204,136,0.16)',
    };
  }
  if (score >= 80) {
    return {
      scoreColor: '#C9A84C',
      scoreBg: 'rgba(201,168,76,0.18)',
    };
  }
  return {
    scoreColor: '#8C7CFF',
    scoreBg: 'rgba(140,124,255,0.18)',
  };
}

function mapApiError(error: unknown) {
  if (error instanceof ApiError && typeof (error.payload as any)?.error === 'string') {
    return (error.payload as any).error as string;
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Unable to load role recommendations right now.';
}

export const DiscoverRolesScreen = () => {
  const { theme } = useThemeMode();

  const navigation = useNavigation<AppNavigationProp<'DiscoverRoles'>>();
  const [query, setQuery] = useState('');
  const [revealedScores, setRevealedScores] = useState<Record<string, boolean>>({});
  const [recommendedRoles, setRecommendedRoles] = useState<RecommendedRoleCard[]>([]);
  const [searchRoles, setSearchRoles] = useState<SearchRoleItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const explorerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(explorerAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, listAnim, explorerAnim]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsInitialLoading(true);
      try {
        await ensureAuthSession();
        const payload = await fetchDiscoverRoles({ limit: 5, searchLimit: 20 });
        if (cancelled) return;
        setRecommendedRoles(
          payload.recommended.map((item) => {
            const tone = scoreTone(item.score);
            return {
              slug: item.slug,
              role: item.title,
              score: item.scoreLabel,
              scoreColor: tone.scoreColor,
              scoreBg: tone.scoreBg,
              description: item.reason,
              tags: item.tags.slice(0, 2),
            };
          })
        );
        setErrorText(null);
      } catch (error) {
        if (cancelled) return;
        setRecommendedRoles([]);
        setErrorText(mapApiError(error));
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    setRevealedScores({});

    if (normalized.length < 3) {
      setSearchRoles([]);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        await ensureAuthSession();
        const payload = await fetchDiscoverRoles({
          query: normalized,
          limit: 5,
          searchLimit: 20,
        });
        if (cancelled) return;
        setSearchRoles(
          payload.search.map((item) => ({
            slug: item.slug,
            role: item.title,
            field: item.domain,
            score: item.scoreLabel,
          }))
        );
        setErrorText(null);
      } catch (error) {
        if (cancelled) return;
        setSearchRoles([]);
        setErrorText(mapApiError(error));
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const showDropdown = query.trim().length >= 3;

  const getFadeUpStyle = (value: Animated.Value, fromY: number) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
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
              id="discoverGradTop"
              cx="45%"
              cy="-5%"
              rx="70%"
              ry="50%"
              fx="45%"
              fy="-5%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(56,204,136,0.34)" stopOpacity="0.34" />
              <Stop offset="55%" stopColor="rgba(56,204,136,0.08)" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="discoverGradBottom"
              cx="82%"
              cy="108%"
              rx="66%"
              ry="46%"
              fx="82%"
              fy="108%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(90,58,204,0.15)" stopOpacity="0.15" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.05)" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#discoverGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#discoverGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-5 pt-2">
            <Animated.View className="flex-row items-center mb-5" style={getFadeUpStyle(headerAnim, -10)}>
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
              <Text className="text-[24px] font-semibold tracking-tight" style={{ color: 'rgba(233,233,242,0.96)' }}>
                Discover Roles
              </Text>
            </Animated.View>

            {errorText ? (
              <Text className="mb-4 text-[12px]" style={{ color: '#FF9FB4' }}>
                {errorText}
              </Text>
            ) : null}

            <Animated.View style={getFadeUpStyle(listAnim, 14)}>
              <View className="flex-row items-center mb-3 px-1">
                <Sparkles size={13} color="#C9A84C" />
                <Text className="text-[13px] font-semibold ml-2" style={{ color: 'rgba(212,212,224,0.78)' }}>
                  Recommended for You
                </Text>
              </View>

              <View className="gap-3">
                {isInitialLoading ? (
                  <View
                    className="rounded-[18px] p-4"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-[13px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
                      Loading role recommendations...
                    </Text>
                  </View>
                ) : recommendedRoles.length === 0 ? (
                  <View
                    className="rounded-[18px] p-4"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-[13px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
                      No recommendations yet. Open your natal chart once and try again.
                    </Text>
                  </View>
                ) : (
                  recommendedRoles.map((item) => (
                    <View
                      key={item.slug}
                      className="rounded-[18px] p-4"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                      }}
                    >
                      <View className="flex-row items-center mb-2">
                        <Text className="text-[13px] font-semibold flex-1" style={{ color: 'rgba(240,240,248,0.95)' }}>
                          {item.role}
                        </Text>
                        <View
                          className="px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: item.scoreBg }}
                        >
                          <Text className="text-[11px] font-bold" style={{ color: item.scoreColor }}>
                            {item.score}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[12px] leading-[18px] mb-2" style={{ color: 'rgba(212,212,224,0.55)' }}>
                        {item.description}
                      </Text>
                      <View className="flex-row gap-2">
                        {item.tags.map((tag) => (
                          <View
                            key={`${item.slug}-${tag}`}
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              borderColor: 'rgba(255,255,255,0.05)',
                              borderWidth: 1,
                            }}
                          >
                            <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.35)' }}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </Animated.View>

            <Animated.View className="mt-4" style={getFadeUpStyle(explorerAnim, 16)}>
              <View
                className="rounded-[14px] px-4 py-3 flex-row items-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                }}
              >
                <Search size={14} color="#5A3ACC" />
                <Text className="text-[13px] font-semibold ml-2 flex-1" style={{ color: 'rgba(233,233,242,0.94)' }}>
                  Explore All Professions
                </Text>
              </View>

              <View className="mt-2">
                <View
                  className="rounded-[14px] px-3 py-2.5 flex-row items-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                  }}
                >
                  <Search size={14} color="rgba(212,212,224,0.35)" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search professions..."
                    placeholderTextColor="rgba(212,212,224,0.35)"
                    className="ml-2 flex-1 text-[13px]"
                    style={{ color: 'rgba(233,233,242,0.94)' }}
                  />
                </View>

                {showDropdown && (
                  <View
                    className="rounded-[14px] overflow-hidden mt-2"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.07)',
                      borderWidth: 1,
                    }}
                  >
                    {isSearchLoading ? (
                      <Text className="px-4 py-4 text-[13px]" style={{ color: 'rgba(212,212,224,0.45)' }}>
                        Searching roles...
                      </Text>
                    ) : searchRoles.length === 0 ? (
                      <Text className="px-4 py-4 text-[13px]" style={{ color: 'rgba(212,212,224,0.45)' }}>
                        No matching professions.
                      </Text>
                    ) : (
                      searchRoles.map((item, idx) => {
                        const showScore = idx === 0 || Boolean(revealedScores[item.slug]);
                        return (
                          <View
                            key={item.slug}
                            className="px-4 py-3 flex-row items-center"
                            style={{
                              borderBottomWidth: idx === searchRoles.length - 1 ? 0 : 1,
                              borderBottomColor: 'rgba(255,255,255,0.05)',
                            }}
                          >
                            <View className="flex-1">
                              <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
                                {item.role}
                              </Text>
                              <Text className="text-[11px]" style={{ color: 'rgba(212,212,224,0.38)' }}>
                                {item.field}
                              </Text>
                            </View>

                            {showScore ? (
                              <View
                                className="px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(56,204,136,0.16)' }}
                              >
                                <Text className="text-[11px] font-bold" style={{ color: '#38CC88' }}>
                                  {item.score}
                                </Text>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() =>
                                  setRevealedScores((prev) => ({ ...prev, [item.slug]: true }))
                                }
                                className="px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(90,58,204,0.2)' }}
                              >
                                <Text className="text-[11px] font-semibold" style={{ color: '#8C7CFF' }}>
                                  Check
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
