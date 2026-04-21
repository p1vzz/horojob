import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight, BrainCircuit, Crown, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeModeProvider';

type NatalPremiumInsightsCardProps = {
  onPress: () => void;
};

const FEATURE_ROWS = [
  {
    title: 'Deep Reports',
    detail: 'Full Career Blueprint with archetypes, role fit, blind spots, and 90-day strategy.',
    Icon: Sparkles,
    color: '#E6D96B',
  },
  {
    title: 'AI Insights',
    detail: 'Premium career insights with richer actions, AI work strategy, and daily synergy signals.',
    Icon: BrainCircuit,
    color: '#65B8FF',
  },
];

export function NatalPremiumInsightsCard({ onPress }: NatalPremiumInsightsCardProps) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View
        className="rounded-[8px] p-4 mt-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center mb-3">
          <View
            className="w-8 h-8 rounded-[8px] items-center justify-center mr-3"
            style={{ backgroundColor: 'rgba(201,168,76,0.13)' }}
          >
            <Crown size={15} color="#E6D96B" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold" style={{ color: theme.colors.foreground }}>
              Deep Reports & AI Insights
            </Text>
            <Text className="text-[11px] mt-0.5" style={{ color: 'rgba(212,212,224,0.56)' }}>
              Unlock the premium layer for your natal career chart.
            </Text>
          </View>
          <ArrowRight size={15} color="rgba(212,212,224,0.42)" />
        </View>

        {FEATURE_ROWS.map((row, index) => (
          <View
            key={row.title}
            className="flex-row items-start py-2"
            style={{
              borderTopColor: index === 0 ? 'transparent' : 'rgba(255,255,255,0.06)',
              borderTopWidth: index === 0 ? 0 : 1,
            }}
          >
            <View className="w-6 items-center mr-2 mt-0.5">
              <row.Icon size={14} color={row.color} />
            </View>
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
    </Pressable>
  );
}

