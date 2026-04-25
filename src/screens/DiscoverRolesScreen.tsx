import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  BarChart3,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LineChart,
  Search,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MarketSourceFooter } from '../components/MarketSourceFooter';
import { ApiError, ensureAuthSession } from '../services/authSession';
import {
  deleteDiscoverRoleShortlistEntry as deleteDiscoverRoleShortlistEntryRemote,
  fetchDiscoverRoleShortlist,
  fetchDiscoverRoles,
  upsertDiscoverRoleShortlistEntry as upsertDiscoverRoleShortlistEntryRemote,
} from '../services/astrologyApi';
import type {
  DiscoverRoleDetail,
  DiscoverRoleRankingMode,
} from '../services/astrologyApi';
import type { OccupationInsightResponse } from '../services/marketApiCore';
import { isNatalChartMissingError, syncNatalChartCache } from '../services/natalChartSync';
import type { AppNavigationProp } from '../types/navigation';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  loadDiscoverRoleShortlistForUser,
  mergeDiscoverRoleShortlistEntries,
  replaceDiscoverRoleShortlistForUser,
  selectDiscoverRoleShortlistEntriesForSync,
  type DiscoverRoleShortlistEntry,
  type DiscoverRoleShortlistInput,
} from '../utils/discoverRoleShortlistStorage';
import {
  removeDiscoverRoleShortlistEntry as removeDiscoverRoleShortlistEntryLocal,
  upsertDiscoverRoleShortlistEntry as upsertDiscoverRoleShortlistEntryLocal,
} from '../utils/discoverRoleShortlistStorageCore';
import {
  mergeDiscoverRoleMarketEntries,
  removeDiscoverRoleMarketEntry,
  upsertDiscoverRoleMarketEntry,
} from './discoverRolesMarketCore';
import {
  resolveDiscoverRoleScoreLabel,
  resolveDiscoverRoleScoreTone,
  shouldShowDiscoverRoleLoadingCard,
} from './discoverRolesScreenCore';

type RecommendedRoleCard = {
  slug: string;
  role: string;
  domain: string;
  score: string;
  scoreValue: number;
  scoreColor: string;
  scoreBg: string;
  description: string;
  tags: string[];
  market: OccupationInsightResponse | null;
  detail: DiscoverRoleDetail | null;
};

type SearchRoleItem = {
  slug: string;
  role: string;
  field: string;
  score: string | null;
  scoreValue: number | null;
  tags: string[];
  market: OccupationInsightResponse | null;
  detail: DiscoverRoleDetail | null;
};

type SelectedRole = {
  slug: string;
  role: string;
  domain: string;
  score: string | null;
  scoreValue: number | null;
  scoreColor: string;
  scoreBg: string;
  description: string | null;
  tags: string[];
  market: OccupationInsightResponse | null;
  detail: DiscoverRoleDetail | null;
};

type DiscoverTopTab = 'recommended' | 'market';

const { width, height } = Dimensions.get('window');
const MATCHMAKER_DROPDOWN_MAX_HEIGHT = 260;

function scoreTone(score: number) {
  const tone = resolveDiscoverRoleScoreTone(score);
  return {
    scoreColor: tone.textColor,
    scoreBg: tone.backgroundColor,
  };
}

function formatCompactMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function formatMarketSalary(market: OccupationInsightResponse | null) {
  const salary = market?.salary;
  if (!salary) return null;
  const min = formatCompactMoney(salary.min);
  const max = formatCompactMoney(salary.max);
  const median = formatCompactMoney(salary.median);
  if (min && max) return `${min}-${max}`;
  if (median) return `${median} median`;
  return null;
}

function formatMarketDemand(market: OccupationInsightResponse | null) {
  if (!market) return null;
  const openings = market.outlook.projectedOpenings;
  if (typeof openings === 'number' && Number.isFinite(openings)) {
    return `${Math.round(openings).toLocaleString()} openings`;
  }
  return market.outlook.demandLabel === 'unknown' ? null : `${market.outlook.demandLabel} demand`;
}

function marketLine(market: OccupationInsightResponse | null) {
  if (!market) return null;
  return [market.labels.marketScore, formatMarketSalary(market)].filter(Boolean).join(' - ');
}

function hasMarketSources(
  market: OccupationInsightResponse | null | undefined,
): market is OccupationInsightResponse {
  return Boolean(market && market.sources.length > 0);
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

function selectedFromRecommended(item: RecommendedRoleCard): SelectedRole {
  return {
    slug: item.slug,
    role: item.role,
    domain: item.domain,
    score: item.score,
    scoreValue: item.scoreValue,
    scoreColor: item.scoreColor,
    scoreBg: item.scoreBg,
    description: item.description,
    tags: item.tags,
    market: item.market,
    detail: item.detail,
  };
}

function selectedFromShortlist(item: DiscoverRoleShortlistEntry): SelectedRole {
  const tone = typeof item.scoreValue === 'number' ? scoreTone(item.scoreValue) : scoreTone(0);
  return {
    slug: item.slug,
    role: item.role,
    domain: item.domain,
    score: item.scoreLabel,
    scoreValue: item.scoreValue,
    scoreColor: tone.scoreColor,
    scoreBg: tone.scoreBg,
    description: item.detail?.whyFit.summary ?? null,
    tags: item.tags,
    market: item.market,
    detail: item.detail,
  };
}

function shortlistInputFromSelected(role: SelectedRole): DiscoverRoleShortlistInput {
  return {
    slug: role.slug,
    role: role.role,
    domain: role.domain,
    scoreLabel: role.score,
    scoreValue: role.scoreValue,
    tags: role.tags,
    market: role.market,
    detail: role.detail,
  };
}

function marketEntryFromRecommended(item: RecommendedRoleCard): DiscoverRoleShortlistEntry {
  return {
    slug: item.slug,
    role: item.role,
    domain: item.domain,
    scoreLabel: item.score,
    scoreValue: item.scoreValue,
    tags: item.tags,
    market: item.market,
    detail: item.detail,
    savedAt: `${item.slug}:recommended`,
  };
}

function marketEntryFromSearch(item: SearchRoleItem): DiscoverRoleShortlistEntry {
  return {
    slug: item.slug,
    role: item.role,
    domain: item.field,
    scoreLabel: item.score,
    scoreValue: item.scoreValue,
    tags: item.tags,
    market: item.market,
    detail: item.detail,
    savedAt: `${item.slug}:market`,
  };
}

function mergeMarketEntrySnapshot(
  existing: DiscoverRoleShortlistEntry | undefined,
  next: DiscoverRoleShortlistEntry,
): DiscoverRoleShortlistEntry {
  if (!existing) {
    return next;
  }

  return {
    ...existing,
    ...next,
    scoreLabel: resolveDiscoverRoleScoreLabel(next.scoreLabel ?? null, next.scoreValue ?? null) ?? existing.scoreLabel ?? null,
    scoreValue: next.scoreValue ?? existing.scoreValue ?? null,
    tags: next.tags.length > 0 ? next.tags : existing.tags,
    market: next.market ?? existing.market ?? null,
    detail: next.detail ?? existing.detail ?? null,
    savedAt: existing.savedAt,
  };
}

function mapRecommendedRoles(
  payload: Awaited<ReturnType<typeof fetchDiscoverRoles>>,
): RecommendedRoleCard[] {
  return payload.recommended.map((item) => {
    const tone = scoreTone(item.score);
    return {
      slug: item.slug,
      role: item.title,
      domain: item.domain,
      score: item.scoreLabel,
      scoreValue: item.score,
      scoreColor: tone.scoreColor,
      scoreBg: tone.scoreBg,
      description: item.reason,
      tags: item.tags.slice(0, 2),
      market: item.market,
      detail: item.detail,
    };
  });
}

function mapSearchRoles(
  payload: Awaited<ReturnType<typeof fetchDiscoverRoles>>,
): SearchRoleItem[] {
  return payload.search.map((item) => ({
    slug: item.slug,
    role: item.title,
    field: item.domain,
    score: resolveDiscoverRoleScoreLabel(item.scoreLabel ?? null, item.score ?? null),
    scoreValue: item.score ?? null,
    tags: item.tags.slice(0, 4),
    market: item.market,
    detail: item.detail,
  }));
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

  const [activeTab, setActiveTab] = useState<DiscoverTopTab>('recommended');
  const [rankingMode, setRankingMode] = useState<DiscoverRoleRankingMode>('fit');
  const [query, setQuery] = useState('');
  const [fitRoles, setFitRoles] = useState<RecommendedRoleCard[]>([]);
  const [opportunityRoles, setOpportunityRoles] = useState<RecommendedRoleCard[]>([]);
  const [searchRoles, setSearchRoles] = useState<SearchRoleItem[]>([]);
  const [shortlist, setShortlist] = useState<DiscoverRoleShortlistEntry[]>([]);
  const [marketEntries, setMarketEntries] = useState<DiscoverRoleShortlistEntry[]>([]);
  const [expandedRecommendedSlug, setExpandedRecommendedSlug] = useState<string | null>(null);
  const [expandedMarketSlug, setExpandedMarketSlug] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [savingRoleSlug, setSavingRoleSlug] = useState<string | null>(null);
  const [resolvingMarketSlugs, setResolvingMarketSlugs] = useState<string[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const explorerAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void ensureAuthSession()
      .then(async (session) => {
        const localShortlist = await loadDiscoverRoleShortlistForUser(session.user.id);

        try {
          let remoteShortlist = await fetchDiscoverRoleShortlist();
          const entriesToSync = selectDiscoverRoleShortlistEntriesForSync(localShortlist, remoteShortlist);

          if (entriesToSync.length > 0) {
            try {
              await Promise.all(
                entriesToSync.map((entry) =>
                  upsertDiscoverRoleShortlistEntryRemote({
                    ...entry,
                    savedAt: entry.savedAt,
                  }),
                ),
              );
              remoteShortlist = await fetchDiscoverRoleShortlist();
              if (remoteShortlist.length === 0 && localShortlist.length > 0) {
                remoteShortlist = mergeDiscoverRoleShortlistEntries([...remoteShortlist, ...localShortlist]);
              }
            } catch {
              remoteShortlist = mergeDiscoverRoleShortlistEntries([...remoteShortlist, ...localShortlist]);
            }
          }

          if (!cancelled) {
            setShortlist(remoteShortlist);
          }

          try {
            await replaceDiscoverRoleShortlistForUser(session.user.id, remoteShortlist);
          } catch {
            // Non-blocking local cache refresh.
          }
        } catch {
          if (!cancelled && localShortlist.length > 0) {
            setShortlist(localShortlist);
          }
        }
      })
      .catch(() => {
        // Shortlist storage is optional and should not block recommendations.
      });

    return () => {
      cancelled = true;
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
    let cancelled = false;

    const load = async () => {
      setIsInitialLoading(true);
      try {
        await ensureAuthSession();
        const [fitPayload, opportunityPayload] = await Promise.all([
          fetchDiscoverRolesWithNatalChartRecovery({
            limit: 5,
            searchLimit: 20,
            rankingMode: 'fit',
          }),
          fetchDiscoverRolesWithNatalChartRecovery({
            limit: 5,
            searchLimit: 20,
            rankingMode: 'opportunity',
          }),
        ]);

        if (cancelled) return;

        const nextFitRoles = mapRecommendedRoles(fitPayload);
        const nextOpportunityRoles = mapRecommendedRoles(opportunityPayload);
        setFitRoles(nextFitRoles);
        setOpportunityRoles(nextOpportunityRoles);
        setMarketEntries(
          mergeDiscoverRoleMarketEntries(nextFitRoles.slice(0, 2).map(marketEntryFromRecommended)),
        );
        setErrorText(null);
      } catch (error) {
        if (cancelled) return;
        setFitRoles([]);
        setOpportunityRoles([]);
        setMarketEntries([]);
        setErrorText(mapApiError(error));
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'market') {
      setSearchRoles([]);
      setIsSearchLoading(false);
      return;
    }

    const normalized = query.trim();
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
          rankingMode,
        });
        if (cancelled) return;
        setSearchRoles(mapSearchRoles(payload));
        setErrorText(null);
      } catch (error) {
        if (cancelled) return;
        setSearchRoles([]);
        setErrorText(mapApiError(error));
      } finally {
        if (!cancelled) {
          setIsSearchLoading(false);
        }
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeTab, query, rankingMode]);

  const visibleRecommendedRoles = rankingMode === 'fit' ? fitRoles : opportunityRoles;
  const showSearchDropdown = activeTab === 'market' && query.trim().length >= 3;
  const recommendedFooterMarkets = useMemo(
    () => visibleRecommendedRoles.map((item) => item.market).filter(hasMarketSources),
    [visibleRecommendedRoles],
  );
  const marketFooterMarkets = useMemo(
    () => [...marketEntries.map((item) => item.market), ...searchRoles.map((item) => item.market)].filter(hasMarketSources),
    [marketEntries, searchRoles],
  );

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

  const isRoleSaved = (slug: string) => shortlist.some((item) => item.slug === slug);
  const isMarketRoleResolving = (slug: string) => resolvingMarketSlugs.includes(slug);

  const handleSaveRole = async (role: SelectedRole) => {
    if (savingRoleSlug) return;

    const nextInput = shortlistInputFromSelected(role);
    const optimisticSavedAt = new Date().toISOString();
    const previousShortlist = shortlist;
    const optimisticShortlist = upsertDiscoverRoleShortlistEntryLocal(
      shortlist,
      nextInput,
      optimisticSavedAt,
    );

    setSavingRoleSlug(role.slug);
    setShortlist(optimisticShortlist);
    setErrorText(null);

    try {
      const session = await ensureAuthSession();
      const persistedEntry = await upsertDiscoverRoleShortlistEntryRemote({
        ...nextInput,
        savedAt: optimisticSavedAt,
      });
      const updated = mergeDiscoverRoleShortlistEntries([
        persistedEntry,
        ...optimisticShortlist.filter((item) => item.slug !== persistedEntry.slug),
      ]);
      if (mountedRef.current) {
        setShortlist(updated);
        setErrorText(null);
      }
      try {
        await replaceDiscoverRoleShortlistForUser(session.user.id, updated);
      } catch {
        // Non-blocking local cache refresh.
      }
    } catch (error) {
      if (mountedRef.current) {
        setShortlist(previousShortlist);
        setErrorText(mapApiError(error));
      }
    } finally {
      if (mountedRef.current) {
        setSavingRoleSlug(null);
      }
    }
  };

  const handleRemoveShortlistRole = async (slug: string) => {
    if (savingRoleSlug) return;

    const previousShortlist = shortlist;
    const optimisticShortlist = removeDiscoverRoleShortlistEntryLocal(shortlist, slug);
    setSavingRoleSlug(slug);
    setShortlist(optimisticShortlist);
    setErrorText(null);

    try {
      const session = await ensureAuthSession();
      await deleteDiscoverRoleShortlistEntryRemote(slug);
      try {
        await replaceDiscoverRoleShortlistForUser(session.user.id, optimisticShortlist);
      } catch {
        // Non-blocking local cache refresh.
      }
    } catch (error) {
      if (mountedRef.current) {
        setShortlist(previousShortlist);
        setErrorText(mapApiError(error));
      }
    } finally {
      if (mountedRef.current) {
        setSavingRoleSlug(null);
      }
    }
  };

  const handleOpenRecommendedRole = (slug: string) => {
    setExpandedRecommendedSlug((current) => (current === slug ? null : slug));
  };

  const handleOpenMarketRole = (slug: string) => {
    setExpandedMarketSlug((current) => (current === slug ? null : slug));
  };

  const handleRemoveMarketRole = (slug: string) => {
    setMarketEntries((current) => removeDiscoverRoleMarketEntry(current, slug));
    setExpandedMarketSlug((current) => (current === slug ? null : current));
    setResolvingMarketSlugs((current) => current.filter((item) => item !== slug));
  };

  const handleOpenSearchRole = async (item: SearchRoleItem) => {
    setQuery('');
    setSearchRoles([]);
    setExpandedMarketSlug(item.slug);
    setMarketEntries((current) => {
      const existing = current.find((entry) => entry.slug === item.slug);
      return upsertDiscoverRoleMarketEntry(
        current,
        mergeMarketEntrySnapshot(existing, marketEntryFromSearch(item)),
        { prependNew: true },
      );
    });

    if (item.detail && item.market && item.score) {
      return;
    }

    const normalized = query.trim();
    if (normalized.length < 3) {
      return;
    }

    setResolvingMarketSlugs((current) => (current.includes(item.slug) ? current : [...current, item.slug]));

    try {
      await ensureAuthSession();
      const payload = await fetchDiscoverRolesWithNatalChartRecovery({
        query: normalized,
        limit: 5,
        searchLimit: 20,
        deferSearchScores: true,
        scoreSlug: item.slug,
        rankingMode,
      });

      if (!mountedRef.current) return;

      const resolvedItem = mapSearchRoles(payload).find((candidate) => candidate.slug === item.slug);
      if (resolvedItem) {
        setSearchRoles((current) =>
          current.map((candidate) => (candidate.slug === resolvedItem.slug ? resolvedItem : candidate)),
        );
        setMarketEntries((current) => {
          const existing = current.find((entry) => entry.slug === resolvedItem.slug);
          return upsertDiscoverRoleMarketEntry(
            current,
            mergeMarketEntrySnapshot(existing, marketEntryFromSearch(resolvedItem)),
            { prependNew: true },
          );
        });
      }
      setErrorText(null);
    } catch (error) {
      if (mountedRef.current) {
        setErrorText(mapApiError(error));
      }
    } finally {
      if (mountedRef.current) {
        setResolvingMarketSlugs((current) => current.filter((slug) => slug !== item.slug));
      }
    }
  };

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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-2 pt-2">
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

              <View
                className="mb-4 rounded-[12px] p-1 flex-row"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                }}
              >
                {[
                  { value: 'recommended' as const, label: 'Recommended For You', icon: Sparkles },
                  { value: 'market' as const, label: 'Market Opportunities', icon: LineChart },
                ].map((option) => {
                  const active = activeTab === option.value;
                  const Icon = option.icon;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setActiveTab(option.value)}
                      className="flex-1 rounded-[9px] py-2 items-center justify-center"
                      style={{
                        backgroundColor: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                        borderColor: active ? 'rgba(201,168,76,0.28)' : 'transparent',
                        borderWidth: 1,
                      }}
                    >
                      <View className="flex-row items-center justify-center">
                        <Icon size={13} color={active ? '#E6CA73' : 'rgba(212,212,224,0.52)'} />
                        <Text
                          className="text-[11px] font-semibold ml-1.5"
                          numberOfLines={1}
                          style={{ color: active ? '#E6CA73' : 'rgba(212,212,224,0.52)' }}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {activeTab === 'recommended' ? (
                <>
                  <View
                    className="mb-4 rounded-[12px] p-1 flex-row"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                    }}
                  >
                    {[
                      { value: 'fit' as const, label: 'Best Fit' },
                      { value: 'opportunity' as const, label: 'Best Opportunity' },
                    ].map((option) => {
                      const active = rankingMode === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setRankingMode(option.value)}
                          className="flex-1 rounded-[9px] py-2 items-center justify-center"
                          style={{
                            backgroundColor: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                            borderColor: active ? 'rgba(201,168,76,0.28)' : 'transparent',
                            borderWidth: 1,
                          }}
                        >
                          <Text
                            className="text-[11px] font-semibold"
                            numberOfLines={1}
                            style={{ color: active ? '#E6CA73' : 'rgba(212,212,224,0.52)' }}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Animated.View style={getFadeUpStyle(listAnim, 14)}>
                    {errorText ? (
                      <Text className="mb-4 text-[12px]" style={{ color: '#FF9FB4' }}>
                        {errorText}
                      </Text>
                    ) : null}

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
                      ) : visibleRecommendedRoles.length === 0 ? (
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
                        visibleRecommendedRoles.map((item) => {
                          const isExpanded = expandedRecommendedSlug === item.slug;
                          const selectedRole = selectedFromRecommended(item);

                          return (
                            <View key={item.slug}>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => handleOpenRecommendedRole(item.slug)}
                                className="rounded-[18px] p-3"
                                style={({ pressed }) => ({
                                  backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                                  borderColor: isExpanded ? 'rgba(201,168,76,0.32)' : 'rgba(255,255,255,0.08)',
                                  borderWidth: 1,
                                })}
                              >
                                <View className="flex-row items-start mb-2">
                                  <View className="flex-1 mr-2">
                                    <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
                                      {item.role}
                                    </Text>
                                    <Text className="text-[10px] mt-0.5" style={{ color: 'rgba(212,212,224,0.38)' }}>
                                      {item.domain}
                                    </Text>
                                  </View>
                                  <View className="flex-row items-center">
                                    <View className="px-2.5 py-0.5 rounded-full mr-2" style={{ backgroundColor: item.scoreBg }}>
                                      <Text className="text-[11px] font-bold" style={{ color: item.scoreColor }}>
                                        {item.score}
                                      </Text>
                                    </View>
                                    <ChevronRight
                                      size={15}
                                      color="rgba(212,212,224,0.52)"
                                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                                    />
                                  </View>
                                </View>

                                <Text className="text-[12px] leading-[18px] mb-2" style={{ color: 'rgba(212,212,224,0.55)' }}>
                                  {item.description}
                                </Text>

                                {item.market ? (
                                  <View
                                    className="mb-2 rounded-[8px] px-3 py-2"
                                    style={{
                                      backgroundColor: 'rgba(124,229,176,0.06)',
                                      borderColor: 'rgba(124,229,176,0.12)',
                                      borderWidth: 1,
                                    }}
                                  >
                                    <View className="flex-row items-center mb-1">
                                      <TrendingUp size={12} color="#8AF0C2" />
                                      <Text className="ml-1 text-[10px] uppercase" style={{ color: 'rgba(212,212,224,0.48)' }}>
                                        Market
                                      </Text>
                                    </View>
                                    <Text className="text-[12px] font-semibold" style={{ color: '#8AF0C2' }}>
                                      {item.market.labels.marketScore}
                                    </Text>
                                    <View className="flex-row mt-1">
                                      <View className="flex-row items-center flex-1 mr-2">
                                        <DollarSign size={11} color="#E6CA73" />
                                        <Text
                                          className="ml-1 text-[11px]"
                                          numberOfLines={1}
                                          style={{ color: 'rgba(230,202,115,0.9)' }}
                                        >
                                          {formatMarketSalary(item.market) ?? 'Salary unavailable'}
                                        </Text>
                                      </View>
                                      <Text
                                        className="text-[11px] flex-1"
                                        numberOfLines={1}
                                        style={{ color: 'rgba(138,201,255,0.9)' }}
                                      >
                                        {formatMarketDemand(item.market) ?? 'Demand unavailable'}
                                      </Text>
                                    </View>
                                  </View>
                                ) : null}

                                <View className="flex-row flex-wrap">
                                  {item.tags.map((tag) => (
                                    <View
                                      key={`${item.slug}-${tag}`}
                                      className="px-2 py-0.5 rounded-full mr-2 mb-2"
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
                              </Pressable>

                              {isExpanded ? (
                                <RoleDetailPanel
                                  role={selectedRole}
                                  isSaved={isRoleSaved(selectedRole.slug)}
                                  isSaving={savingRoleSlug === selectedRole.slug}
                                  showSaveAction={false}
                                  onClose={() => setExpandedRecommendedSlug(null)}
                                  onSave={() => void handleSaveRole(selectedRole)}
                                  onRemove={() => void handleRemoveShortlistRole(selectedRole.slug)}
                                />
                              ) : null}
                            </View>
                          );
                        })
                      )}
                    </View>

                    {recommendedFooterMarkets.length > 0 ? <MarketSourceFooter markets={recommendedFooterMarkets} /> : null}
                  </Animated.View>
                </>
              ) : (
                <Animated.View style={getFadeUpStyle(explorerAnim, 16)}>
                  <View
                    className="rounded-[18px] p-3"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Search size={14} color="#5A3ACC" />
                      <Text className="text-[13px] font-semibold ml-2" style={{ color: 'rgba(233,233,242,0.94)' }}>
                        Explore the Market
                      </Text>
                    </View>
                    <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
                      Search any role, then drop it into the market comparison stack below.
                    </Text>

                    <View
                      className="mt-3 rounded-[14px] px-3 py-2.5 flex-row items-center"
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

                    {showSearchDropdown ? (
                      <View
                        className="mt-2 rounded-[14px] overflow-hidden"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.07)',
                          borderWidth: 1,
                        }}
                      >
                        <ScrollView
                          nestedScrollEnabled
                          style={{ maxHeight: MATCHMAKER_DROPDOWN_MAX_HEIGHT }}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={searchRoles.length > 4}
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
                            searchRoles.map((item, index) => {
                              const isResolving = isMarketRoleResolving(item.slug);
                              const searchScoreTone = resolveDiscoverRoleScoreTone(item.scoreValue, item.score);
                              return (
                                <Pressable
                                  key={item.slug}
                                  accessibilityRole="button"
                                  onPress={() => void handleOpenSearchRole(item)}
                                  className="px-4 py-3 flex-row items-center"
                                  style={({ pressed }) => ({
                                    backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    borderBottomWidth: index === searchRoles.length - 1 ? 0 : 1,
                                    borderBottomColor: 'rgba(255,255,255,0.05)',
                                  })}
                                >
                                  <View className="flex-1 mr-3">
                                    <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
                                      {item.role}
                                    </Text>
                                    <Text className="text-[11px]" numberOfLines={1} style={{ color: 'rgba(212,212,224,0.38)' }}>
                                      {[item.field, marketLine(item.market)].filter(Boolean).join(' - ')}
                                    </Text>
                                  </View>

                                  {isResolving ? (
                                    <ActivityIndicator size="small" color="#C9A84C" />
                                  ) : item.score ? (
                                    <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: searchScoreTone.backgroundColor }}>
                                      <Text className="text-[11px] font-bold" style={{ color: searchScoreTone.textColor }}>
                                        {item.score}
                                      </Text>
                                    </View>
                                  ) : (
                                    <ChevronRight size={15} color="rgba(212,212,224,0.52)" />
                                  )}
                                </Pressable>
                              );
                            })
                          )}
                        </ScrollView>
                      </View>
                    ) : null}

                    {errorText ? (
                      <Text className="mt-3 text-[12px]" style={{ color: '#FF9FB4' }}>
                        {errorText}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    className="mt-4 rounded-[18px] p-3"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(140,124,255,0.16)',
                      borderWidth: 1,
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <TrendingUp size={13} color="#8AF0C2" />
                      <Text className="text-[13px] font-semibold ml-2 flex-1" style={{ color: 'rgba(233,233,242,0.92)' }}>
                        Compare Market Options
                      </Text>
                      <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.42)' }}>
                        {marketEntries.length} roles
                      </Text>
                    </View>

                    <Text className="text-[12px] leading-[18px] mb-3" style={{ color: 'rgba(212,212,224,0.55)' }}>
                      Two strongest fit roles are added here by default. Add more only when you want a broader market comparison.
                    </Text>

                    {isInitialLoading ? (
                      <View
                        className="rounded-[12px] p-4"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderWidth: 1,
                        }}
                      >
                        <ActivityIndicator size="small" color="#C9A84C" />
                      </View>
                    ) : marketEntries.length === 0 ? (
                      <View
                        className="rounded-[12px] p-4"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderWidth: 1,
                        }}
                      >
                        <Text className="text-[13px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
                          No roles in your comparison stack yet. Search above to add one.
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-3">
                        {marketEntries.map((entry) => {
                          const isExpanded = expandedMarketSlug === entry.slug;
                          const isResolving = isMarketRoleResolving(entry.slug);
                          const selectedRole = selectedFromShortlist(entry);
                          const entryScoreTone = resolveDiscoverRoleScoreTone(entry.scoreValue, entry.scoreLabel);
                          const showLoadingCard = shouldShowDiscoverRoleLoadingCard({
                            isResolving,
                            scoreLabel: entry.scoreLabel,
                            hasMarket: Boolean(entry.market),
                            hasDetail: Boolean(entry.detail),
                          });

                          return (
                            <View key={`${entry.slug}:${entry.savedAt}`}>
                              {showLoadingCard ? (
                                <MarketRoleLoadingCard roleTitle={entry.role} onRemove={() => handleRemoveMarketRole(entry.slug)} />
                              ) : (
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => handleOpenMarketRole(entry.slug)}
                                  className="rounded-[16px] p-3"
                                  style={({ pressed }) => ({
                                    backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                                    borderColor: isExpanded ? 'rgba(140,124,255,0.24)' : 'rgba(255,255,255,0.08)',
                                    borderWidth: 1,
                                  })}
                                >
                                  <View className="flex-row items-start">
                                    <View className="flex-1 mr-3">
                                      <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
                                        {entry.role}
                                      </Text>
                                      <Text className="text-[10px] mt-0.5" style={{ color: 'rgba(212,212,224,0.38)' }}>
                                        {entry.domain}
                                      </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                      {entry.scoreLabel ? (
                                        <View className="px-2.5 py-0.5 rounded-full mr-2" style={{ backgroundColor: entryScoreTone.backgroundColor }}>
                                          <Text className="text-[11px] font-bold" style={{ color: entryScoreTone.textColor }}>
                                            {entry.scoreLabel}
                                          </Text>
                                        </View>
                                      ) : null}

                                      <ChevronRight
                                        size={15}
                                        color="rgba(212,212,224,0.52)"
                                        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                                      />

                                      <Pressable
                                        accessibilityRole="button"
                                        hitSlop={8}
                                        onPress={(event) => {
                                          event.stopPropagation();
                                          handleRemoveMarketRole(entry.slug);
                                        }}
                                        className="ml-2 w-8 h-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                      >
                                        <X size={13} color="rgba(212,212,224,0.64)" />
                                      </Pressable>
                                    </View>
                                  </View>

                                  <View className="flex-row flex-wrap mt-3">
                                    {entry.scoreLabel ? (
                                      <DetailStatChip
                                        label="Fit"
                                        value={entry.scoreLabel}
                                        textColor={entryScoreTone.textColor}
                                        backgroundColor={entryScoreTone.backgroundColor}
                                      />
                                    ) : null}
                                    <DetailStatChip
                                      label="Market"
                                      value={entry.market?.labels.marketScore ?? 'Limited data'}
                                      textColor="#8AF0C2"
                                      backgroundColor="rgba(124,229,176,0.12)"
                                    />
                                    <DetailStatChip
                                      label="Salary"
                                      value={formatMarketSalary(entry.market) ?? 'Unavailable'}
                                      textColor="#E6CA73"
                                      backgroundColor="rgba(201,168,76,0.14)"
                                    />
                                  </View>
                                </Pressable>
                              )}

                              {isExpanded ? (
                                showLoadingCard ? null : (
                                  <RoleDetailPanel
                                    role={selectedRole}
                                    isSaved={isRoleSaved(selectedRole.slug)}
                                    isSaving={savingRoleSlug === selectedRole.slug}
                                    showSaveAction
                                    onClose={() => setExpandedMarketSlug(null)}
                                    onSave={() => void handleSaveRole(selectedRole)}
                                    onRemove={() => void handleRemoveShortlistRole(selectedRole.slug)}
                                  />
                                )
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {marketFooterMarkets.length > 0 ? <MarketSourceFooter markets={marketFooterMarkets} /> : null}
                  </View>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

function RoleDetailPanel(props: {
  role: SelectedRole;
  isSaved: boolean;
  isSaving: boolean;
  showSaveAction: boolean;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const { role, isSaved, isSaving, showSaveAction, onClose, onSave, onRemove } = props;
  const market = role.market;
  const detail = role.detail;
  const barrierTone = detail ? entryBarrierTone(detail.entryBarrier.level) : null;
  const skills = (market?.skills ?? [])
    .filter((item) => item.category !== 'tool' && item.category !== 'technology')
    .slice(0, 8);
  const tools = (market?.skills ?? [])
    .filter((item) => item.category === 'tool' || item.category === 'technology')
    .slice(0, 6);
  const summary =
    detail?.whyFit.summary ??
    role.description ??
    'This path sits near the strengths and signals already showing up in your discovery profile.';

  return (
    <View
      className="mt-4 rounded-[12px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderColor: 'rgba(201,168,76,0.18)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1 mr-3">
          <Text className="text-[10px] uppercase tracking-[1.6px]" style={{ color: 'rgba(201,168,76,0.68)' }}>
            Role Detail
          </Text>
          <Text className="text-[16px] font-semibold mt-1" style={{ color: 'rgba(240,240,248,0.96)' }}>
            {role.role}
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.45)' }}>
            {role.domain}
          </Text>
        </View>
        {role.score ? (
          <View className="px-2.5 py-0.5 rounded-full mr-2" style={{ backgroundColor: role.scoreBg }}>
            <Text className="text-[11px] font-bold" style={{ color: role.scoreColor }}>
              {role.score}
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <X size={14} color="rgba(212,212,224,0.7)" />
        </Pressable>
      </View>

      <Text className="text-[12px] leading-[18px] mt-3" style={{ color: 'rgba(212,212,224,0.6)' }}>
        {summary}
      </Text>

      <View className="flex-row flex-wrap mt-4">
        {role.score ? (
          <DetailStatChip
            label="Fit"
            value={role.score}
            textColor={role.scoreColor}
            backgroundColor={role.scoreBg}
          />
        ) : null}
        <DetailStatChip
          label="Market"
          value={market?.labels.marketScore ?? 'Limited data'}
          textColor="#8AF0C2"
          backgroundColor="rgba(124,229,176,0.12)"
        />
        {detail && barrierTone ? (
          <DetailStatChip
            label="Barrier"
            value={detail.entryBarrier.label}
            textColor={barrierTone.textColor}
            backgroundColor={barrierTone.backgroundColor}
          />
        ) : null}
      </View>

      {showSaveAction ? (
        <View className="flex-row mt-4">
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={isSaved ? onRemove : onSave}
            className="flex-1 rounded-[8px] py-2.5 items-center justify-center flex-row border"
            style={{
              backgroundColor: isSaved ? 'rgba(124,229,176,0.12)' : 'rgba(201,168,76,0.14)',
              borderColor: isSaved ? 'rgba(124,229,176,0.24)' : 'rgba(201,168,76,0.28)',
              opacity: isSaving ? 0.65 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={isSaved ? '#8AF0C2' : '#E6CA73'} />
            ) : (
              <>
                {isSaved ? <BookmarkCheck size={14} color="#8AF0C2" /> : <Bookmark size={14} color="#E6CA73" />}
                <Text className="text-[12px] font-semibold ml-1.5" style={{ color: isSaved ? '#8AF0C2' : '#E6CA73' }}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {detail ? (
        <>
          <DetailSectionCard
            title="Why This Role Fits"
            icon={<Sparkles size={13} color="#E6CA73" />}
            className="mt-4"
          >
            <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(233,233,242,0.84)' }}>
              {detail.whyFit.summary}
            </Text>
            {detail.whyFit.topTraits.length > 0 ? (
              <View className="flex-row flex-wrap mt-3">
                {detail.whyFit.topTraits.map((trait) => (
                  <View
                    key={`${role.slug}:trait:${trait}`}
                    className="px-2.5 py-1 rounded-full mr-2 mb-2"
                    style={{
                      backgroundColor: 'rgba(201,168,76,0.14)',
                      borderColor: 'rgba(201,168,76,0.24)',
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-[10px] font-semibold" style={{ color: '#E6CA73' }}>
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <DetailBulletList items={detail.whyFit.bullets} />
          </DetailSectionCard>

          <DetailSectionCard
            title="Reality Check"
            icon={<BarChart3 size={13} color="#8AF0C2" />}
            className="mt-3"
          >
            <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(233,233,242,0.84)' }}>
              {detail.realityCheck.summary}
            </Text>
            <DetailLabeledList label="Typical work" items={detail.realityCheck.tasks} />
            <DetailLabeledList label="Work context" items={detail.realityCheck.workContext} />
            <DetailLabeledList label="Tool themes" items={detail.realityCheck.toolThemes} />
          </DetailSectionCard>

          <DetailSectionCard
            title="Entry Barrier"
            icon={<TrendingUp size={13} color="#8AC9FF" />}
            className="mt-3"
          >
            <View className="flex-row items-center flex-wrap">
              <View
                className="px-2.5 py-1 rounded-full mr-2 mb-2"
                style={{
                  backgroundColor: barrierTone?.backgroundColor ?? 'rgba(138,201,255,0.12)',
                  borderColor: barrierTone?.borderColor ?? 'rgba(138,201,255,0.24)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: barrierTone?.textColor ?? '#8AC9FF' }}>
                  {detail.entryBarrier.label}
                </Text>
              </View>
            </View>
            <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(233,233,242,0.84)' }}>
              {detail.entryBarrier.summary}
            </Text>
            <DetailBulletList items={detail.entryBarrier.signals} />
          </DetailSectionCard>

          {detail.transitionMap.length > 0 ? (
            <DetailSectionCard
              title="Transition Map"
              icon={<TrendingUp size={13} color="#8AF0C2" />}
              className="mt-3"
            >
              {detail.transitionMap.map((path) => (
                <DecisionSupportRoleCard
                  key={`${role.slug}:transition:${path.lane}:${path.role.slug}`}
                  eyebrow={path.label}
                  title={path.role.title}
                  domain={path.role.domain}
                  summary={path.summary}
                  fitScore={path.role.fitScore}
                  fitLabel={path.role.fitLabel}
                  barrierLabel={path.role.barrier.label}
                  barrierLevel={path.role.barrier.level}
                />
              ))}
            </DetailSectionCard>
          ) : null}

          {detail.bestAlternative ? (
            <DetailSectionCard
              title="Best Alternative"
              icon={<Sparkles size={13} color="#E6CA73" />}
              className="mt-3"
            >
              <Text className="text-[10px] uppercase" style={{ color: 'rgba(230,202,115,0.7)' }}>
                {detail.bestAlternative.headline}
              </Text>
              <Text className="text-[14px] font-semibold mt-1" style={{ color: 'rgba(240,240,248,0.95)' }}>
                {detail.bestAlternative.role.title}
              </Text>
              <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(212,212,224,0.42)' }}>
                {detail.bestAlternative.role.domain}
              </Text>
              <Text className="text-[12px] leading-[18px] mt-3" style={{ color: 'rgba(233,233,242,0.84)' }}>
                {detail.bestAlternative.summary}
              </Text>
              <View className="flex-row flex-wrap mt-3">
                {(() => {
                  const alternativeFitTone = resolveDiscoverRoleScoreTone(
                    detail.bestAlternative?.role.fitScore ?? null,
                    detail.bestAlternative?.role.fitLabel ?? null,
                  );
                  return (
                    <DetailStatChip
                      label="Fit"
                      value={detail.bestAlternative.role.fitLabel}
                      textColor={alternativeFitTone.textColor}
                      backgroundColor={alternativeFitTone.backgroundColor}
                    />
                  );
                })()}
                <DetailStatChip
                  label="Barrier"
                  value={detail.bestAlternative.role.barrier.label}
                  textColor={entryBarrierTone(detail.bestAlternative.role.barrier.level).textColor}
                  backgroundColor={entryBarrierTone(detail.bestAlternative.role.barrier.level).backgroundColor}
                />
              </View>
              <DetailBulletList items={detail.bestAlternative.reasons} />
            </DetailSectionCard>
          ) : null}
        </>
      ) : (
        <DetailSectionCard
          title="Role Snapshot"
          icon={<Sparkles size={13} color="#E6CA73" />}
          className="mt-4"
        >
          <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(233,233,242,0.8)' }}>
            Deep role detail is not attached to this snapshot yet, but the market view below is still current.
          </Text>
          {role.tags.length > 0 ? (
            <View className="flex-row flex-wrap mt-3">
              {role.tags.map((tag) => (
                <View
                  key={`${role.slug}:tag:${tag}`}
                  className="px-2.5 py-1 rounded-full mr-2 mb-2"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.09)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[10px]" style={{ color: 'rgba(233,233,242,0.82)' }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </DetailSectionCard>
      )}

      <View
        className="mt-4 rounded-[8px] p-3"
        style={{
          backgroundColor: 'rgba(124,229,176,0.06)',
          borderColor: 'rgba(124,229,176,0.14)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center mb-2">
          <BarChart3 size={13} color="#8AF0C2" />
          <Text className="text-[10px] uppercase ml-1" style={{ color: 'rgba(212,212,224,0.48)' }}>
            Market Detail
          </Text>
        </View>
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Text className="text-[10px] uppercase mb-1" style={{ color: 'rgba(212,212,224,0.42)' }}>
              Market
            </Text>
            <Text className="text-[12px] font-semibold" style={{ color: '#8AF0C2' }}>
              {market?.labels.marketScore ?? 'Limited data'}
            </Text>
          </View>
          <View className="flex-1 mx-1">
            <Text className="text-[10px] uppercase mb-1" style={{ color: 'rgba(212,212,224,0.42)' }}>
              Salary
            </Text>
            <Text className="text-[12px] font-semibold" style={{ color: '#E6CA73' }}>
              {formatMarketSalary(market) ?? 'Unavailable'}
            </Text>
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-[10px] uppercase mb-1" style={{ color: 'rgba(212,212,224,0.42)' }}>
              Demand
            </Text>
            <Text className="text-[12px] font-semibold" style={{ color: '#8AC9FF' }}>
              {formatMarketDemand(market) ?? 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>

      {skills.length > 0 ? (
        <View className="mt-4">
          <Text className="text-[10px] uppercase mb-2" style={{ color: 'rgba(212,212,224,0.45)' }}>
            Skills
          </Text>
          <View className="flex-row flex-wrap">
            {skills.map((skill) => (
              <View
                key={`${role.slug}:skill:${skill.name}`}
                className="px-2.5 py-1 rounded-full mr-2 mb-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.09)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px]" style={{ color: 'rgba(233,233,242,0.82)' }}>
                  {skill.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tools.length > 0 ? (
        <View className="mt-2">
          <View className="flex-row items-center mb-2">
            <Wrench size={12} color="rgba(212,212,224,0.5)" />
            <Text className="text-[10px] uppercase ml-1" style={{ color: 'rgba(212,212,224,0.45)' }}>
              Tools
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {tools.map((tool) => (
              <View
                key={`${role.slug}:tool:${tool.name}`}
                className="px-2.5 py-1 rounded-full mr-2 mb-2"
                style={{
                  backgroundColor: 'rgba(140,124,255,0.11)',
                  borderColor: 'rgba(140,124,255,0.2)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px]" style={{ color: '#BDB5FF' }}>
                  {tool.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MarketRoleLoadingCard(props: {
  roleTitle: string;
  onRemove: () => void;
}) {
  const { roleTitle, onRemove } = props;
  return (
    <View
      className="rounded-[16px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(140,124,255,0.18)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1 mr-3">
          <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
            {roleTitle}
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.52)' }}>
            Computing fit, market, and role detail.
          </Text>
        </View>
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#C9A84C" />
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onRemove}
            className="ml-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <X size={13} color="rgba(212,212,224,0.64)" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DetailSectionCard(props: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const { title, icon, className, children } = props;
  return (
    <View
      className={className}
      style={{
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <View className="flex-row items-center mb-2.5">
        {icon}
        <Text className="text-[10px] uppercase ml-1.5" style={{ color: 'rgba(212,212,224,0.48)' }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function DetailStatChip(props: {
  label: string;
  value: string;
  textColor: string;
  backgroundColor: string;
}) {
  const { label, value, textColor, backgroundColor } = props;
  return (
    <View
      className="mr-2 mb-2 px-3 py-2 rounded-[10px]"
      style={{ backgroundColor, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }}
    >
      <Text className="text-[9px] uppercase" style={{ color: 'rgba(212,212,224,0.45)' }}>
        {label}
      </Text>
      <Text className="text-[11px] font-semibold mt-1" style={{ color: textColor }}>
        {value}
      </Text>
    </View>
  );
}

function DetailBulletList(props: { items: string[] }) {
  const { items } = props;
  if (items.length === 0) return null;

  return (
    <View className="mt-3">
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <View
            className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2"
            style={{ backgroundColor: 'rgba(201,168,76,0.9)' }}
          />
          <Text className="flex-1 text-[11px] leading-[16px]" style={{ color: 'rgba(212,212,224,0.68)' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DetailLabeledList(props: {
  label: string;
  items: string[];
}) {
  const { label, items } = props;
  if (items.length === 0) return null;

  return (
    <View className="mt-3">
      <Text className="text-[10px] uppercase mb-1.5" style={{ color: 'rgba(212,212,224,0.42)' }}>
        {label}
      </Text>
      {items.map((item) => (
        <Text key={`${label}:${item}`} className="text-[11px] leading-[16px] mb-1.5" style={{ color: 'rgba(212,212,224,0.68)' }}>
          - {item}
        </Text>
      ))}
    </View>
  );
}

function DecisionSupportRoleCard(props: {
  eyebrow: string;
  title: string;
  domain: string;
  summary: string;
  fitScore: number;
  fitLabel: string;
  barrierLabel: string;
  barrierLevel: DiscoverRoleDetail['entryBarrier']['level'];
}) {
  const { eyebrow, title, domain, summary, fitScore, fitLabel, barrierLabel, barrierLevel } = props;
  const barrierTone = entryBarrierTone(barrierLevel);
  const fitTone = resolveDiscoverRoleScoreTone(fitScore, fitLabel);

  return (
    <View
      className="rounded-[10px] p-3 mb-2.5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <Text className="text-[10px] uppercase" style={{ color: 'rgba(230,202,115,0.7)' }}>
        {eyebrow}
      </Text>
      <Text className="text-[13px] font-semibold mt-1" style={{ color: 'rgba(240,240,248,0.95)' }}>
        {title}
      </Text>
      <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(212,212,224,0.42)' }}>
        {domain}
      </Text>
      <Text className="text-[11px] leading-[17px] mt-2.5" style={{ color: 'rgba(212,212,224,0.7)' }}>
        {summary}
      </Text>
      <View className="flex-row flex-wrap mt-3">
        <DetailStatChip
          label="Fit"
          value={fitLabel}
          textColor={fitTone.textColor}
          backgroundColor={fitTone.backgroundColor}
        />
        <DetailStatChip
          label="Barrier"
          value={barrierLabel}
          textColor={barrierTone.textColor}
          backgroundColor={barrierTone.backgroundColor}
        />
      </View>
    </View>
  );
}

function entryBarrierTone(level: DiscoverRoleDetail['entryBarrier']['level']) {
  switch (level) {
    case 'accessible':
      return {
        textColor: '#8AF0C2',
        backgroundColor: 'rgba(124,229,176,0.12)',
        borderColor: 'rgba(124,229,176,0.24)',
      };
    case 'moderate':
      return {
        textColor: '#E6CA73',
        backgroundColor: 'rgba(201,168,76,0.14)',
        borderColor: 'rgba(201,168,76,0.24)',
      };
    case 'specialized':
      return {
        textColor: '#8AC9FF',
        backgroundColor: 'rgba(138,201,255,0.12)',
        borderColor: 'rgba(138,201,255,0.24)',
      };
    case 'high':
    default:
      return {
        textColor: '#F58AA7',
        backgroundColor: 'rgba(245,138,167,0.14)',
        borderColor: 'rgba(245,138,167,0.24)',
      };
  }
}
