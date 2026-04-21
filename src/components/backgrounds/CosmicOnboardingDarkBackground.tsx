import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);
const PRIMARY_LINE_LENGTH = 112;
const SECONDARY_LINE_LENGTH = 126;
const DARK_BACKGROUND_BASE = '#06060C';
const BACKDROP_OVERSCAN = 2;
const BACKDROP_SIZE = 100 + BACKDROP_OVERSCAN * 2;

type CosmicOnboardingDarkBackgroundProps = {
  animateAccentLines?: boolean;
  showAccentLines?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const CosmicOnboardingDarkBackground = React.memo(({
  animateAccentLines = false,
  showAccentLines = true,
  style,
}: CosmicOnboardingDarkBackgroundProps) => {
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
          id="onboardingDarkGlowTop"
          cx="38%"
          cy="-8%"
          rx="72%"
          ry="54%"
          fx="38%"
          fy="-8%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(90,58,204,0.26)" stopOpacity="0.26" />
          <Stop offset="54%" stopColor="rgba(90,58,204,0.08)" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="onboardingDarkGlowBottom"
          cx="84%"
          cy="108%"
          rx="70%"
          ry="52%"
          fx="84%"
          fy="108%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(201,168,76,0.18)" stopOpacity="0.18" />
          <Stop offset="58%" stopColor="rgba(201,168,76,0.05)" stopOpacity="0.05" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient
          id="onboardingDarkMistCenter"
          cx="25"
          cy="77"
          r="42"
          fx="25"
          fy="77"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(255,255,255,0.008)" stopOpacity="0.008" />
          <Stop offset="18%" stopColor="rgba(255,255,255,0.012)" stopOpacity="0.012" />
          <Stop offset="48%" stopColor="rgba(255,255,255,0.03)" stopOpacity="0.03" />
          <Stop offset="74%" stopColor="rgba(255,255,255,0.014)" stopOpacity="0.014" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient
          id="onboardingDarkGreenLine"
          x1="8"
          y1="94"
          x2="108"
          y2="84"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="rgba(113,163,103,0)" stopOpacity="0" />
          <Stop offset="42%" stopColor="rgba(113,163,103,0.16)" stopOpacity="0.16" />
          <Stop offset="72%" stopColor="rgba(162,190,114,0.11)" stopOpacity="0.11" />
          <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Rect
        x={-BACKDROP_OVERSCAN}
        y={-BACKDROP_OVERSCAN}
        width={BACKDROP_SIZE}
        height={BACKDROP_SIZE}
        fill={DARK_BACKGROUND_BASE}
      />
      <Rect
        x={-BACKDROP_OVERSCAN}
        y={-BACKDROP_OVERSCAN}
        width={BACKDROP_SIZE}
        height={BACKDROP_SIZE}
        fill="url(#onboardingDarkGlowTop)"
      />
      <Rect
        x={-BACKDROP_OVERSCAN}
        y={-BACKDROP_OVERSCAN}
        width={BACKDROP_SIZE}
        height={BACKDROP_SIZE}
        fill="url(#onboardingDarkGlowBottom)"
      />
      <Circle cx="25" cy="77" r="42" fill="url(#onboardingDarkMistCenter)" />
      {showAccentLines ? (
        <>
          <AnimatedSvgPath
            d="M 8 93 C 34 82, 68 102, 108 86"
            fill="none"
            opacity={lineOpacity}
            stroke="url(#onboardingDarkGreenLine)"
            strokeDasharray={`${PRIMARY_LINE_LENGTH} ${PRIMARY_LINE_LENGTH}`}
            strokeDashoffset={primaryLineOffset}
            strokeWidth="0.38"
          />
          <AnimatedSvgPath
            d="M 20 98 C 48 88, 80 104, 112 90"
            fill="none"
            opacity={lineOpacity}
            stroke="rgba(109,159,100,0.1)"
            strokeDasharray={`${SECONDARY_LINE_LENGTH} ${SECONDARY_LINE_LENGTH}`}
            strokeDashoffset={secondaryLineOffset}
            strokeWidth="0.28"
          />
        </>
      ) : null}
    </Svg>
  );
});
