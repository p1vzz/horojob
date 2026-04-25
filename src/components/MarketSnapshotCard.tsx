import React from 'react';
import { Text, View } from 'react-native';
import { BriefcaseBusiness, DollarSign, TrendingUp } from 'lucide-react-native';
import type { OccupationInsightResponse } from '../services/marketApiCore';

type MarketSnapshotCardProps = {
  market: OccupationInsightResponse | null;
};

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function formatSalary(market: OccupationInsightResponse) {
  const salary = market.salary;
  if (!salary) return 'Salary data unavailable';
  const min = formatMoney(salary.min);
  const max = formatMoney(salary.max);
  const median = formatMoney(salary.median);
  if (min && max) return `${min} - ${max}`;
  if (median) return `${median} median`;
  return 'Salary data unavailable';
}

function formatDemand(market: OccupationInsightResponse) {
  const openings = market.outlook.projectedOpenings;
  if (typeof openings === 'number' && Number.isFinite(openings)) {
    return `${Math.round(openings).toLocaleString()} annual openings`;
  }
  return market.outlook.growthLabel ?? 'Demand data unavailable';
}

export function MarketSnapshotCard({ market }: MarketSnapshotCardProps) {
  if (!market) return null;

  const skills = market.skills.slice(0, 4);

  return (
    <View className="px-5 py-2">
      <View
        className="rounded-[8px] p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(124,229,176,0.16)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-start">
          <View
            className="w-10 h-10 rounded-[8px] items-center justify-center mr-3"
            style={{
              backgroundColor: 'rgba(124,229,176,0.12)',
              borderColor: 'rgba(124,229,176,0.28)',
              borderWidth: 1,
            }}
          >
            <BriefcaseBusiness size={17} color="#8AF0C2" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] uppercase tracking-[1.8px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
              Market Snapshot
            </Text>
            <Text className="text-[14px] font-semibold mt-1" style={{ color: 'rgba(233,233,242,0.94)' }}>
              {market.occupation.title}
            </Text>
            <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.56)' }}>
              {market.labels.marketScore}
            </Text>
          </View>
        </View>

        <View className="flex-row mt-4">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center mb-1">
              <DollarSign size={13} color="#E6CA73" />
              <Text className="text-[10px] uppercase ml-1" style={{ color: 'rgba(212,212,224,0.48)' }}>
                Salary
              </Text>
            </View>
            <Text className="text-[13px] font-semibold" style={{ color: '#E6CA73' }}>
              {formatSalary(market)}
            </Text>
          </View>
          <View className="flex-1 ml-2">
            <View className="flex-row items-center mb-1">
              <TrendingUp size={13} color="#8AC9FF" />
              <Text className="text-[10px] uppercase ml-1" style={{ color: 'rgba(212,212,224,0.48)' }}>
                Demand
              </Text>
            </View>
            <Text className="text-[13px] font-semibold" style={{ color: '#8AC9FF' }}>
              {formatDemand(market)}
            </Text>
          </View>
        </View>

        {skills.length > 0 ? (
          <View className="flex-row flex-wrap mt-3">
            {skills.map((skill) => (
              <View
                key={`${skill.sourceProvider}:${skill.name}`}
                className="px-2.5 py-1 rounded-full mr-2 mb-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px] font-medium" style={{ color: 'rgba(233,233,242,0.82)' }}>
                  {skill.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
