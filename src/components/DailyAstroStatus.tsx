import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Flame, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Rect, RadialGradient, vec, Blur, Group } from '@shopify/react-native-skia';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect as SvgRect } from 'react-native-svg';
import { fetchDailyTransit } from '../services/astrologyApi';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../utils/brightnessAdaptation';

const FALLBACK_TRANSIT = {
  title: 'Mars in 10th House',
  modeLabel: 'High Execution Mode',
  summary: 'Perfect for closing deals, avoid micro-management.',
  metrics: {
    energy: 92,
    focus: 78,
    luck: 65,
  },
};

export const DailyAstroStatus = ({ onReady }: { onReady?: () => void }) => {
  const theme = useAppTheme();
  const { channels } = useBrightnessAdaptation();
  const [transit, setTransit] = useState(FALLBACK_TRANSIT);
  const [isLoading, setIsLoading] = useState(true);
  const [typed, setTyped] = useState('');
  const hasSignaledReadyRef = React.useRef(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const payload = await fetchDailyTransit();
        if (!mounted) return;
        setTransit({
          title: payload.transit.title,
          modeLabel: payload.transit.modeLabel,
          summary: payload.transit.summary,
          metrics: {
            energy: payload.transit.metrics.energy,
            focus: payload.transit.metrics.focus,
            luck: payload.transit.metrics.luck,
          },
        });
      } catch {
        if (mounted) {
          setTransit(FALLBACK_TRANSIT);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= transit.summary.length) {
        setTyped(transit.summary.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [transit.summary]);

  useEffect(() => {
    if (!isLoading && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [isLoading, onReady]);

  return (
    <View className="px-5 py-2">
      <LinearGradient
        colors={[
          adaptColorOpacity('rgba(201,168,76,0.06)', channels.glowOpacityMultiplier),
          adaptColorOpacity('rgba(90,58,204,0.06)', channels.glowOpacityMultiplier),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 rounded-[24px] overflow-hidden relative"
        style={{
          borderWidth: 1,
          borderColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.borderOpacityMultiplier),
        }}
      >
        <LinearGradient
          colors={[
            adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
            'transparent',
            adaptColorOpacity('rgba(0,0,0,0.15)', channels.glowOpacityMultiplier),
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: adaptOpacity(0.6, channels.glowOpacityMultiplier),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -70,
            top: -70,
            width: 240,
            height: 240,
          }}
        >
          <LinearGradient
            colors={[
              adaptColorOpacity('rgba(201,168,76,0.35)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.12)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.03)', channels.glowOpacityMultiplier),
              adaptColorOpacity('rgba(201,168,76,0.0)', channels.glowOpacityMultiplier),
            ]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.9, y: 0.9 }}
            style={{
              width: 240,
              height: 240,
              borderRadius: 999,
              opacity: adaptOpacity(0.08, channels.glowOpacityMultiplier),
            }}
          />
          {Platform.OS === 'web' ? (
            <Svg
              width={240}
              height={240}
              style={{
                position: 'absolute',
                opacity: adaptOpacity(0.18, channels.glowOpacityMultiplier),
              }}
            >
              <Defs>
                <SvgRadialGradient id="astroRingsWeb" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={adaptColorOpacity('rgba(201,168,76,0.65)', channels.glowOpacityMultiplier)} />
                  <Stop offset="26%" stopColor={adaptColorOpacity('rgba(201,168,76,0.22)', channels.glowOpacityMultiplier)} />
                  <Stop offset="36%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="48%" stopColor={adaptColorOpacity('rgba(201,168,76,0.18)', channels.glowOpacityMultiplier)} />
                  <Stop offset="58%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="70%" stopColor={adaptColorOpacity('rgba(201,168,76,0.14)', channels.glowOpacityMultiplier)} />
                  <Stop offset="80%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                  <Stop offset="100%" stopColor={adaptColorOpacity('rgba(201,168,76,0.00)', channels.glowOpacityMultiplier)} />
                </SvgRadialGradient>
              </Defs>
              <SvgRect x="0" y="0" width="240" height="240" fill="url(#astroRingsWeb)" />
            </Svg>
          ) : (
            <Canvas style={{ position: 'absolute', width: 240, height: 240, top: -60, right: -60 }}>
              <Group transform={[{ scaleX: 1.5 }, { scaleY: 0.8 }, { rotate: Math.PI / 4 }]}>
                <Rect x={0} y={0} width={100} height={100}>
                  <RadialGradient
                    c={vec(180, 60)}
                    r={150}
                    colors={[
                      adaptColorOpacity('rgba(201,168,76,0.35)', channels.glowOpacityMultiplier),
                      adaptColorOpacity('rgba(201,168,76,0.10)', channels.glowOpacityMultiplier),
                      'transparent',
                    ]}
                    positions={[0, 0.4, 1]}
                  />
                </Rect>
                <Blur blur={20} />
              </Group>
            </Canvas>
          )}
        </View>

        <View className="flex-row items-center mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(201,168,76,0.15)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <Flame size={13} color={theme.colors.gold} style={{ marginRight: 6 }} />
            <Text className="text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ color: theme.colors.gold }}>
              Career Vibe
            </Text>
          </View>
          <Text
            className="text-[10px] ml-auto"
            style={{ color: adaptColorOpacity('rgba(212,212,224,0.4)', channels.textOpacityMultiplier) }}
          >
            {isLoading ? 'Syncing...' : 'Today'}
          </Text>
        </View>

        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Zap size={16} color={theme.colors.gold} style={{ marginRight: 6 }} />
            <Text className="text-[16px] font-semibold tracking-tight" style={{ color: theme.colors.foreground }}>
              {transit.title}
            </Text>
          </View>

          <View className="mb-3">
            <View
              className="px-2.5 py-0.5 rounded-md self-start"
              style={{
                backgroundColor: adaptColorOpacity('rgba(201,168,76,0.1)', channels.glowOpacityMultiplier),
                borderColor: adaptColorOpacity('rgba(201,168,76,0.15)', channels.borderOpacityMultiplier),
                borderWidth: 1,
              }}
            >
              <Text className="text-[12px] font-semibold" style={{ color: theme.colors.gold }}>
                {transit.modeLabel}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center min-h-[44px]">
            <Text
              className="text-[14px] leading-[22px]"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.75)', channels.textOpacityMultiplier) }}
            >
              {typed}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          {[
            { label: 'Energy', value: transit.metrics.energy, color: '#C9A84C' },
            { label: 'Focus', value: transit.metrics.focus, color: '#5A3ACC' },
            { label: 'Luck', value: transit.metrics.luck, color: '#38CC88' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text
                  className="text-[10px] uppercase tracking-[1px] font-semibold"
                  style={{ color: adaptColorOpacity('rgba(212,212,224,0.45)', channels.textOpacityMultiplier) }}
                >
                  {stat.label}
                </Text>
                <Text className="text-[10px] font-bold" style={{ color: stat.color }}>
                  {stat.value}%
                </Text>
              </View>
              <View
                className="h-1 rounded-full overflow-hidden"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,255,255,0.06)', channels.glowOpacityMultiplier),
                }}
              >
                <View
                  className="h-full rounded-full"
                  style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
                />
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};
