import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);
const PRIMARY_LINE_LENGTH = 112;
const SECONDARY_LINE_LENGTH = 126;

type CosmicOnboardingLightBackgroundProps = {
  animateAccentLines?: boolean;
  showAccentLines?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const CosmicOnboardingLightBackground = React.memo(({
  animateAccentLines = false,
  showAccentLines = true,
  style,
}: CosmicOnboardingLightBackgroundProps) => {
  const primaryLineOffset = useRef(new Animated.Value(PRIMARY_LINE_LENGTH)).current;
  const secondaryLineOffset = useRef(new Animated.Value(SECONDARY_LINE_LENGTH)).current;
  const lineOpacity = useRef(new Animated.Value(showAccentLines ? 0 : 1)).current;

  useEffect(() => {
    if (!showAccentLines) {
      lineOpacity.setValue(0);
      primaryLineOffset.setValue(PRIMARY_LINE_LENGTH);
      secondaryLineOffset.setValue(SECONDARY_LINE_LENGTH);
      return;
    }

    if (!animateAccentLines) {
      lineOpacity.setValue(1);
      primaryLineOffset.setValue(0);
      secondaryLineOffset.setValue(0);
      return;
    }

    primaryLineOffset.setValue(PRIMARY_LINE_LENGTH);
    secondaryLineOffset.setValue(SECONDARY_LINE_LENGTH);
    lineOpacity.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(primaryLineOffset, {
          toValue: 0,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(260),
          Animated.timing(secondaryLineOffset, {
            toValue: 0,
            duration: 1350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]),
    ]);

    animation.start();
    return () => {
      animation.stop();
    };
  }, [animateAccentLines, lineOpacity, primaryLineOffset, secondaryLineOffset, showAccentLines]);

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={style}>
      <Defs>
        <RadialGradient
          id="onboardingLightGlowTop"
          cx="36"
          cy="-8"
          rx="60"
          ry="44"
          fx="36"
          fy="-8"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(125,98,220,0.16)" stopOpacity="0.16" />
          <Stop offset="54%" stopColor="rgba(125,98,220,0.05)" stopOpacity="0.05" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="onboardingLightGlowBottom"
          cx="68"
          cy="102"
          rx="30"
          ry="24"
          fx="68"
          fy="102"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(190,154,84,0.085)" stopOpacity="0.085" />
          <Stop offset="42%" stopColor="rgba(190,154,84,0.03)" stopOpacity="0.03" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="onboardingLightMistCenter"
          cx="34"
          cy="44"
          r="34"
          fx="34"
          fy="44"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" stopOpacity="0.08" />
          <Stop offset="18%" stopColor="rgba(255,255,255,0.12)" stopOpacity="0.12" />
          <Stop offset="48%" stopColor="rgba(255,255,255,0.16)" stopOpacity="0.16" />
          <Stop offset="74%" stopColor="rgba(255,255,255,0.08)" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="onboardingLightMistBottom"
          cx="70"
          cy="90"
          r="22"
          fx="70"
          fy="90"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(255,249,236,0.16)" stopOpacity="0.16" />
          <Stop offset="40%" stopColor="rgba(255,244,226,0.09)" stopOpacity="0.09" />
          <Stop offset="78%" stopColor="rgba(255,240,216,0.03)" stopOpacity="0.03" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient
          id="onboardingLightGreenLine"
          x1="8"
          y1="94"
          x2="108"
          y2="84"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(113,163,103,0)" stopOpacity="0" />
          <Stop offset="42%" stopColor="rgba(110,148,91,0.2)" stopOpacity="0.2" />
          <Stop offset="72%" stopColor="rgba(151,176,106,0.14)" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Circle cx="36" cy="-8" r="58" fill="url(#onboardingLightGlowTop)" />
      <Circle cx="68" cy="102" r="30" fill="url(#onboardingLightGlowBottom)" />
      <Circle cx="34" cy="44" r="34" fill="url(#onboardingLightMistCenter)" />
      <Circle cx="70" cy="90" r="22" fill="url(#onboardingLightMistBottom)" />
      {showAccentLines ? (
        <>
          <AnimatedSvgPath
            d="M 8 93 C 34 82, 68 102, 108 86"
            fill="none"
            opacity={lineOpacity}
            stroke="url(#onboardingLightGreenLine)"
            strokeDasharray={`${PRIMARY_LINE_LENGTH} ${PRIMARY_LINE_LENGTH}`}
            strokeDashoffset={primaryLineOffset}
            strokeWidth="0.38"
          />
          <AnimatedSvgPath
            d="M 20 98 C 48 88, 80 104, 112 90"
            fill="none"
            opacity={lineOpacity}
            stroke="rgba(104,141,86,0.14)"
            strokeDasharray={`${SECONDARY_LINE_LENGTH} ${SECONDARY_LINE_LENGTH}`}
            strokeDashoffset={secondaryLineOffset}
            strokeWidth="0.28"
          />
        </>
      ) : null}
    </Svg>
  );
});
