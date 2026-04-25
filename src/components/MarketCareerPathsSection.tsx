import React from 'react';
import { Text, View } from 'react-native';
import { DollarSign, TrendingUp } from 'lucide-react-native';
import type { MarketCareerPath } from '../services/astrologyApi';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { MarketSourceFooter } from './MarketSourceFooter';

type MarketCareerPathsSectionProps = {
  paths: MarketCareerPath[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  showSourceFooter?: boolean;
};

function toPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function gradientLabel(path: MarketCareerPath) {
  switch (path.marketGradient) {
    case 'high_upside':
      return { label: 'High upside', color: '#19C37D', bg: 'rgba(25,195,125,0.12)' };
    case 'steady_growth':
      return { label: 'Steady growth', color: '#65B8FF', bg: 'rgba(101,184,255,0.12)' };
    case 'stable_floor':
      return { label: 'Stable floor', color: '#E1C066', bg: 'rgba(225,192,102,0.13)' };
    case 'niche_path':
      return { label: 'Niche path', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)' };
    default:
      return { label: 'Limited data', color: 'rgba(212,212,224,0.62)', bg: 'rgba(255,255,255,0.06)' };
  }
}

function demandLabel(path: MarketCareerPath) {
  if (!path.demandLabel || path.demandLabel === 'unknown') return null;
  return `${path.demandLabel[0].toUpperCase()}${path.demandLabel.slice(1)} demand`;
}

function MarketPathSkeleton() {
  return (
    <View
      className="rounded-[16px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <Text className="text-[13px] font-semibold" style={{ color: 'rgba(240,240,248,0.82)' }}>
        Loading market-backed paths...
      </Text>
      <Text className="text-[12px] leading-[18px] mt-2" style={{ color: 'rgba(212,212,224,0.54)' }}>
        Salary ranges and demand signals are being checked against public U.S. labor-market data.
      </Text>
    </View>
  );
}

export function MarketCareerPathsSection({
  paths,
  title = 'MARKET-BACKED PATHS',
  subtitle = 'Career directions paired with public U.S. salary and demand context.',
  loading = false,
  showSourceFooter = true,
}: MarketCareerPathsSectionProps) {
  const theme = useAppTheme();
  const visiblePaths = paths.filter((path) => path.title.trim().length > 0);
  if (!loading && visiblePaths.length === 0) return null;

  return (
    <View className="mt-5">
      <Text
        className="text-[11px] tracking-[2.3px] font-semibold mb-2 px-1"
        style={{ color: 'rgba(212,212,224,0.36)' }}
      >
        {title}
      </Text>
      <Text className="text-[12px] leading-[18px] mb-3 px-1" style={{ color: 'rgba(212,212,224,0.52)' }}>
        {subtitle}
      </Text>

      <View className="gap-3">
        {loading && visiblePaths.length === 0 ? <MarketPathSkeleton /> : null}
        {visiblePaths.map((path) => {
          const gradient = gradientLabel(path);
          const demand = demandLabel(path);
          return (
            <View
              key={path.slug || path.title}
              className="rounded-[16px] p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.035)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[17px] font-semibold" style={{ color: theme.colors.foreground }}>
                    {path.title}
                  </Text>
                  <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.48)' }}>
                    {path.domain}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[17px] font-bold" style={{ color: '#E1C066' }}>
                    {toPercent(path.fitScore)}
                  </Text>
                  <Text className="text-[10px]" style={{ color: 'rgba(212,212,224,0.45)' }}>
                    {path.fitLabel}
                  </Text>
                </View>
              </View>

              <Text className="text-[13px] leading-[19px] mt-3" style={{ color: 'rgba(212,212,224,0.64)' }}>
                {path.rationale}
              </Text>

              <View className="flex-row flex-wrap gap-2 mt-3">
                {path.salaryRangeLabel ? (
                  <View className="px-2 py-1 rounded-[8px] flex-row items-center" style={{ backgroundColor: 'rgba(25,195,125,0.11)' }}>
                    <DollarSign size={11} color="#19C37D" />
                    <Text className="text-[11px] font-semibold ml-1" style={{ color: '#6DE9B5' }}>
                      {path.salaryRangeLabel}
                    </Text>
                  </View>
                ) : null}
                <View className="px-2 py-1 rounded-[8px] flex-row items-center" style={{ backgroundColor: gradient.bg }}>
                  <TrendingUp size={11} color={gradient.color} />
                  <Text className="text-[11px] font-semibold ml-1" style={{ color: gradient.color }}>
                    {gradient.label}
                  </Text>
                </View>
                {demand ? (
                  <View className="px-2 py-1 rounded-[8px]" style={{ backgroundColor: 'rgba(101,184,255,0.1)' }}>
                    <Text className="text-[11px] font-semibold" style={{ color: '#84C7FF' }}>
                      {demand}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                className="rounded-[12px] p-3 mt-3"
                style={{
                  backgroundColor: 'rgba(9,9,18,0.34)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px] font-bold tracking-[1px]" style={{ color: 'rgba(212,212,224,0.42)' }}>
                  DEVELOPMENT VECTOR
                </Text>
                <Text className="text-[13px] leading-[19px] mt-1" style={{ color: 'rgba(224,224,234,0.78)' }}>
                  {path.developmentVector}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-3">
                {path.exampleRoles.slice(0, 4).map((role) => (
                  <View key={`${path.slug}-${role}`} className="px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(124,92,255,0.14)' }}>
                    <Text className="text-[11px]" style={{ color: '#A58EFF' }}>
                      {role}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {showSourceFooter ? <MarketSourceFooter markets={visiblePaths.map((path) => path.market)} inset /> : null}
    </View>
  );
}
