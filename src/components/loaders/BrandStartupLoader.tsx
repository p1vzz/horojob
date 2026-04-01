import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export const BRAND_STARTUP_BACKGROUND = '#EEE7DA';

const BRAND_STARTUP_SUBTITLE = '#5E564B';
const BRAND_STARTUP_ACCENT = '#B58D2B';
const BRAND_STARTUP_SHELL = '#202533';
const BRAND_STARTUP_SHADOW = '#161B28';
const BRAND_STARTUP_AMBIENT_GOLD = 'rgba(181,141,43,0.14)';
const BRAND_STARTUP_AMBIENT_SLATE = 'rgba(36,47,70,0.08)';
const LOGO_RATIO = 444 / 456;

type BrandStartupLoaderProps = {
  subtitle?: string;
  showIndicator?: boolean;
};

export const BrandStartupLoader = ({
  subtitle = 'Preparing your session...',
  showIndicator = true,
}: BrandStartupLoaderProps) => {
  const { width } = useWindowDimensions();
  const ambientPulse = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const logoWidth = Math.max(240, Math.min(width - 56, 320));
  const logoHeight = Math.round(logoWidth * LOGO_RATIO);

  useEffect(() => {
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientPulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    ambientLoop.start();
    logoLoop.start();

    return () => {
      ambientLoop.stop();
      logoLoop.stop();
    };
  }, [ambientPulse, logoFloat]);

  const ambientOpacity = ambientPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.5],
  });
  const ambientScale = ambientPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const logoScale = logoFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.015],
  });
  const logoTranslateY = logoFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircleLarge,
          {
            opacity: ambientOpacity,
            transform: [{ scale: ambientScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircleSmall,
          {
            opacity: ambientOpacity,
            transform: [{ scale: ambientScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoShell,
          {
            width: logoWidth,
            transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/horojob-logo-lockup.png')}
          style={{ width: logoWidth, height: logoHeight }}
          resizeMode="contain"
        />
      </Animated.View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {showIndicator ? <ActivityIndicator style={styles.indicator} size="small" color={BRAND_STARTUP_ACCENT} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_STARTUP_BACKGROUND,
    paddingHorizontal: 28,
  },
  logoShell: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: BRAND_STARTUP_SHELL,
    shadowColor: BRAND_STARTUP_SHADOW,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  subtitle: {
    marginTop: 28,
    color: BRAND_STARTUP_SUBTITLE,
    fontSize: 15,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  indicator: {
    marginTop: 18,
  },
  ambientCircleLarge: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: BRAND_STARTUP_AMBIENT_GOLD,
  },
  ambientCircleSmall: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: BRAND_STARTUP_AMBIENT_SLATE,
  },
});
