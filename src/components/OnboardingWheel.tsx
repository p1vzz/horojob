import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useThemeMode } from '../theme/ThemeModeProvider';
import type { BrightnessBoostChannels } from '../contexts/brightnessAdaptationCore';
import { adaptColorOpacity } from '../utils/brightnessAdaptation';

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
const SIGN_EXPLODE_DISTANCES = [260, 220, 280, 240, 300, 230, 270, 250, 310, 235, 290, 225];
const PLANET_EXPLODE_DISTANCES = [200, 170, 220, 180, 210, 175, 205, 190, 215, 185];
const SIGN_ANGLES = signs.map((_, i) => i * 30 * (Math.PI / 180));
const PLANET_ANGLES = planets.map((_, i) => i * (360 / planets.length) * (Math.PI / 180));
const NEUTRAL_BRIGHTNESS_CHANNELS: BrightnessBoostChannels = {
  intensityMultiplier: 1,
  textOpacityMultiplier: 1,
  borderOpacityMultiplier: 1,
  glowOpacityMultiplier: 1,
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AstroSymbolProps = {
  symbol: string;
  index: number;
  angle: number;
  explodeDistance: number;
  orbitRadius: Animated.AnimatedInterpolation<number>;
  revealAnim: Animated.Value;
  isRevealing: boolean;
  isComplete: boolean;
  intensity: number;
  activeGold: string;
  signsFade: Animated.AnimatedInterpolation<number>;
  revealOpacity: Animated.AnimatedSubtraction<number>;
  revealFade: Animated.AnimatedSubtraction<number>;
  baseLeft: number;
  baseTop: number;
  symbolOpacityBoost: number;
  textShadowBoost: number;
  symbolSizeBoost: number;
};

const AstroSymbol = React.memo(({
  symbol,
  angle,
  explodeDistance,
  orbitRadius,
  revealAnim,
  isRevealing,
  isComplete,
  intensity,
  activeGold,
  signsFade,
  revealOpacity,
  revealFade,
  baseLeft,
  baseTop,
  symbolOpacityBoost,
  textShadowBoost,
  symbolSizeBoost,
}: AstroSymbolProps) => {
  const explodeRadius = Animated.add(
    orbitRadius,
    Animated.multiply(revealAnim, explodeDistance)
  );

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: baseLeft,
        top: baseTop,
        transform: [
          { translateX: Animated.multiply(explodeRadius, Math.cos(angle)) },
          { translateY: Animated.multiply(explodeRadius, Math.sin(angle)) },
          { scale: symbolSizeBoost },
        ],
        fontSize: 16,
        color: activeGold,
        opacity: isRevealing
          ? revealOpacity
          : isComplete
            ? Animated.multiply(signsFade, revealFade)
            : Math.min(1, 0.5 * intensity * symbolOpacityBoost),
        textShadowColor: activeGold,
        textShadowRadius: 10 * intensity * textShadowBoost,
      }}
    >
      {symbol}
    </Animated.Text>
  );
});
AstroSymbol.displayName = 'AstroSymbol';

const PlanetSymbol = React.memo(({
  symbol,
  angle,
  explodeDistance,
  orbitRadius,
  revealAnim,
  isRevealing,
  isComplete,
  intensity,
  activeGold,
  signsFade,
  revealOpacity,
  revealFade,
  baseLeft,
  baseTop,
  symbolOpacityBoost,
  textShadowBoost,
  symbolSizeBoost,
}: AstroSymbolProps) => {
  const explodeRadius = Animated.add(
    orbitRadius,
    Animated.multiply(revealAnim, explodeDistance)
  );

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: baseLeft,
        top: baseTop,
        transform: [
          { translateX: Animated.multiply(explodeRadius, Math.cos(angle)) },
          { translateY: Animated.multiply(explodeRadius, Math.sin(angle)) },
          { scale: symbolSizeBoost },
        ],
        fontSize: 18,
        color: activeGold,
        opacity: isRevealing
          ? revealOpacity
          : isComplete
            ? Animated.multiply(signsFade, revealFade)
            : Math.min(1, 0.5 * intensity * symbolOpacityBoost),
        textShadowColor: activeGold,
        textShadowRadius: 12 * intensity * textShadowBoost,
      }}
    >
      {symbol}
    </Animated.Text>
  );
});
PlanetSymbol.displayName = 'PlanetSymbol';

export const OnboardingWheel = ({
  filledCount,
  onReveal,
  size = 280,
  brightnessChannels = NEUTRAL_BRIGHTNESS_CHANNELS,
}: {
  filledCount: number;
  onReveal: () => void;
  size?: number;
  brightnessChannels?: BrightnessBoostChannels;
}) => {
  const { isLight } = useThemeMode();
  const wheelSize = Math.max(WHEEL_SIZE_LIMITS.min, Math.min(WHEEL_SIZE_LIMITS.max, size));
  const wheelScale = wheelSize / WHEEL_SIZE_LIMITS.base;
  const isComplete = filledCount === 4;
  const spinValue = useRef(new Animated.Value(0)).current;
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
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

  // Base brightness raised from 0.2 to 0.5 for better visibility in low-light conditions
  // Scale: step 0=0.5 (50%), step 1=0.675, step 2=0.85, step 3=1.025, step 4=1.2 (120%)
  const baseIntensity = 0.5 + (filledCount / 4) * 0.7;

  // Apply semantic brightness adaptation while keeping the completion cap stable.
  // Allow intensity up to 1.2 (120%) for step 4
  const intensity = Math.min(1.2, baseIntensity * brightnessChannels.intensityMultiplier);

  // Light theme uses darker, more saturated gold for better contrast
  const activeGoldBase = isLight ? '#A68525' : '#C9A84C';
  const activeGold = adaptColorOpacity(activeGoldBase, brightnessChannels.textOpacityMultiplier);
  const ringGold = adaptColorOpacity(activeGoldBase, brightnessChannels.borderOpacityMultiplier);
  const wideGlowGold = adaptColorOpacity(activeGoldBase, brightnessChannels.glowOpacityMultiplier);
  const goldBallCore = adaptColorOpacity('#FFF5D1', brightnessChannels.glowOpacityMultiplier);
  const goldBallMid = adaptColorOpacity(activeGoldBase, brightnessChannels.textOpacityMultiplier);
  const goldBallEdge = adaptColorOpacity('#8E6B1D', brightnessChannels.borderOpacityMultiplier);

  // Light theme enhancements: stronger symbols and rings for "milk" background
  const symbolOpacityBoost = (isLight ? 2.0 : 1.0) * brightnessChannels.textOpacityMultiplier;
  const textShadowBoost = (isLight ? 0.3 : 1.0) * brightnessChannels.glowOpacityMultiplier;
  const ringStrokeBoost = (isLight ? 2.2 : 1.0) * brightnessChannels.borderOpacityMultiplier;
  const symbolSizeBoost = isLight ? 1.15 : 1.0; // +15% font size in light mode
  const revealFade = Animated.subtract(1, revealAnim);
  const revealOpacity = Animated.subtract(1, Animated.multiply(revealAnim, 0.85));

  useEffect(() => {
    spinLoopRef.current?.stop();
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 45000,
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: true,
      })
    );
    spinLoopRef.current.start();

    return () => {
      spinLoopRef.current?.stop();
      spinLoopRef.current = null;
    };
  }, [spinValue]);

  useEffect(() => {
    const collapseAnimation = Animated.timing(collapseAnim, {
      toValue: isComplete ? 1 : 0,
      duration: isComplete ? 1100 : 700,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    });
    collapseAnimation.start();

    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;

    if (isComplete) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            isInteraction: false,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            isInteraction: false,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      collapseAnimation.stop();
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
    };
  }, [collapseAnim, isComplete, pulseAnim]);

  const handleRevealPress = () => {
    if (!isComplete || isRevealing) return;
    setIsRevealing(true);
    spinLoopRef.current?.stop();
    pulseLoopRef.current?.stop();
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
  const planetOrbitRadius = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [65, 10],
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
              <Stop offset="0%" stopColor={wideGlowGold} stopOpacity={0.25 * intensity} />
              <Stop offset="70%" stopColor={wideGlowGold} stopOpacity={0.08 * intensity} />
              <Stop offset="100%" stopColor={wideGlowGold} stopOpacity="0" />
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
        {signs.map((sign, i) => (
          <AstroSymbol
            key={i}
            symbol={sign}
            index={i}
            angle={SIGN_ANGLES[i] ?? 0}
            explodeDistance={SIGN_EXPLODE_DISTANCES[i] ?? 260}
            orbitRadius={dynamicSignRadius}
            revealAnim={revealAnim}
            isRevealing={isRevealing}
            isComplete={isComplete}
            intensity={intensity}
            activeGold={activeGold}
            signsFade={signsFade}
            revealOpacity={revealOpacity}
            revealFade={revealFade}
            baseLeft={110 - 10}
            baseTop={110 - 10}
            symbolOpacityBoost={symbolOpacityBoost}
            textShadowBoost={textShadowBoost}
            symbolSizeBoost={symbolSizeBoost}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          transform: [{ rotate: spinInner }],
        }}
      >
        {planets.map((planet, i) => (
          <PlanetSymbol
            key={i}
            symbol={planet}
            index={i}
            angle={PLANET_ANGLES[i] ?? 0}
            explodeDistance={PLANET_EXPLODE_DISTANCES[i] ?? 200}
            orbitRadius={planetOrbitRadius}
            revealAnim={revealAnim}
            isRevealing={isRevealing}
            isComplete={isComplete}
            intensity={intensity}
            activeGold={activeGold}
            signsFade={signsFade}
            revealOpacity={revealOpacity}
            revealFade={revealFade}
            baseLeft={70 - 8}
            baseTop={70 - 8}
            symbolOpacityBoost={symbolOpacityBoost}
            textShadowBoost={textShadowBoost}
            symbolSizeBoost={symbolSizeBoost}
          />
        ))}
      </Animated.View>

      <Animated.View style={{ position: 'absolute', opacity: Animated.subtract(1, collapseAnim) }}>
        <Svg height="260" width="260" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="48"
            stroke={ringGold}
            strokeWidth={0.15 * ringStrokeBoost}
            fill="none"
            opacity={0.15 * intensity}
          />
          <Circle
            cx="50"
            cy="50"
            r="32"
            stroke={ringGold}
            strokeWidth={0.4 * ringStrokeBoost}
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
                <Stop offset="0%" stopColor={goldBallCore} stopOpacity="1" />
                <Stop offset="30%" stopColor={goldBallMid} stopOpacity="1" />
                <Stop offset="70%" stopColor={goldBallEdge} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={goldBallMid} stopOpacity="0" />
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
                borderColor: ringGold,
                opacity: Animated.multiply(
                  Animated.subtract(1.2, pulseAnim),
                  Math.min(1, brightnessChannels.glowOpacityMultiplier)
                ),
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
