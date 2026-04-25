import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight, DollarSign, Handshake } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { fetchMarketCareerContext, type MarketCareerContextResponse } from '../services/astrologyApi';
import { useAppTheme } from '../theme/ThemeModeProvider';
import type { DashboardCareerFeaturePrerequisites } from '../hooks/useDashboardPrerequisites';
import { MarketSourceFooter } from './MarketSourceFooter';

type NegotiationPrepCardProps = {
  careerPrerequisites?: DashboardCareerFeaturePrerequisites;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export function NegotiationPrepCard({ careerPrerequisites }: NegotiationPrepCardProps) {
  const theme = useAppTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const isBlocked = careerPrerequisites?.isReadyForCareerFeatures === false;
  const canPressAction = !isBlocked || careerPrerequisites?.reason !== 'checking';
  const [state, setState] = useState<LoadState>('idle');
  const [context, setContext] = useState<MarketCareerContextResponse | null>(null);

  useEffect(() => {
    if (isBlocked) {
      setContext(null);
      setState('idle');
      return;
    }

    let mounted = true;
    setState('loading');
    void fetchMarketCareerContext()
      .then((payload) => {
        if (!mounted) return;
        setContext(payload);
        setState('ready');
      })
      .catch(() => {
        if (!mounted) return;
        setContext(null);
        setState('error');
      });

    return () => {
      mounted = false;
    };
  }, [isBlocked]);

  const prep = context?.negotiationPrep ?? null;
  const guidance = useMemo(() => prep?.guidance.slice(0, 3) ?? [], [prep]);

  const handlePress = () => {
    if (isBlocked) {
      navigation.navigate('NatalChart');
      return;
    }
    navigation.navigate('NegotiationPrep');
  };

  const summary = isBlocked
    ? careerPrerequisites?.blockBody ?? 'Generate your natal chart first to prepare market-backed negotiation guidance.'
    : state === 'loading'
      ? 'Preparing a market range anchor from public U.S. labor-market data.'
      : prep?.summary ?? 'Market-backed negotiation guidance is not ready yet. Check again after your career map refreshes.';
  const actionLabel = isBlocked ? careerPrerequisites?.actionLabel ?? 'Open Natal Chart' : 'Open Prep';

  return (
    <View className="px-5 py-2">
      <View
        className="p-5 rounded-[24px]"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center mb-3">
          <Handshake size={16} color="#19C37D" />
          <Text className="text-[13px] font-semibold ml-2 flex-1" style={{ color: theme.colors.foreground }}>
            Negotiation Prep
          </Text>
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(25,195,125,0.11)' }}>
            <Text className="text-[10px] font-bold" style={{ color: '#6DE9B5' }}>
              FREE
            </Text>
          </View>
        </View>

        <Text className="text-[12px] leading-[18px]" style={{ color: 'rgba(212,212,224,0.58)' }}>
          {summary}
        </Text>

        {prep && state === 'ready' ? (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {prep.salaryRangeLabel ? (
              <View className="px-2 py-1 rounded-[8px] flex-row items-center" style={{ backgroundColor: 'rgba(25,195,125,0.11)' }}>
                <DollarSign size={11} color="#19C37D" />
                <Text className="text-[11px] font-semibold ml-1" style={{ color: '#6DE9B5' }}>
                  {prep.salaryRangeLabel}
                </Text>
              </View>
            ) : null}
            <View className="px-2 py-1 rounded-[8px]" style={{ backgroundColor: 'rgba(101,184,255,0.1)' }}>
              <Text className="text-[11px] font-semibold" style={{ color: '#84C7FF' }}>
                {prep.salaryVisibilityLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {guidance.length > 0 ? (
          <View className="mt-3 gap-2">
            {guidance.map((item) => (
              <View key={item} className="flex-row items-start">
                <Text style={{ color: '#19C37D', fontSize: 12, marginRight: 8, marginTop: 1 }}>{'\u2022'}</Text>
                <Text className="flex-1 text-[12px] leading-[18px]" style={{ color: 'rgba(224,224,234,0.78)' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {prep?.market ? <MarketSourceFooter market={prep.market} inset /> : null}

        <View className="flex-row items-center mt-2">
          <Text className="flex-1 text-[11px] leading-[16px] pr-3" style={{ color: 'rgba(212,212,224,0.42)' }}>
            Use this as a market anchor, not a guarantee.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handlePress}
            disabled={!canPressAction}
            className="flex-row items-center rounded-[8px] px-3 py-2 border"
            style={{
              opacity: canPressAction ? 1 : 0.62,
              backgroundColor: 'rgba(25,195,125,0.08)',
              borderColor: 'rgba(25,195,125,0.16)',
            }}
          >
            <Text className="text-[11px] font-semibold mr-1.5" style={{ color: '#6DE9B5' }}>
              {actionLabel}
            </Text>
            <ArrowRight size={13} color="#6DE9B5" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
