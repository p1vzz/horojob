import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, BriefcaseBusiness, ChevronLeft, ClipboardCheck, DollarSign, MessageSquareText, ShieldAlert } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { AppNavigationProp } from '../types/navigation';
import { ApiError } from '../services/authSession';
import { fetchMarketCareerContext, type MarketCareerContextResponse, type NegotiationPrepGuidance } from '../services/astrologyApi';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { MarketSourceFooter } from '../components/MarketSourceFooter';

type ScreenState = 'loading' | 'ready' | 'error';

const { width, height } = Dimensions.get('window');

function extractApiCode(error: ApiError) {
  const payload = error.payload;
  if (!payload || typeof payload !== 'object') return null;
  const code = (payload as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      className="text-[11px] tracking-[2.4px] font-semibold mt-6 mb-3 px-1 uppercase"
      style={{ color: 'rgba(212,212,224,0.42)' }}
    >
      {title}
    </Text>
  );
}

function ListRows({ items, accent = '#19C37D' }: { items: string[]; accent?: string }) {
  if (items.length === 0) {
    return (
      <Text className="text-[13px] leading-[19px]" style={{ color: 'rgba(212,212,224,0.52)' }}>
        This section will update when more market context is available.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {items.map((item) => (
        <View key={item} className="flex-row items-start">
          <Text style={{ color: accent, fontSize: 13, marginRight: 8, marginTop: 2 }}>{'\u2022'}</Text>
          <Text className="flex-1 text-[13px] leading-[19px]" style={{ color: 'rgba(224,224,234,0.84)' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ScriptCard({ label, script }: { label: string; script: string }) {
  return (
    <View
      className="rounded-[14px] p-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(101,184,255,0.16)',
        borderWidth: 1,
      }}
    >
      <Text className="text-[11px] font-bold tracking-[1px] uppercase" style={{ color: '#84C7FF' }}>
        {label}
      </Text>
      <Text className="text-[13px] leading-[20px] mt-2" style={{ color: 'rgba(224,224,234,0.84)' }}>
        {script}
      </Text>
    </View>
  );
}

function HeroSummary({ prep }: { prep: NegotiationPrepGuidance }) {
  return (
    <View
      className="rounded-[20px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[29px] leading-[36px] font-semibold" style={{ color: 'rgba(240,240,248,0.96)' }}>
            Negotiation Prep
          </Text>
          <Text className="text-[13px] leading-[20px] mt-2" style={{ color: 'rgba(212,212,224,0.62)' }}>
            {prep.summary}
          </Text>
        </View>
        <View
          className="w-11 h-11 rounded-[14px] items-center justify-center"
          style={{
            backgroundColor: 'rgba(25,195,125,0.11)',
            borderColor: 'rgba(25,195,125,0.2)',
            borderWidth: 1,
          }}
        >
          <DollarSign size={20} color="#19C37D" />
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-4">
        {prep.salaryRangeLabel ? (
          <View className="px-3 py-1.5 rounded-[10px]" style={{ backgroundColor: 'rgba(25,195,125,0.12)' }}>
            <Text className="text-[12px] font-semibold" style={{ color: '#6DE9B5' }}>
              {prep.salaryRangeLabel}
            </Text>
          </View>
        ) : null}
        <View className="px-3 py-1.5 rounded-[10px]" style={{ backgroundColor: 'rgba(101,184,255,0.1)' }}>
          <Text className="text-[12px] font-semibold" style={{ color: '#84C7FF' }}>
            {prep.salaryVisibilityLabel}
          </Text>
        </View>
        {prep.sourceRoleTitle ? (
          <View className="px-3 py-1.5 rounded-[10px]" style={{ backgroundColor: 'rgba(124,92,255,0.13)' }}>
            <Text className="text-[12px] font-semibold" style={{ color: '#A58EFF' }}>
              {prep.sourceRoleTitle}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function NegotiationPrepScreen() {
  const { theme } = useThemeMode();
  const navigation = useNavigation<AppNavigationProp<'NegotiationPrep'>>();
  const [state, setState] = useState<ScreenState>('loading');
  const [context, setContext] = useState<MarketCareerContextResponse | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setErrorCode(null);
    try {
      const payload = await fetchMarketCareerContext();
      setContext(payload);
      setState('ready');
    } catch (error) {
      setContext(null);
      setErrorCode(error instanceof ApiError ? extractApiCode(error) : null);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prep = context?.negotiationPrep ?? null;
  const marketPath = context?.marketCareerPaths[0] ?? null;
  const anchorRoleTitle = prep?.sourceRoleTitle ?? marketPath?.sourceRoleTitle ?? marketPath?.title ?? null;
  const tradeoffRows = useMemo(() => prep?.tradeoffLevers.slice(0, 8) ?? [], [prep]);
  const setupMissing = errorCode === 'birth_profile_missing' || errorCode === 'natal_chart_missing';

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient id="negotiationGradTop" cx="42%" cy="-5%" rx="72%" ry="52%" fx="42%" fy="-5%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(25,195,125,0.18)" stopOpacity="0.18" />
              <Stop offset="55%" stopColor="rgba(25,195,125,0.05)" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="negotiationGradBottom" cx="88%" cy="106%" rx="70%" ry="48%" fx="88%" fy="106%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(101,184,255,0.16)" stopOpacity="0.16" />
              <Stop offset="62%" stopColor="rgba(101,184,255,0.04)" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#negotiationGradTop)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#negotiationGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-5 pt-2" style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }}>
            <View className="flex-row items-center mb-5">
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
                  Negotiation Prep
                </Text>
                <Text className="text-[10px] font-bold mt-1 tracking-[1.2px]" style={{ color: '#6DE9B5' }}>
                  FREE MARKET TOOL
                </Text>
              </View>
            </View>

            {state === 'loading' ? (
              <View
                className="rounded-[20px] p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[20px] font-semibold" style={{ color: 'rgba(240,240,248,0.95)' }}>
                  Preparing your market anchor
                </Text>
                <Text className="text-[13px] leading-[20px] mt-2" style={{ color: 'rgba(212,212,224,0.6)' }}>
                  Checking salary range, pay visibility, and negotiation talking points.
                </Text>
              </View>
            ) : null}

            {state === 'error' ? (
              <View
                className="rounded-[20px] p-4"
                style={{
                  backgroundColor: 'rgba(255,107,138,0.1)',
                  borderColor: 'rgba(255,107,138,0.26)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[20px] font-semibold" style={{ color: '#FFD2DC' }}>
                  {setupMissing ? 'Career map needed first' : 'Could not load prep'}
                </Text>
                <Text className="text-[13px] leading-[20px] mt-2" style={{ color: '#FF9AB0' }}>
                  {setupMissing
                    ? 'Generate your natal chart first so we can match the prep to a market-backed career path.'
                    : 'Market-backed negotiation guidance is temporarily unavailable.'}
                </Text>
                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    onPress={() => {
                      if (setupMissing) {
                        navigation.navigate('NatalChart');
                        return;
                      }
                      void load();
                    }}
                    className="rounded-[12px] px-4 py-2 flex-row items-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)', borderWidth: 1 }}
                  >
                    <Text className="text-[12px] font-semibold mr-2" style={{ color: 'rgba(244,244,252,0.92)' }}>
                      {setupMissing ? 'Open Natal Chart' : 'Retry'}
                    </Text>
                    <ArrowRight size={13} color="rgba(244,244,252,0.92)" />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {state === 'ready' && prep ? (
              <View>
                <HeroSummary prep={prep} />

                <SectionTitle title="Anchor Strategy" />
                <View
                  className="rounded-[18px] p-4"
                  style={{
                    backgroundColor: 'rgba(25,195,125,0.07)',
                    borderColor: 'rgba(25,195,125,0.24)',
                    borderWidth: 1,
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <BriefcaseBusiness size={15} color="#19C37D" />
                    <Text className="text-[17px] font-semibold ml-2" style={{ color: 'rgba(240,250,246,0.96)' }}>
                      {prep.anchorStrategy.label}
                    </Text>
                  </View>
                  <Text className="text-[13px] leading-[20px]" style={{ color: 'rgba(204,230,220,0.84)' }}>
                    {prep.anchorStrategy.explanation}
                  </Text>
                  <View
                    className="rounded-[12px] p-3 mt-3"
                    style={{ backgroundColor: 'rgba(9,9,18,0.36)', borderColor: 'rgba(25,195,125,0.18)', borderWidth: 1 }}
                  >
                    <Text className="text-[10px] font-bold tracking-[1px]" style={{ color: '#6DE9B5' }}>
                      TALKING POINT
                    </Text>
                    <Text className="text-[13px] leading-[20px] mt-1" style={{ color: 'rgba(224,224,234,0.84)' }}>
                      {prep.anchorStrategy.talkingPoint}
                    </Text>
                  </View>
                </View>

                <SectionTitle title="Recruiter Questions" />
                <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1 }}>
                  <ListRows items={prep.recruiterQuestions} accent="#84C7FF" />
                </View>

                <SectionTitle title="Scripts" />
                {prep.salaryExpectationScripts.length > 0 ? (
                  <View className="gap-3">
                    {prep.salaryExpectationScripts.map((script) => (
                      <ScriptCard key={script.label} label={script.label} script={script.script} />
                    ))}
                  </View>
                ) : (
                  <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1 }}>
                    <ListRows items={[]} />
                  </View>
                )}

                <SectionTitle title="Offer Checklist" />
                <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(225,192,102,0.08)', borderColor: 'rgba(225,192,102,0.22)', borderWidth: 1 }}>
                  <View className="flex-row items-center mb-3">
                    <ClipboardCheck size={15} color="#E1C066" />
                    <Text className="text-[16px] font-semibold ml-2" style={{ color: '#F0D78D' }}>
                      Compare the whole package
                    </Text>
                  </View>
                  <ListRows items={prep.offerChecklist} accent="#E1C066" />
                </View>

                <SectionTitle title="Red Flags" />
                <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(255,107,138,0.08)', borderColor: 'rgba(255,107,138,0.22)', borderWidth: 1 }}>
                  <View className="flex-row items-center mb-3">
                    <ShieldAlert size={15} color="#FF9FB4" />
                    <Text className="text-[16px] font-semibold ml-2" style={{ color: '#FFC3CF' }}>
                      Watch before accepting
                    </Text>
                  </View>
                  <ListRows items={prep.redFlags} accent="#FF9FB4" />
                </View>

                <SectionTitle title="Tradeoff Levers" />
                {tradeoffRows.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {tradeoffRows.map((item) => (
                      <View key={item} className="px-3 py-2 rounded-[10px]" style={{ backgroundColor: 'rgba(124,92,255,0.13)', borderColor: 'rgba(124,92,255,0.2)', borderWidth: 1 }}>
                        <Text className="text-[12px] font-semibold" style={{ color: '#A58EFF' }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1 }}>
                    <ListRows items={[]} />
                  </View>
                )}

                <SectionTitle title="Next Steps" />
                <View className="rounded-[18px] p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)', borderWidth: 1 }}>
                  <ListRows items={prep.nextSteps} accent="#19C37D" />
                </View>

                <View className="mt-5 flex-row gap-2">
                  <Pressable
                    onPress={() => navigation.navigate('Scanner')}
                    className="flex-1 rounded-[14px] px-4 py-3 flex-row items-center justify-center"
                    style={{ backgroundColor: 'rgba(25,195,125,0.12)', borderColor: 'rgba(25,195,125,0.22)', borderWidth: 1 }}
                  >
                    <MessageSquareText size={14} color="#6DE9B5" />
                    <Text className="text-[13px] font-semibold ml-2" style={{ color: '#6DE9B5' }}>
                      Check a Posting
                    </Text>
                  </Pressable>
                </View>

                {anchorRoleTitle ? (
                  <Text className="text-[11px] leading-[16px] mt-4" style={{ color: 'rgba(212,212,224,0.42)' }}>
                    This prep is anchored to {anchorRoleTitle}. Use it as market context, not a guaranteed offer outcome.
                  </Text>
                ) : null}

                <MarketSourceFooter market={prep.market} inset />
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
