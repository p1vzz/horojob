import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { TrendingUp, Clock, Trophy, ShieldCheck } from 'lucide-react-native';

export type CompatibilityBreakdownItem = {
  key: string;
  label: string;
  score: number;
  note?: string;
};

type CompatibilityBreakdownProps = {
  items?: CompatibilityBreakdownItem[];
};

const colorPalette = ['#C9A84C', '#5A3ACC', '#38CC88', '#65B8FF', '#FF6B8A'];

const iconByKey: Record<string, typeof TrendingUp> = {
  role_fit: TrendingUp,
  growth_potential: Trophy,
  stress_load: Clock,
  ai_resilience: ShieldCheck,
};

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const CompatibilityBreakdown = ({ items }: CompatibilityBreakdownProps) => {
  const resolvedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 4).map((item) => ({ ...item, score: normalizeScore(item.score) }));
  }, [items]);

  const anim = useRef<Animated.Value[]>([]);
  if (anim.current.length !== resolvedItems.length) {
    anim.current = resolvedItems.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    anim.current.forEach((value) => value.setValue(0));
    const animations = anim.current.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 880,
        delay: 120 + index * 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.stagger(110, animations).start();
  }, [resolvedItems]);

  return (
    <View className="px-5 py-2">
      <Text className="text-[10px] uppercase tracking-[2px] mb-3" style={{ color: 'rgba(212,212,224,0.5)' }}>
        Compatibility Breakdown
      </Text>
      <View
        className="rounded-[16px] p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row justify-between">
        {resolvedItems.map((item, index) => {
            const color = colorPalette[index % colorPalette.length];
            const height = anim.current[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: [0, item.score],
            }) ?? item.score;
            const Icon = iconByKey[item.key] ?? TrendingUp;

            return (
              <View key={item.key} className="flex-1 items-center">
                <Text className="text-[12px] font-semibold mb-2" style={{ color }}>
                  {item.score}%
                </Text>
                <View
                  className="w-full rounded-[12px] overflow-hidden"
                  style={{ height: 100, backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height,
                      backgroundColor: `${color}55`,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />
                </View>
                <Icon size={14} color={color} style={{ marginTop: 8 }} />
                <Text className="text-[11px] mt-2 text-center" style={{ color: 'rgba(212,212,224,0.9)' }}>
                  {item.label}
                </Text>
                {item.note ? (
                  <Text
                    numberOfLines={2}
                    className="text-[9px] mt-1 text-center"
                    style={{ color: 'rgba(212,212,224,0.55)' }}
                  >
                    {item.note}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
        {resolvedItems.length === 0 ? (
          <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.5)' }}>
            Run a scan to see factor-level compatibility details.
          </Text>
        ) : null}
      </View>
    </View>
  );
};
