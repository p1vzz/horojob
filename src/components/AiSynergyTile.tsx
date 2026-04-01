import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Cpu, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { fetchDailyTransit, type DailyTransitResponse } from '../services/astrologyApi';
import { useAppTheme } from '../theme/ThemeModeProvider';
import {
  FALLBACK_AI_SYNERGY,
  resolveAiSynergyPalette,
  selectAiSynergyView,
  type AiSynergyView,
} from './aiSynergyTileCore';
import { AI_SYNERGY_HELIX_POINTS } from './aiSynergyTileVisuals';

export const AiSynergyTile = () => {
  const theme = useAppTheme();
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [synergy, setSynergy] = useState<AiSynergyView>(FALLBACK_AI_SYNERGY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const payload = await fetchDailyTransit();
        if (!mounted) return;
        setSynergy(selectAiSynergyView(payload.aiSynergy));
      } catch {
        if (mounted) setSynergy(FALLBACK_AI_SYNERGY);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const scanTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 110],
  });

  const { scoreColor, scoreSubColor } = resolveAiSynergyPalette(synergy.score);

  return (
    <View className="px-5 py-2">
      <View
        className="p-5 rounded-[24px] overflow-hidden relative"
        style={{
          backgroundColor: 'rgba(56,204,136,0.04)',
          borderColor: 'rgba(56,204,136,0.1)',
          borderWidth: 1,
        }}
      >
        <View className="absolute right-0 top-2.5 bottom-2.5 w-20">
          <Svg height="100%" width="80" viewBox="0 0 100 100">
            <G opacity="0.15">
              {AI_SYNERGY_HELIX_POINTS.map((p, i) => (
                <G key={i}>
                  <Circle cx={p.x1} cy={p.y} r="1.5" fill="#00FFCC" />
                  <Circle cx={p.x2} cy={p.y} r="1.5" fill="#00FFCC" />
                  {i % 2 === 0 ? (
                    <Line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="#00FFCC" strokeWidth="0.4" strokeDasharray="2 2" />
                  ) : null}
                </G>
              ))}
              <Path
                d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x1} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#00FFCC"
                strokeWidth="0.6"
                opacity="0.5"
              />
              <Path
                d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x2} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#00FFCC"
                strokeWidth="0.6"
                opacity="0.5"
              />
            </G>
          </Svg>
        </View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            transform: [{ translateY: scanTranslate }],
            opacity: 0.4,
            backgroundColor: 'transparent',
          }}
        >
          <LinearGradient
            colors={['transparent', '#00FFCC', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: 1 }}
          />
        </Animated.View>

        <View className="flex-row items-center mb-3">
          <Cpu size={15} color="#00FFCC" />
          <Text className="text-[13px] font-semibold ml-2" style={{ color: theme.colors.foreground }}>
            AI Synergy Score
          </Text>
        </View>

        <View className="flex-row items-baseline mb-1">
          <Text className="text-[44px] font-bold" style={{ color: scoreColor }}>{synergy.score}</Text>
          <Text className="text-[22px] font-bold ml-1" style={{ color: scoreSubColor }}>%</Text>
        </View>

        <Text className="text-[12px] mb-3" style={{ color: 'rgba(212,212,224,0.5)' }}>
          {synergy.headline}
        </Text>

        <Text className="text-[13px] leading-[20px] mb-4 pr-10" style={{ color: 'rgba(212,212,224,0.75)' }}>
          {synergy.description}
        </Text>

        <Text className="text-[11px] mb-3 pr-8" style={{ color: 'rgba(212,212,224,0.58)' }}>
          Next: {synergy.recommendations[0]}
        </Text>

        <View className="flex-row items-center mb-4">
          <Activity size={11} color="#00FFCC" style={{ opacity: 0.9, marginRight: 6 }} />
          <Text className="text-[10px] tracking-[1.5px] uppercase font-semibold" style={{ color: 'rgba(212,212,224,0.45)' }}>
            {isLoading ? 'Computing real-time synergy' : `Confidence ${synergy.confidence}%`}
          </Text>
        </View>
      </View>
    </View>
  );
};
