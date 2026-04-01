import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { User } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const SIGNS = [
  '\u2648\uFE0E',
  '\u2649\uFE0E',
  '\u264A\uFE0E',
  '\u264B\uFE0E',
  '\u264C\uFE0E',
  '\u264D\uFE0E',
  '\u264E\uFE0E',
  '\u264F\uFE0E',
  '\u2650\uFE0E',
  '\u2651\uFE0E',
  '\u2652\uFE0E',
  '\u2653\uFE0E',
];

type CosmicGlyphLoaderProps = {
  size?: number;
};

export const CosmicGlyphLoader = ({ size = 140 }: CosmicGlyphLoaderProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const gradientId = useRef(`cosmic-loader-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 19000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulseValue, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const haloOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.52],
  });
  const haloScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  const radius = size * 0.37;
  const signPositions = useMemo(
    () =>
      SIGNS.map((sign, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return { sign, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }),
    [radius]
  );

  const centerSize = size * 0.44;
  const haloSize = size * 0.62;
  const iconSize = Math.round(size * 0.18);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={`${gradientId}-gold`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(201,168,76,0.26)" stopOpacity="0.26" />
            <Stop offset="65%" stopColor="rgba(201,168,76,0.08)" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="rgba(201,168,76,0)" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${gradientId}-violet`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(90,58,204,0.2)" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="rgba(90,58,204,0)" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${gradientId}-violet)`} />
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${gradientId}-gold)`} />
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: spin }],
        }}
      >
        {signPositions.map((item, i) => (
          <Text
            key={`${item.sign}-${i}`}
            style={{
              position: 'absolute',
              left: size / 2 - 8,
              top: size / 2 - 8,
              transform: [{ translateX: item.x }, { translateY: item.y }],
              color: 'rgba(201,168,76,0.65)',
              fontSize: 14,
              textShadowColor: 'rgba(201,168,76,0.42)',
              textShadowRadius: 8,
            }}
          >
            {item.sign}
          </Text>
        ))}
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          width: haloSize,
          height: haloSize,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(201,168,76,0.34)',
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />

      <View
        style={{
          width: centerSize,
          height: centerSize,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(10,10,20,0.95)',
          borderWidth: 1,
          borderColor: 'rgba(201,168,76,0.4)',
        }}
      >
        <User size={iconSize} color="#C9A84C" strokeWidth={1.7} />
      </View>
    </View>
  );
};
