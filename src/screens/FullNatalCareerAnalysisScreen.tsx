import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Crown, Lock, Sparkles, Orbit, TrendingUp, CalendarDays } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { AppNavigationProp } from '../types/navigation';
import { ApiError } from '../services/authSession';
import {
  fetchFullNatalCareerAnalysis,
  fetchFullNatalCareerAnalysisProgress,
  type FullNatalCareerAnalysisResponse,
  type OperationProgressResponse,
} from '../services/astrologyApi';
import { FULL_NATAL_GUIDANCE_DISCLAIMER } from '../services/fullNatalCareerAnalysisCopy';
import { trackAnalyticsEvent } from '../services/analytics';
import { FullScreenCosmicLoader } from '../components/loaders/FullScreenCosmicLoader';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';
import {
  FULL_NATAL_GENERATION_STEPS,
  resolveFullNatalLoaderContent,
  resolveFullNatalAnalysisErrorCopy,
  shouldShowProfileChangeNotice,
  type FullNatalAnalysisErrorCopy,
} from './fullNatalCareerAnalysisCore';

type ScreenState = 'loading' | 'ready' | 'premium_required' | 'error';
type PhaseKey = '0_6_months' | '6_18_months' | '18_36_months';

const { width, height } = Dimensions.get('window');

const PHASE_META: Record<PhaseKey, { label: string; accent: string; background: string }> = {
  '0_6_months': {
    label: '0-6 months',
    accent: '#19C37D',
    background: 'rgba(25,195,125,0.08)',
  },
  '6_18_months': {
    label: '6-18 months',
    accent: '#E1C066',
    background: 'rgba(225,192,102,0.08)',
  },
  '18_36_months': {
    label: '18-36 months',
    accent: '#7C5CFF',
    background: 'rgba(124,92,255,0.09)',
  },
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function toPercent(value: number) {
  return `${Math.round(clampScore(value))}%`;
}

function toBarWidth(value: number): `${number}%` {
  return `${Math.round(clampScore(value))}%`;
}

function formatGeneratedAt(iso: string) {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return iso;
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractApiCode(error: ApiError) {
  const payload = error.payload;
  if (!payload || typeof payload !== 'object') return null;
  const code = (payload as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

function extractApiMessage(error: ApiError) {
  const payload = error.payload;
  if (!payload || typeof payload !== 'object') return error.message;
  const message = (payload as Record<string, unknown>).error;
  return typeof message === 'string' ? message : error.message;
}

function isFetchTimeoutError(error: unknown) {
  return error instanceof Error && error.name === 'FetchTimeoutError';
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      className="text-[11px] tracking-[2.5px] font-semibold mt-7 mb-3 px-1 uppercase"
      style={{ color: 'rgba(212,212,224,0.4)' }}
    >
      {title}
    </Text>
  );
}

function ListDots({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) {
    return (
      <Text className="text-[13px] leading-[18px]" style={{ color: 'rgba(212,212,224,0.46)' }}>
        No data provided.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className="flex-row items-start">
          <Text style={{ color, fontSize: 13, marginRight: 8, marginTop: 2 }}>{'\u2022'}</Text>
          <Text className="flex-1 text-[13px] leading-[19px]" style={{ color: 'rgba(224,224,234,0.84)' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const FullNatalCareerAnalysisScreen = () => {
  const { theme } = useThemeMode();

  const navigation = useNavigation<AppNavigationProp<'FullNatalCareerAnalysis'>>();
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [response, setResponse] = useState<FullNatalCareerAnalysisResponse | null>(null);
  const [errorCopy, setErrorCopy] = useState<FullNatalAnalysisErrorCopy | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [loaderProgress, setLoaderProgress] = useState<OperationProgressResponse | null>(null);
  const loadStartedAtRef = useRef(0);

  const loadAnalysis = useCallback(async (isMountedRef: { value: boolean }, retryAttempt: number) => {
    const startedAt = Date.now();
    loadStartedAtRef.current = startedAt;
    setScreenState('loading');
    setErrorCopy(null);
    setLoaderProgress(null);
    trackAnalyticsEvent('full_natal_report_generation_started', {
      retryAttempt,
      source: 'full_report_screen',
    });

    try {
      const payload = await fetchFullNatalCareerAnalysis();
      if (!isMountedRef.value) return;
      setResponse(payload);
      setScreenState('ready');
      trackAnalyticsEvent('full_natal_report_generation_succeeded', {
        cached: payload.cached,
        retryAttempt,
        durationMs: Date.now() - startedAt,
        profileChangeNoticeShown: shouldShowProfileChangeNotice(payload.profileChangeNotice),
      });
    } catch (error) {
      if (!isMountedRef.value) return;
      setResponse(null);

      if (error instanceof ApiError) {
        if (error.status === 403 && (extractApiCode(error) === 'premium_required' || !extractApiCode(error))) {
          setScreenState('premium_required');
          trackAnalyticsEvent('full_natal_report_premium_required', {
            retryAttempt,
            durationMs: Date.now() - startedAt,
          });
          return;
        }

        const apiCode = extractApiCode(error);
        const copy = resolveFullNatalAnalysisErrorCopy({
          status: error.status,
          code: apiCode,
          message: extractApiMessage(error),
        });
        setScreenState('error');
        setErrorCopy(copy);
        trackAnalyticsEvent('full_natal_report_generation_failed', {
          status: error.status,
          code: apiCode ?? 'unknown',
          retryAttempt,
          retryAvailable: copy.action === 'retry' && retryAttempt < 1,
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      if (isFetchTimeoutError(error)) {
        const copy = resolveFullNatalAnalysisErrorCopy({ isTimeout: true });
        setScreenState('error');
        setErrorCopy(copy);
        trackAnalyticsEvent('full_natal_report_generation_failed', {
          status: 'timeout',
          code: 'client_timeout',
          retryAttempt,
          retryAvailable: retryAttempt < 1,
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      const copy = resolveFullNatalAnalysisErrorCopy({
        isNetworkError: error instanceof TypeError,
        message: error instanceof Error ? error.message : null,
      });
      setScreenState('error');
      setErrorCopy(copy);
      trackAnalyticsEvent('full_natal_report_generation_failed', {
        status: error instanceof TypeError ? 'network' : 'unknown',
        code: error instanceof Error ? error.name : 'unknown',
        retryAttempt,
        retryAvailable: copy.action === 'retry' && retryAttempt < 1,
        durationMs: Date.now() - startedAt,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      trackAnalyticsEvent('full_natal_report_opened', {
        source: 'screen_focus',
      });
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const isMountedRef = { value: true };
      void loadAnalysis(isMountedRef, retryAttempts);

      return () => {
        isMountedRef.value = false;
      };
    }, [loadAnalysis, reloadToken, retryAttempts])
  );

  useEffect(() => {
    if (screenState !== 'loading') return;

    let mounted = true;
    const loadProgress = async () => {
      try {
        const progress = await fetchFullNatalCareerAnalysisProgress();
        if (mounted) {
          setLoaderProgress(progress);
        }
      } catch {
        // Keep the local staged loader if the progress endpoint is temporarily unavailable.
      }
    };

    void loadProgress();
    const intervalId = setInterval(() => {
      void loadProgress();
    }, 1500);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [screenState, reloadToken]);

  const analysis = response?.analysis ?? null;
  const footerMeta = useMemo(() => {
    if (!response) return null;
    const generatedAt = formatGeneratedAt(response.generatedAt);
    if (!SHOULD_EXPOSE_TECHNICAL_SURFACES) return `Updated ${generatedAt}`;
    return `${generatedAt} | ${response.model} | ${response.promptVersion} | LLM`;
  }, [response]);
  const showProfileChangeNotice = shouldShowProfileChangeNotice(response?.profileChangeNotice);
  const loaderContent = resolveFullNatalLoaderContent(loaderProgress);
  const canShowErrorAction = errorCopy?.action !== 'retry' || retryAttempts < 1;

  const handleErrorAction = useCallback(() => {
    if (errorCopy?.action === 'generate_natal_chart') {
      trackAnalyticsEvent('full_natal_report_natal_chart_cta_tapped', {
        source: 'error_state',
      });
      navigation.navigate('NatalChart');
      return;
    }
    if (retryAttempts >= 1) return;
    trackAnalyticsEvent('full_natal_report_retry_tapped', {
      retryAttempt: retryAttempts + 1,
      previousDurationMs: loadStartedAtRef.current ? Date.now() - loadStartedAtRef.current : null,
    });
    setRetryAttempts((value) => value + 1);
    setReloadToken((value) => value + 1);
  }, [errorCopy?.action, navigation, retryAttempts]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient id="fullAnalysisGradTop" cx="42%" cy="-5%" rx="70%" ry="50%" fx="42%" fy="-5%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(90,58,204,0.35)" stopOpacity="0.35" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.08)" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="fullAnalysisGradBottom" cx="86%" cy="106%" rx="68%" ry="48%" fx="86%" fy="106%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(201,168,76,0.18)" stopOpacity="0.18" />
              <Stop offset="60%" stopColor="rgba(201,168,76,0.04)" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#fullAnalysisGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#fullAnalysisGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-5 pt-2" style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }}>
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center flex-1 pr-3">
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
                <View>
                  <Text className="text-[15px] font-semibold" style={{ color: 'rgba(233,233,242,0.96)' }}>
                    Full Career Analysis
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Crown size={10} color="#C9A84C" />
                    <Text className="text-[10px] font-bold ml-1 tracking-[1.3px]" style={{ color: '#C9A84C' }}>
                      PREMIUM
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                {/* v2 TODO: restore the PDF export action after the first release. */}

                {response?.cached ? (
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 }}
                  >
                    <Text className="text-[10px] font-semibold tracking-[0.9px]" style={{ color: 'rgba(212,212,224,0.66)' }}>
                      CACHED
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {screenState === 'premium_required' ? (
              <View
                className="rounded-[22px] p-5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-4"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.12)',
                    borderColor: 'rgba(201,168,76,0.25)',
                    borderWidth: 1,
                  }}
                >
                  <Lock size={20} color="#C9A84C" />
                </View>
                <Text className="text-[21px] font-semibold leading-[28px]" style={{ color: 'rgba(242,242,250,0.96)' }}>
                  Full Natal Career Analysis is Premium
                </Text>
                <Text className="text-[13px] leading-[20px] mt-2" style={{ color: 'rgba(212,212,224,0.6)' }}>
                  Upgrade to unlock a deep career blueprint with archetypes, risk mitigation, role fit matrix, and phased execution plan.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('PremiumPurchase')}
                  className="mt-4 rounded-[14px] px-4 py-3 flex-row items-center justify-center"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  <Sparkles size={15} color="#09090F" />
                  <Text className="ml-2 text-[13px] font-black" style={{ color: '#09090F' }}>
                    Upgrade to Premium
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {screenState === 'error' ? (
              <View
                className="rounded-[20px] p-4"
                style={{
                  backgroundColor: 'rgba(255,107,138,0.11)',
                  borderColor: 'rgba(255,107,138,0.28)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[18px] font-semibold leading-[24px]" style={{ color: '#FFD2DC' }}>
                  {errorCopy?.title ?? 'Could not load report'}
                </Text>
                <Text className="text-[13px] leading-[20px] mt-2" style={{ color: '#FF9AB0' }}>
                  {errorCopy?.message ?? 'Unable to load full natal career analysis.'}
                </Text>
                <View className="flex-row mt-3 gap-2">
                  {canShowErrorAction ? (
                    <Pressable
                      onPress={handleErrorAction}
                      className="rounded-[10px] px-3 py-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)', borderWidth: 1 }}
                    >
                      <Text className="text-[12px] font-semibold" style={{ color: 'rgba(244,244,252,0.92)' }}>
                        {errorCopy?.actionLabel ?? 'Retry'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {errorCopy?.action === 'generate_natal_chart' ? (
                    <Pressable
                      onPress={() => {
                        trackAnalyticsEvent('full_natal_report_retry_tapped', {
                          retryAttempt: retryAttempts + 1,
                          source: 'natal_chart_missing_check_again',
                        });
                        setRetryAttempts((value) => value + 1);
                        setReloadToken((value) => value + 1);
                      }}
                      disabled={retryAttempts >= 1}
                      className="rounded-[10px] px-3 py-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderColor: 'rgba(255,255,255,0.16)',
                        borderWidth: 1,
                        opacity: retryAttempts >= 1 ? 0.5 : 1,
                      }}
                    >
                      <Text className="text-[12px] font-semibold" style={{ color: 'rgba(244,244,252,0.92)' }}>
                        Check Again
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {screenState === 'ready' && analysis ? (
              <View>
                {showProfileChangeNotice && response?.profileChangeNotice ? (
                  <View
                    className="rounded-[18px] p-4 mb-4"
                    style={{
                      backgroundColor: 'rgba(225,192,102,0.1)',
                      borderColor: 'rgba(225,192,102,0.28)',
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-[12px] font-bold tracking-[1px] uppercase" style={{ color: '#E1C066' }}>
                      Birth data updated
                    </Text>
                    <Text className="text-[13px] leading-[20px] mt-1" style={{ color: 'rgba(238,226,188,0.86)' }}>
                      This report was regenerated from your latest birth profile change on {formatGeneratedAt(response.profileChangeNotice.profileUpdatedAt)}.
                    </Text>
                  </View>
                ) : null}

                <View
                  className="rounded-[20px] p-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[30px] leading-[38px] font-semibold tracking-tight" style={{ color: 'rgba(240,240,248,0.96)' }}>
                    {analysis.headline}
                  </Text>
                  <Text className="text-[16px] leading-[25px] mt-3" style={{ color: 'rgba(212,212,224,0.63)' }}>
                    {analysis.executiveSummary}
                  </Text>
                </View>

                <View
                  className="rounded-[16px] p-4 mt-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.035)',
                    borderColor: 'rgba(255,255,255,0.09)',
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[11px] font-bold tracking-[1.2px] uppercase" style={{ color: 'rgba(212,212,224,0.46)' }}>
                    Guidance note
                  </Text>
                  <Text className="text-[13px] leading-[20px] mt-2" style={{ color: 'rgba(212,212,224,0.64)' }}>
                    {FULL_NATAL_GUIDANCE_DISCLAIMER}
                  </Text>
                </View>

                <SectionTitle title="Career Archetypes" />
                <View className="gap-3">
                  {analysis.careerArchetypes.map((item) => (
                    <View
                      key={item.name}
                      className="rounded-[18px] p-4"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(255,255,255,0.09)',
                        borderWidth: 1,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-[23px] font-semibold tracking-tight" style={{ color: 'rgba(241,241,249,0.96)' }}>
                          {item.name}
                        </Text>
                        <Text className="text-[18px] font-bold" style={{ color: '#E1C066' }}>
                          {toPercent(item.score)}
                        </Text>
                      </View>
                      <View
                        className="h-[5px] rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <View
                          className="h-[5px] rounded-full"
                          style={{
                            width: toBarWidth(item.score),
                            backgroundColor: '#E1C066',
                          }}
                        />
                      </View>
                      <View className="flex-row flex-wrap gap-2 mt-3">
                        {item.evidence.map((evidence, index) => (
                          <View
                            key={`${item.name}-evidence-${index}`}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                          >
                            <Text className="text-[11px]" style={{ color: 'rgba(210,210,222,0.63)' }}>
                              {evidence}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <SectionTitle title="Your Strengths" />
                <View className="gap-3">
                  {analysis.strengths.map((item) => (
                    <View
                      key={item.title}
                      className="rounded-[18px] p-4"
                      style={{
                        backgroundColor: 'rgba(25,195,125,0.07)',
                        borderColor: 'rgba(25,195,125,0.28)',
                        borderWidth: 1,
                      }}
                    >
                      <View className="flex-row items-center mb-2">
                        <TrendingUp size={16} color="#19C37D" />
                        <Text className="text-[22px] font-semibold ml-2 tracking-tight" style={{ color: 'rgba(240,250,246,0.96)' }}>
                          {item.title}
                        </Text>
                      </View>
                      <Text className="text-[16px] leading-[23px]" style={{ color: 'rgba(204,230,220,0.83)' }}>
                        {item.details}
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mt-3">
                        {item.evidence.map((evidence, index) => (
                          <View
                            key={`${item.title}-evidence-${index}`}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(25,195,125,0.16)' }}
                          >
                            <Text className="text-[11px]" style={{ color: '#6DE9B5' }}>
                              {evidence}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <SectionTitle title="Blind Spots" />
                <View className="gap-3">
                  {analysis.blindSpots.map((item) => (
                    <View
                      key={item.title}
                      className="rounded-[18px] p-4"
                      style={{
                        backgroundColor: 'rgba(255,107,138,0.08)',
                        borderColor: 'rgba(255,107,138,0.24)',
                        borderWidth: 1,
                      }}
                    >
                      <Text className="text-[22px] font-semibold tracking-tight" style={{ color: '#FFC3CF' }}>
                        {item.title}
                      </Text>
                      <Text className="text-[11px] font-bold tracking-[1.2px] mt-2" style={{ color: 'rgba(255,139,164,0.85)' }}>
                        RISK
                      </Text>
                      <Text className="text-[15px] leading-[22px] mt-1" style={{ color: 'rgba(246,205,214,0.84)' }}>
                        {item.risk}
                      </Text>
                      <View
                        className="rounded-[12px] p-3 mt-3"
                        style={{ backgroundColor: 'rgba(13,18,26,0.45)', borderColor: 'rgba(25,195,125,0.2)', borderWidth: 1 }}
                      >
                        <Text className="text-[11px] font-bold tracking-[1.1px]" style={{ color: '#32D38A' }}>
                          MITIGATION
                        </Text>
                        <Text className="text-[14px] leading-[20px] mt-1" style={{ color: 'rgba(230,240,248,0.84)' }}>
                          {item.mitigation}
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 mt-3">
                        {item.evidence.map((evidence, index) => (
                          <View
                            key={`${item.title}-evidence-${index}`}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,107,138,0.12)' }}
                          >
                            <Text className="text-[11px]" style={{ color: '#FF9DB2' }}>
                              {evidence}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <SectionTitle title="Role Fit Matrix" />
                <View className="gap-3">
                  {analysis.roleFitMatrix.map((item) => (
                    <View
                      key={item.domain}
                      className="rounded-[18px] p-4"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(124,92,255,0.3)',
                        borderWidth: 1,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Orbit size={15} color="#8E72FF" />
                          <Text className="text-[22px] font-semibold ml-2 tracking-tight" style={{ color: 'rgba(240,240,248,0.96)' }}>
                            {item.domain}
                          </Text>
                        </View>
                        <Text className="text-[17px] font-bold" style={{ color: '#E1C066' }}>
                          {toPercent(item.fitScore)}
                        </Text>
                      </View>
                      <Text className="text-[15px] leading-[22px]" style={{ color: 'rgba(212,212,224,0.67)' }}>
                        {item.why}
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mt-3">
                        {item.exampleRoles.map((role, index) => (
                          <View
                            key={`${item.domain}-role-${index}`}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(124,92,255,0.14)' }}
                          >
                            <Text className="text-[11px]" style={{ color: '#A58EFF' }}>
                              {role}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <SectionTitle title="Phase Plan" />
                <View className="gap-3">
                  {analysis.phasePlan.map((phase) => {
                    const meta = PHASE_META[phase.phase] ?? PHASE_META['0_6_months'];
                    return (
                      <View
                        key={phase.phase}
                        className="rounded-[18px] p-4"
                        style={{
                          backgroundColor: meta.background,
                          borderColor: `${meta.accent}77`,
                          borderWidth: 1,
                        }}
                      >
                        <View className="self-start px-2 py-1 rounded-full mb-2" style={{ backgroundColor: `${meta.accent}20` }}>
                          <Text className="text-[10px] font-black uppercase tracking-[1.1px]" style={{ color: meta.accent }}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text className="text-[22px] leading-[29px] font-semibold tracking-tight mb-3" style={{ color: 'rgba(240,240,248,0.96)' }}>
                          {phase.goal}
                        </Text>

                        <Text className="text-[11px] tracking-[1.2px] font-bold mb-2" style={{ color: 'rgba(212,212,224,0.45)' }}>
                          ACTIONS
                        </Text>
                        <ListDots items={phase.actions} color={meta.accent} />

                        <Text className="text-[11px] tracking-[1.2px] font-bold mt-4 mb-2" style={{ color: 'rgba(212,212,224,0.45)' }}>
                          KPIS
                        </Text>
                        <ListDots items={phase.kpis} color="#3AD092" />

                        <Text className="text-[11px] tracking-[1.2px] font-bold mt-4 mb-2" style={{ color: 'rgba(212,212,224,0.45)' }}>
                          RISKS
                        </Text>
                        <ListDots items={phase.risks} color="#FF6B8A" />
                      </View>
                    );
                  })}
                </View>

                <SectionTitle title="Decision Rules" />
                <View
                  className="rounded-[18px] p-4"
                  style={{
                    backgroundColor: 'rgba(225,192,102,0.08)',
                    borderColor: 'rgba(225,192,102,0.24)',
                    borderWidth: 1,
                  }}
                >
                  <ListDots items={analysis.decisionRules} color="#E1C066" />
                </View>

                <SectionTitle title="Next 90 Days" />
                <View className="gap-2">
                  {analysis.next90DaysPlan.map((step, index) => (
                    <View
                      key={`${step}-${index}`}
                      className="rounded-[14px] px-3 py-3 flex-row items-start"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                      }}
                    >
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                        style={{ backgroundColor: 'rgba(124,92,255,0.2)' }}
                      >
                        <Text className="text-[12px] font-semibold" style={{ color: '#9A83FF' }}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 text-[14px] leading-[20px]" style={{ color: 'rgba(224,224,234,0.84)' }}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-6 pt-3 flex-row items-center flex-wrap gap-2" style={{ borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1 }}>
                  <CalendarDays size={12} color="rgba(212,212,224,0.45)" />
                  <Text className="text-[11px]" style={{ color: 'rgba(212,212,224,0.45)' }}>
                    {footerMeta}
                  </Text>
                  {response?.cached ? (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.56)' }}>
                        {SHOULD_EXPOSE_TECHNICAL_SURFACES ? 'Cached' : 'Saved'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      {screenState === 'loading' ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <FullScreenCosmicLoader
            title={loaderContent.title}
            subtitle={loaderContent.subtitle}
            steps={loaderContent.steps.length > 0 ? loaderContent.steps : FULL_NATAL_GENERATION_STEPS}
            activeStepIndex={loaderContent.activeStepIndex}
          />
        </View>
      ) : null}
    </View>
  );
};
