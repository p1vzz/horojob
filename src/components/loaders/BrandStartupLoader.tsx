import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  BrandAstroWheelMark,
  BRAND_ASCENT_ARROW_TRACK_PATH,
  BRAND_ASCENT_AURA_TRACK_PATH,
} from '../brand/BrandAstroWheelMark';
import { CosmicOnboardingDarkBackground } from '../backgrounds/CosmicOnboardingDarkBackground';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../../utils/brightnessAdaptation';

export const BRAND_STARTUP_BACKGROUND = '#06060C';

const BRAND_STARTUP_SUBTITLE = 'rgba(212,212,224,0.72)';
const BRAND_STARTUP_ACCENT = '#C9A84C';
const BRAND_STARTUP_SHINE_SOFT = 'rgba(201,168,76,0.34)';
const BRAND_STARTUP_SHINE_CORE = 'rgba(255,241,191,0.92)';
const LOGO_VIEWBOX_SIZE = 100;
const LOGO_ARROW_TRACK_LENGTH = 70;
const LOGO_AURA_TRACK_LENGTH = 239;
const LOGO_ARROW_SOFT_SEGMENT = 14;
const LOGO_ARROW_CORE_SEGMENT = 7;
const LOGO_AURA_SOFT_SEGMENT = 22;
const LOGO_AURA_CORE_SEGMENT = 10;

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);

type BrandStartupLoaderProps = {
  subtitle?: string;
  showIndicator?: boolean;
};

export const BrandStartupLoader = ({
  subtitle,
  showIndicator = false,
}: BrandStartupLoaderProps) => {
  const { width } = useWindowDimensions();
  const { channels } = useBrightnessAdaptation();
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const walkerMotionProgress = useRef(new Animated.Value(0)).current;
  const [walkerAnimationState, setWalkerAnimationState] = useState({
    flightProgress: 0,
    stridePhase: 0,
    travelProgress: 0,
  });
  const logoSize = Math.max(252, Math.min(width - 80, 320));

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 2900,
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: false,
      })
    );
    const walkerMotion = Animated.timing(walkerMotionProgress, {
      toValue: 1,
      duration: 16800,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      useNativeDriver: false,
    });
    const easeAscent = Easing.inOut(Easing.cubic);
    const easeFlight = Easing.out(Easing.cubic);
    const ascentCutoff = 0.82;
    const strideCycleCount = 2.2;

    shimmerProgress.setValue(0);
    walkerMotionProgress.setValue(0);
    shimmerLoop.start();
    walkerMotion.start();
    const walkerMotionListenerId = walkerMotionProgress.addListener(({ value }) => {
      const ascentRawProgress = Math.min(value / ascentCutoff, 1);
      const flightRawProgress = value <= ascentCutoff
        ? 0
        : Math.min((value - ascentCutoff) / (1 - ascentCutoff), 1);
      const nextState = {
        flightProgress: Math.round(easeFlight(flightRawProgress) * 64) / 64,
        stridePhase: flightRawProgress > 0
          ? 0.18
          : Math.round((((ascentRawProgress * strideCycleCount) % 1) + Number.EPSILON) * 1000) / 1000,
        travelProgress: Math.round(easeAscent(ascentRawProgress) * 64) / 64,
      };
      setWalkerAnimationState((currentState) => (
        currentState.flightProgress === nextState.flightProgress
        && currentState.stridePhase === nextState.stridePhase
        && currentState.travelProgress === nextState.travelProgress
          ? currentState
          : nextState
      ));
    });

    return () => {
      shimmerLoop.stop();
      walkerMotion.stop();
      walkerMotionProgress.removeListener(walkerMotionListenerId);
    };
  }, [shimmerProgress, walkerMotionProgress]);

  const arrowDashOffset = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [LOGO_ARROW_TRACK_LENGTH * 0.08, -LOGO_ARROW_TRACK_LENGTH * 0.92],
  });
  const auraDashOffset = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -LOGO_AURA_TRACK_LENGTH],
  });

  return (
    <View style={styles.root}>
      <CosmicOnboardingDarkBackground showAccentLines={false} style={StyleSheet.absoluteFillObject} />

      <View style={styles.content}>
        <View
          style={[styles.logoWrap, { width: logoSize, height: logoSize }]}
          shouldRasterizeIOS
          renderToHardwareTextureAndroid
        >
          <BrandAstroWheelMark
            size={logoSize}
            glowColor={adaptColorOpacity('rgba(201,168,76,0.15)', channels.glowOpacityMultiplier)}
            goldColor={adaptColorOpacity('#C9A84C', channels.textOpacityMultiplier)}
            goldHighlightColor={adaptColorOpacity('#FFF1BF', channels.glowOpacityMultiplier)}
            walkerFlightProgress={walkerAnimationState.flightProgress}
            walkerStridePhase={walkerAnimationState.stridePhase}
            walkerTravelProgress={walkerAnimationState.travelProgress}
          />
          <Svg
            pointerEvents="none"
            width={logoSize}
            height={logoSize}
            viewBox={`0 0 ${LOGO_VIEWBOX_SIZE} ${LOGO_VIEWBOX_SIZE}`}
            style={styles.logoShine}
          >
            <AnimatedSvgPath
              d={BRAND_ASCENT_ARROW_TRACK_PATH}
              fill="none"
              stroke={adaptColorOpacity(BRAND_STARTUP_SHINE_SOFT, channels.glowOpacityMultiplier)}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${LOGO_ARROW_SOFT_SEGMENT} ${LOGO_ARROW_TRACK_LENGTH}`}
              strokeDashoffset={arrowDashOffset}
            />
            <AnimatedSvgPath
              d={BRAND_ASCENT_ARROW_TRACK_PATH}
              fill="none"
              stroke={adaptColorOpacity(BRAND_STARTUP_SHINE_CORE, channels.glowOpacityMultiplier)}
              strokeWidth={1.0}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${LOGO_ARROW_CORE_SEGMENT} ${LOGO_ARROW_TRACK_LENGTH}`}
              strokeDashoffset={arrowDashOffset}
            />
            <AnimatedSvgPath
              d={BRAND_ASCENT_AURA_TRACK_PATH}
              fill="none"
              stroke={adaptColorOpacity(BRAND_STARTUP_SHINE_SOFT, channels.glowOpacityMultiplier)}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${LOGO_AURA_SOFT_SEGMENT} ${LOGO_AURA_TRACK_LENGTH}`}
              strokeDashoffset={auraDashOffset}
            />
            <AnimatedSvgPath
              d={BRAND_ASCENT_AURA_TRACK_PATH}
              fill="none"
              stroke={adaptColorOpacity(BRAND_STARTUP_SHINE_CORE, channels.glowOpacityMultiplier)}
              strokeWidth={0.56}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${LOGO_AURA_CORE_SEGMENT} ${LOGO_AURA_TRACK_LENGTH}`}
              strokeDashoffset={auraDashOffset}
            />
          </Svg>
        </View>

        {subtitle ? (
          <Text style={[styles.subtitle, { color: adaptColorOpacity(BRAND_STARTUP_SUBTITLE, channels.textOpacityMultiplier) }]}>
            {subtitle}
          </Text>
        ) : null}
        {showIndicator ? (
          <ActivityIndicator
            style={[styles.indicator, { opacity: adaptOpacity(1, channels.glowOpacityMultiplier) }]}
            size="small"
            color={adaptColorOpacity(BRAND_STARTUP_ACCENT, channels.glowOpacityMultiplier)}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_STARTUP_BACKGROUND,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShine: {
    ...StyleSheet.absoluteFillObject,
  },
  subtitle: {
    marginTop: 12,
    color: BRAND_STARTUP_SUBTITLE,
    fontSize: 15,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  indicator: {
    marginTop: 18,
  },
});
