import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

type IconComponentProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type BrandedPulseButtonProps = {
  animated?: boolean;
  backgroundColor: string;
  borderColor: string;
  haloColor: string;
  Icon: React.ComponentType<IconComponentProps>;
  iconColor: string;
  label: string;
  onPress: () => void;
  pulseDriver?: Animated.Value;
  shadowColor: string;
  style?: StyleProp<ViewStyle>;
  textColor: string;
};

function BrandedPulseButtonImpl({
  animated = true,
  backgroundColor,
  borderColor,
  haloColor,
  Icon,
  iconColor,
  label,
  onPress,
  pulseDriver,
  shadowColor,
  style,
  textColor,
}: BrandedPulseButtonProps) {
  const localPulseValue = useRef(new Animated.Value(0)).current;
  const pulseValue = animated ? (pulseDriver ?? localPulseValue) : localPulseValue;

  useEffect(() => {
    if (!animated || pulseDriver) {
      localPulseValue.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(localPulseValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(localPulseValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [animated, localPulseValue, pulseDriver]);

  const haloScale = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1.14],
      })
    : 1;

  const haloOpacity = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.58, 1],
      })
    : 0.72;

  const buttonScale = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.992, 1.012],
      })
    : 1;

  return (
    <View style={[styles.root, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.haloWrap,
          {
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="brandedPulseHalo" cx="50%" cy="50%" rx="45%" ry="45%">
              <Stop offset="0%" stopColor={haloColor} stopOpacity="0.3" />
              <Stop offset="50%" stopColor={haloColor} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={haloColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="160" height="90" fill="url(#brandedPulseHalo)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ width: '100%', transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={[
            styles.button,
            {
              backgroundColor,
              borderColor,
              shadowColor,
            },
          ]}
        >
          <Icon size={16} color={iconColor} strokeWidth={2.35} />
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export const BrandedPulseButton = React.memo(BrandedPulseButtonImpl);
BrandedPulseButton.displayName = 'BrandedPulseButton';

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 170,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloWrap: {
    position: 'absolute',
    width: '100%',
    height: 92,
    zIndex: 0,
  },
  button: {
    width: '100%',
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1,
  },
  label: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
