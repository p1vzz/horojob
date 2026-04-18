import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Sparkles, Search } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { fetchDiscoverRoles } from '../services/astrologyApi';
import { isNatalChartMissingError, syncNatalChartCache } from '../services/natalChartSync';
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
  score: string | null;
};

type SearchInputFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const { width, height } = Dimensions.get('window');
const MATCHMAKER_KEYBOARD_GAP = Platform.OS === 'android' ? 48 : 18;
const MATCHMAKER_MIN_SEARCH_LIFT = Platform.OS === 'android' ? 18 : 8;
const MATCHMAKER_DROPDOWN_MAX_HEIGHT = 260;
const MATCHMAKER_SEARCH_ROW_HEIGHT = 58;
const MATCHMAKER_DROPDOWN_GAP = 0;

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
    const message = (error.payload as any).error as string;
    if (message.includes('Natal chart not found')) {
      return 'Your career map is still being prepared. Try again shortly.';
    }
    if (message.includes('Birth profile not found')) {
      return 'Complete your birth profile to unlock career recommendations.';
    }
    return message;
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Unable to load role recommendations right now.';
}

async function fetchDiscoverRolesWithNatalChartRecovery(options?: Parameters<typeof fetchDiscoverRoles>[0]) {
  try {
    return await fetchDiscoverRoles(options);
  } catch (error) {
    if (!isNatalChartMissingError(error, ApiError)) {
      throw error;
    }

    const syncResult = await syncNatalChartCache();
    if (syncResult.status === 'failed') {
      throw new Error(syncResult.errorText);
    }

    return fetchDiscoverRoles(options);
  }
}

export const DiscoverRolesScreen = () => {
  const { theme } = useThemeMode();

  const navigation = useNavigation<AppNavigationProp<'DiscoverRoles'>>();
  const [query, setQuery] = useState('');
  const [recommendedRoles, setRecommendedRoles] = useState<RecommendedRoleCard[]>([]);
  const [searchRoles, setSearchRoles] = useState<SearchRoleItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [checkingScoreSlug, setCheckingScoreSlug] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInputHeight, setSearchInputHeight] = useState(48);
  const [searchInputFrame, setSearchInputFrame] = useState<SearchInputFrame | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [searchLift, setSearchLift] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const explorerAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const searchFieldRef = useRef<View>(null);
  const searchInputBoxRef = useRef<View>(null);
  const searchInputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);
  const dropdownInteractionRef = useRef(false);
  const checkingScoreSlugRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = event.endCoordinates?.height ?? 0;
      setKeyboardHeight(nextHeight);
      setKeyboardTop(
        typeof event.endCoordinates?.screenY === 'number'
          ? event.endCoordinates.screenY
          : height - nextHeight
      );
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      dropdownInteractionRef.current = false;
      setKeyboardHeight(0);
      setKeyboardTop(null);
      setSearchLift(0);
      setIsSearchFocused(false);
      setSearchInputFrame(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isSearchFocused || keyboardHeight <= 0 || keyboardTop == null) return;

    const timeoutId = setTimeout(() => {
      searchFieldRef.current?.measureInWindow((_x, y, _width, measuredHeight) => {
        const desiredBottom = keyboardTop - MATCHMAKER_KEYBOARD_GAP;
        const overlap = y + measuredHeight - desiredBottom;
        setSearchLift(
          overlap > 0
            ? Math.max(overlap, MATCHMAKER_MIN_SEARCH_LIFT)
            : MATCHMAKER_MIN_SEARCH_LIFT
        );
      });
    }, 180);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSearchFocused, keyboardHeight, keyboardTop]);

  useEffect(() => {
    if (!isSearchFocused) {
      setSearchLift(0);
    }
  }, [isSearchFocused]);

  useEffect(() => {
    checkingScoreSlugRef.current = checkingScoreSlug;
  }, [checkingScoreSlug]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsInitialLoading(true);
      try {
        await ensureAuthSession();
        const payload = await fetchDiscoverRolesWithNatalChartRecovery({ limit: 5, searchLimit: 20 });
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
    setCheckingScoreSlug(null);

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
        const payload = await fetchDiscoverRolesWithNatalChartRecovery({
          query: normalized,
          limit: 5,
          searchLimit: 20,
          deferSearchScores: true,
        });
        if (cancelled) return;
        setSearchRoles(
          payload.search.map((item) => ({
            slug: item.slug,
            role: item.title,
            field: item.domain,
            score: item.scoreLabel ?? null,
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

  const handleSearchInputLayout = (event: LayoutChangeEvent) => {
    setSearchInputHeight(event.nativeEvent.layout.height);
  };

  const beginDropdownInteraction = () => {
    dropdownInteractionRef.current = true;
    setIsSearchFocused(true);
  };

  const endDropdownInteractionSoon = () => {
    if (checkingScoreSlugRef.current) return;
    setTimeout(() => {
      if (!checkingScoreSlugRef.current) {
        dropdownInteractionRef.current = false;
      }
    }, 180);
  };

  const keepSearchModeAfterDropdownTap = () => {
    if (!mountedRef.current) return;
    setIsSearchFocused(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleSearchBlur = () => {
    if (dropdownInteractionRef.current || checkingScoreSlugRef.current) {
      keepSearchModeAfterDropdownTap();
      return;
    }

    setIsSearchFocused(false);
  };

  const dismissSearchDropdown = () => {
    dropdownInteractionRef.current = false;
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleCheckRoleScore = async (slug: string) => {
    const normalized = query.trim();
    if (normalized.length < 3 || checkingScoreSlug) return;

    beginDropdownInteraction();
    setCheckingScoreSlug(slug);
    try {
      await ensureAuthSession();
      const payload = await fetchDiscoverRolesWithNatalChartRecovery({
        query: normalized,
        limit: 5,
        searchLimit: 20,
        deferSearchScores: true,
        scoreSlug: slug,
      });
      if (!mountedRef.current) return;
      const scored = payload.search.find((item) => item.slug === slug);
      if (scored?.scoreLabel) {
        setSearchRoles((current) =>
          current.map((item) => (
            item.slug === slug ? { ...item, score: scored.scoreLabel ?? null } : item
          ))
        );
      }
      setErrorText(null);
    } catch (error) {
      if (!mountedRef.current) return;
      setErrorText(mapApiError(error));
    } finally {
      if (mountedRef.current) {
        setCheckingScoreSlug(null);
        keepSearchModeAfterDropdownTap();
        endDropdownInteractionSoon();
      }
    }
  };

  const isSearchMode = isSearchFocused || Boolean(checkingScoreSlug);
  const showDropdown = isSearchMode && query.trim().length >= 3;
  const showPrimaryContent = !isSearchMode;
  const dropdownListHeight = Math.min(
    Math.max(searchRoles.length, 1) * MATCHMAKER_SEARCH_ROW_HEIGHT,
    MATCHMAKER_DROPDOWN_MAX_HEIGHT
  );
  const dropdownOverlayHeight =
    !isSearchLoading && searchRoles.length > 0
      ? dropdownListHeight
      : MATCHMAKER_SEARCH_ROW_HEIGHT;
  const keyboardAnchoredInputTop =
    Platform.OS === 'android' && keyboardTop != null && keyboardHeight > 0 && searchInputFrame != null
      ? keyboardTop - searchInputFrame.height
      : null;
  const dropdownAnchorTop = keyboardAnchoredInputTop ?? searchInputFrame?.y ?? 0;
  const dropdownOverlayTop =
    searchInputFrame == null
      ? 0
      : Math.max(8, dropdownAnchorTop - dropdownOverlayHeight - MATCHMAKER_DROPDOWN_GAP);
  const rootKeyboardDismissMode = isSearchMode
    ? 'none'
    : Platform.OS === 'ios'
      ? 'interactive'
      : 'on-drag';

  useEffect(() => {
    if (!showDropdown) return;

    const measureInput = () => {
      searchInputBoxRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
        setSearchInputFrame({
          x,
          y,
          width: measuredWidth,
          height: measuredHeight,
        });
      });
    };

    const frameId = requestAnimationFrame(measureInput);
    const timeoutId = setTimeout(measureInput, 120);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [showDropdown, searchLift, searchInputHeight, isSearchLoading, searchRoles.length]);

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
        {isSearchMode ? (
          <Animated.View
            pointerEvents="none"
            style={[
              getFadeUpStyle(explorerAnim, 10),
              {
                position: 'absolute',
                top: Platform.OS === 'android' ? 82 : 68,
                left: 20,
                right: 20,
                zIndex: 120,
                elevation: 12,
                maxWidth: 430,
                alignSelf: 'center',
              },
            ]}
          >
            <View className="flex-row items-center mb-2">
              <Sparkles size={14} color="#C9A84C" />
              <Text className="ml-2 text-[11px] uppercase tracking-[1.8px]" style={{ color: 'rgba(201,168,76,0.72)' }}>
                Career search
              </Text>
            </View>
            <Text className="text-[22px] font-semibold tracking-tight" style={{ color: 'rgba(240,240,248,0.96)' }}>
              Explore possible paths
            </Text>
            <Text className="mt-2 text-[13px] leading-[19px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
              Search any profession, then check the match against your chart.
            </Text>
          </Animated.View>
        ) : null}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
            keyboardShouldPersistTaps={isSearchMode ? 'always' : 'handled'}
            keyboardDismissMode={rootKeyboardDismissMode}
            scrollEnabled={!isSearchMode}
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

            {errorText && showPrimaryContent ? (
              <Text className="mb-4 text-[12px]" style={{ color: '#FF9FB4' }}>
                {errorText}
              </Text>
            ) : null}

            <Animated.View
              pointerEvents={showPrimaryContent ? 'auto' : 'none'}
              style={[getFadeUpStyle(listAnim, 14), !showPrimaryContent ? { opacity: 0 } : null]}
            >
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
                    <ActivityIndicator size="small" color="#C9A84C" />
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
                ref={searchFieldRef}
                collapsable={false}
                style={{
                  zIndex: isSearchFocused ? 80 : 20,
                  elevation: isSearchFocused ? 8 : 1,
                  transform: [{ translateY: -searchLift }],
                }}
              >
                <View
                  pointerEvents={showPrimaryContent ? 'auto' : 'none'}
                  className="rounded-[14px] px-4 py-3 flex-row items-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    opacity: showPrimaryContent ? 1 : 0,
                  }}
                >
                  <Search size={14} color="#5A3ACC" />
                  <Text className="text-[13px] font-semibold ml-2 flex-1" style={{ color: 'rgba(233,233,242,0.94)' }}>
                    Explore All Professions
                  </Text>
                </View>

              <View className="mt-2">
                <View
                  ref={searchInputBoxRef}
                  collapsable={false}
                  className="rounded-[14px] px-3 py-2.5 flex-row items-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                  }}
                  onLayout={handleSearchInputLayout}
                >
                  <Search size={14} color="rgba(212,212,224,0.35)" />
                  <TextInput
                    ref={searchInputRef}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search professions..."
                    placeholderTextColor="rgba(212,212,224,0.35)"
                    className="ml-2 flex-1 text-[13px]"
                    style={{ color: 'rgba(233,233,242,0.94)' }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={handleSearchBlur}
                  />
                </View>

                {errorText && !showPrimaryContent ? (
                  <Text className="mt-2 px-1 text-[12px]" style={{ color: '#FF9FB4' }}>
                    {errorText}
                  </Text>
                ) : null}

              </View>
              </View>
            </Animated.View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showDropdown && searchInputFrame ? (
        <Pressable
          onPress={dismissSearchDropdown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1500,
            elevation: 15,
            backgroundColor: 'transparent',
          }}
        />
      ) : null}

      {showDropdown && searchInputFrame ? (
        <View
          className="rounded-[14px] overflow-hidden"
          onTouchStart={beginDropdownInteraction}
          onStartShouldSetResponderCapture={() => {
            beginDropdownInteraction();
            return false;
          }}
          onMoveShouldSetResponderCapture={() => {
            beginDropdownInteraction();
            return false;
          }}
          style={{
            position: 'absolute',
            top: dropdownOverlayTop,
            left: searchInputFrame.x,
            width: searchInputFrame.width,
            height: dropdownOverlayHeight,
            zIndex: 2000,
            elevation: 20,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.07)',
            borderWidth: 1,
          }}
        >
          {isSearchLoading ? (
            <View className="px-4 py-4 items-start">
              <ActivityIndicator size="small" color="#C9A84C" />
            </View>
          ) : searchRoles.length === 0 ? (
            <Text className="px-4 py-4 text-[13px]" style={{ color: 'rgba(212,212,224,0.45)' }}>
              No matching professions.
            </Text>
          ) : (
            <FlatList
              data={searchRoles}
              keyExtractor={(item) => item.slug}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              nestedScrollEnabled
              scrollEnabled={searchRoles.length * MATCHMAKER_SEARCH_ROW_HEIGHT > dropdownListHeight}
              showsVerticalScrollIndicator={searchRoles.length > 4}
              onTouchStart={beginDropdownInteraction}
              onScrollBeginDrag={beginDropdownInteraction}
              onScrollEndDrag={endDropdownInteractionSoon}
              onMomentumScrollEnd={endDropdownInteractionSoon}
              getItemLayout={(_data, index) => ({
                length: MATCHMAKER_SEARCH_ROW_HEIGHT,
                offset: MATCHMAKER_SEARCH_ROW_HEIGHT * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const isChecking = checkingScoreSlug === item.slug;
                return (
                  <View
                    className="px-4 flex-row items-center"
                    style={{
                      minHeight: MATCHMAKER_SEARCH_ROW_HEIGHT,
                      borderBottomWidth: index === searchRoles.length - 1 ? 0 : 1,
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

                    {item.score ? (
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
                        onPressIn={beginDropdownInteraction}
                        onPressOut={endDropdownInteractionSoon}
                        onPress={() => void handleCheckRoleScore(item.slug)}
                        disabled={Boolean(checkingScoreSlug)}
                        className="px-2.5 py-0.5 rounded-full min-w-[54px] items-center"
                        style={{
                          backgroundColor: 'rgba(90,58,204,0.2)',
                          opacity: checkingScoreSlug && !isChecking ? 0.5 : 1,
                        }}
                      >
                        {isChecking ? (
                          <ActivityIndicator size="small" color="#C9A84C" />
                        ) : (
                          <Text className="text-[11px] font-semibold" style={{ color: '#8C7CFF' }}>
                            Check
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : null}
    </View>
  );
};
