import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeModeProvider';

type MatchScoreGaugeProps = {
  score?: number;
  size?: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const MatchScoreGauge = ({ score = 0, size = 150 }: MatchScoreGaugeProps) => {
  const theme = useAppTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: score,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, score]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    return () => {
      progress.removeListener(id);
    };
  }, [progress]);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C9A84C" />
            <Stop offset="55%" stopColor="#5A3ACC" />
            <Stop offset="100%" stopColor="#38CC88" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#matchGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          // @ts-ignore Animated interpolation
          strokeDashoffset={dashOffset}
          fill="none"
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text style={{ color: theme.colors.foreground, fontSize: 34, fontWeight: '700' }}>
          {displayScore}
          <Text style={{ color: theme.colors.gold, fontSize: 16 }}>%</Text>
        </Text>
      </View>
    </View>
  );
};
