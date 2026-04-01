import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const signs = [
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

type ScannerRingProps = {
  size?: number;
};

export const ScannerRing = ({ size = 220 }: ScannerRingProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const radius = size / 2 - 18;

  const positions = useMemo(
    () =>
      signs.map((s, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return { s, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }),
    [radius]
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate: spin }],
          opacity: 0.15,
        }}
      >
        {positions.map((pos, i) => (
          <Text
            key={`${pos.s}-${i}`}
            style={{
              position: 'absolute',
              left: size / 2 + pos.x - 9,
              top: size / 2 + pos.y - 9,
              fontSize: 16,
              color: 'rgba(201,168,76,0.7)',
            }}
          >
            {pos.s}
          </Text>
        ))}
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 12}
            stroke="rgba(201,168,76,0.35)"
            strokeWidth="0.6"
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 38}
            stroke="rgba(90,58,204,0.35)"
            strokeWidth="0.5"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
