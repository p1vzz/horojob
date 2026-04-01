import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AiRiskMeterProps = {
  riskScore?: number;
  summary?: string;
};

function normalizeRisk(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskVisual(score: number) {
  if (score <= 30) {
    return {
      label: 'Low',
      accent: '#38CC88',
      colors: ['#38CC88', '#38CC88', '#C9A84C'] as const,
    };
  }
  if (score <= 60) {
    return {
      label: 'Medium',
      accent: '#C9A84C',
      colors: ['#38CC88', '#C9A84C', '#C9A84C'] as const,
    };
  }
  return {
    label: 'High',
    accent: '#FF6B8A',
    colors: ['#C9A84C', '#FF8C5A', '#FF6B8A'] as const,
  };
}

export const AiRiskMeter = ({ riskScore = 0, summary }: AiRiskMeterProps) => {
  const score = normalizeRisk(riskScore);
  const visual = riskVisual(score);
  const meterWidth: `${number}%` = `${Math.max(8, score)}%`;

  return (
    <View className="px-5 py-2">
      <View
        className="rounded-[16px] p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <ShieldCheck size={14} color={visual.accent} />
            <Text className="text-[10px] uppercase tracking-[2px] ml-2" style={{ color: 'rgba(212,212,224,0.55)' }}>
              AI Displacement Risk
            </Text>
          </View>
          <Text className="text-[12px] font-semibold" style={{ color: visual.accent }}>
            {visual.label} - {score}%
          </Text>
        </View>

        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <LinearGradient
            colors={visual.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: meterWidth, height: '100%', borderRadius: 999 }}
          />
        </View>

        <Text className="mt-2 text-[11px]" style={{ color: `${visual.accent}CC` }}>
          {summary ?? 'Summary is unavailable for this scan result.'}
        </Text>
      </View>
    </View>
  );
};
