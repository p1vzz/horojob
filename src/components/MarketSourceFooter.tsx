import React from 'react';
import { Text, View } from 'react-native';
import type { OccupationInsightResponse } from '../services/marketApiCore';
import { CareerOneStopLogo } from './CareerOneStopLogo';
import { OnetLogo } from './OnetLogo';

type MarketSourceFooterProps = {
  market?: OccupationInsightResponse | null;
  markets?: Array<OccupationInsightResponse | null | undefined>;
  inset?: boolean;
};

export function MarketSourceFooter({ market, markets, inset = false }: MarketSourceFooterProps) {
  const sourceMarkets = [...(markets ?? []), market].filter(
    (item): item is OccupationInsightResponse => item !== null && item !== undefined && item.sources.length > 0
  );
  if (sourceMarkets.length === 0) return null;
  const labels = [
    ...new Set(sourceMarkets.flatMap((item) => item.sources.map((source) => source.label)).filter(Boolean)),
  ];
  return (
    <View className={inset ? 'pt-1 pb-3' : 'pt-1 pb-3'}>
      <View
        className="w-full rounded-[8px] px-3 py-2.5 border flex-row items-start"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <View className="mr-3 items-center" style={{ opacity: 0.9 }}>
          <View className="mb-2">
            <CareerOneStopLogo width={24} height={18} />
          </View>
          <View>
            <OnetLogo width={26} height={26} />
          </View>
        </View>
        <Text className="flex-1 text-[10px] leading-[15px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
          Market data provided by {labels.join(', ')}, with required public source attribution included. Horojob guidance is independently generated.
        </Text>
      </View>
    </View>
  );
}
