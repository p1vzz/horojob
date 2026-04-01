import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type ScanButtonProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const ScanButton = ({ onPress, style, disabled = false }: ScanButtonProps) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.15],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View className="relative items-center justify-center" style={style}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 160,
          height: 90,
          zIndex: 0,
          transform: [{ scale: haloScale }],
          opacity: haloOpacity,
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 160 90">
          <Defs>
            <RadialGradient id="scanHalo" cx="50%" cy="50%" rx="45%" ry="45%">
              <Stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
              <Stop offset="50%" stopColor="#C9A84C" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="160" height="90" fill="url(#scanHalo)" />
        </Svg>
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={disabled}
        style={{
          backgroundColor: '#C9A84C',
          paddingHorizontal: 20,
          paddingVertical: 11,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 1,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.3)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Search size={16} color="#06060C" strokeWidth={3} />
        <Text style={{ color: '#06060C', fontWeight: '800', marginLeft: 6, fontSize: 14 }}>
          Scan
        </Text>
      </TouchableOpacity>
    </View>
  );
};
