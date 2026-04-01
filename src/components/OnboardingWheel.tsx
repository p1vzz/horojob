import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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
const planets = ['\u2609\uFE0E', '\u263D\uFE0E', '\u263F\uFE0E', '\u2640\uFE0E', '\u2642\uFE0E', '\u2643\uFE0E', '\u2644\uFE0E', '\u26E2\uFE0E', '\u2646\uFE0E', '\u2647\uFE0E'];
const WHEEL_SIZE_LIMITS = {
  min: 220,
  max: 360,
  base: 280,
} as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const OnboardingWheel = ({
  filledCount,
  onReveal,
  size = 280,
}: {
  filledCount: number;
  onReveal: () => void;
  size?: number;
}) => {
  const wheelSize = Math.max(WHEEL_SIZE_LIMITS.min, Math.min(WHEEL_SIZE_LIMITS.max, size));
  const wheelScale = wheelSize / WHEEL_SIZE_LIMITS.base;
  const isComplete = filledCount === 4;
  const spinValue = useRef(new Animated.Value(0)).current;
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const [isRevealing, setIsRevealing] = useState(false);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.8, 1],
  });

  const ballScale = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [1, 1.1],
  });

  const signsFade = collapseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.3, 0],
  });

  const intensity = 0.2 + (filledCount / 4) * 0.8;
  const activeGold = '#C9A84C';
  const revealFade = Animated.subtract(1, revealAnim);
  const revealOpacity = Animated.subtract(1, Animated.multiply(revealAnim, 0.85));
  const signExplodeDistances = [260, 220, 280, 240, 300, 230, 270, 250, 310, 235, 290, 225];
  const planetExplodeDistances = [200, 170, 220, 180, 210, 175, 205, 190, 215, 185];

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 45000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  useEffect(() => {
    Animated.timing(collapseAnim, {
      toValue: isComplete ? 1 : 0,
      duration: isComplete ? 1100 : 700,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    }).start();

    if (isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [collapseAnim, isComplete, pulseAnim]);

  const handleRevealPress = () => {
    if (!isComplete || isRevealing) return;
    setIsRevealing(true);
    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onReveal();
      }
    });
  };

  const spinOuter = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinInner = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const dynamicSignRadius = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 15],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: wheelSize, width: '100%' }}>
      <View
        style={{
          width: 300,
          height: 300,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: wheelScale }],
        }}
      >
      <View style={{ position: 'absolute', width: 300, height: 300 }}>
        <Svg height="100%" width="100%" viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="wideWheelGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={activeGold} stopOpacity={0.25 * intensity} />
              <Stop offset="70%" stopColor={activeGold} stopOpacity={0.08 * intensity} />
              <Stop offset="100%" stopColor={activeGold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#wideWheelGlow)" />
        </Svg>
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          transform: [{ rotate: spinOuter }, { scale: pulseAnim }],
        }}
      >
        {signs.map((sign, i) => {
          const angle = i * 30 * (Math.PI / 180);
          const explodeRadius = Animated.add(
            dynamicSignRadius,
            Animated.multiply(revealAnim, signExplodeDistances[i] ?? 260)
          );
          return (
            <Animated.Text
              key={i}
              style={{
                position: 'absolute',
                left: 110 - 10,
                top: 110 - 10,
                transform: [
                  { translateX: Animated.multiply(explodeRadius, Math.cos(angle)) },
                  { translateY: Animated.multiply(explodeRadius, Math.sin(angle)) },
                ],
                fontSize: 16,
                color: activeGold,
                opacity: isRevealing
                  ? revealOpacity
                  : isComplete
                    ? Animated.multiply(signsFade, revealFade)
                    : 0.5 * intensity,
                textShadowColor: activeGold,
                textShadowRadius: 10 * intensity,
              }}
            >
              {sign}
            </Animated.Text>
          );
        })}
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          transform: [{ rotate: spinInner }],
        }}
      >
        {planets.map((planet, i) => {
          const angle = i * (360 / planets.length) * (Math.PI / 180);
          const planetRad = collapseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [65, 10],
          });
          const planetExplode = Animated.add(
            planetRad,
            Animated.multiply(revealAnim, planetExplodeDistances[i] ?? 200)
          );
          return (
            <Animated.Text
              key={i}
              style={{
                position: 'absolute',
                left: 70 - 8,
                top: 70 - 8,
                transform: [
                  { translateX: Animated.multiply(planetExplode, Math.cos(angle)) },
                  { translateY: Animated.multiply(planetExplode, Math.sin(angle)) },
                ],
                fontSize: 18,
                color: activeGold,
                opacity: isRevealing
                  ? revealOpacity
                  : isComplete
                    ? Animated.multiply(signsFade, revealFade)
                    : 0.5 * intensity,
              }}
            >
              {planet}
            </Animated.Text>
          );
        })}
      </Animated.View>

      <Animated.View style={{ position: 'absolute', opacity: Animated.subtract(1, collapseAnim) }}>
        <Svg height="260" width="260" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="48"
            stroke={activeGold}
            strokeWidth="0.15"
            fill="none"
            opacity={0.15 * intensity}
          />
          <Circle
            cx="50"
            cy="50"
            r="32"
            stroke={activeGold}
            strokeWidth="0.4"
            fill="none"
            opacity={0.3 * intensity}
            strokeDasharray="1, 2"
          />
        </Svg>
      </Animated.View>

      <Pressable
        onPress={handleRevealPress}
        disabled={!isComplete || isRevealing}
        style={{ position: 'absolute', zIndex: 1000 }}
      >
        <Animated.View
          style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: isComplete ? ballScale : 1 }],
            opacity: isComplete ? 1 : intensity,
          }}
        >
          <Svg height="80" width="80" viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="goldBallGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFF5D1" stopOpacity="1" />
                <Stop offset="30%" stopColor="#C9A84C" stopOpacity="1" />
                <Stop offset="70%" stopColor="#8E6B1D" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <AnimatedCircle
              cx="40"
              cy="40"
              r="35"
              fill="url(#goldBallGradient)"
              // @ts-ignore
              style={{ opacity: isComplete ? glowOpacity : 0.8 }}
            />
          </Svg>

          {isComplete ? (
            <Animated.View
              style={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: activeGold,
                opacity: Animated.subtract(1.2, pulseAnim),
                transform: [{ scale: pulseAnim }],
              }}
            />
          ) : null}
        </Animated.View>
      </Pressable>

      <Animated.Text
        style={{
          position: 'absolute',
          bottom: -30,
          color: activeGold,
          fontSize: 10,
          letterSpacing: 3,
          opacity: Animated.multiply(collapseAnim, revealFade),
        }}
      >
        TAP TO REVEAL
      </Animated.Text>
      </View>
    </View>
  );
};
