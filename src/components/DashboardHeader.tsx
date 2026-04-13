import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { User, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureAuthSession } from '../services/authSession';
import type { AppNavigationProp } from '../types/navigation';
import { loadOnboardingForUser } from '../utils/onboardingStorage';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../utils/brightnessAdaptation';
import { buildDashboardMiniPositions, resolveDashboardGreeting } from './dashboardHeaderCore';

const miniPositions = buildDashboardMiniPositions();

export const DashboardHeader = () => {
  const theme = useAppTheme();
  const { channels } = useBrightnessAdaptation();
  const navigation = useNavigation<AppNavigationProp>();
  const insets = useSafeAreaInsets();
  const greeting = resolveDashboardGreeting(new Date().getHours());
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [displayName, setDisplayName] = useState('Star Seeker');

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  useEffect(() => {
    let mounted = true;
    const loadName = async () => {
      try {
        const session = await ensureAuthSession();
        const onboarding = await loadOnboardingForUser(session.user.id);
        const resolved =
          onboarding?.name?.trim() ||
          session.user.displayName?.trim() ||
          session.user.email?.split('@')[0]?.trim() ||
          '';
        if (mounted && resolved) {
          setDisplayName(resolved);
        }
      } catch {
        // Keep fallback name if profile cannot be resolved.
      }
    };

    void loadName();
    return () => {
      mounted = false;
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="flex-row items-center justify-between px-5 pb-2" style={{ paddingTop: Math.max(insets.top + 6, 18) }}>
      <View>
        <Text
          className="text-[12px] uppercase tracking-[2px] mb-1"
          style={{ color: adaptColorOpacity('rgba(212, 212, 224, 0.6)', channels.textOpacityMultiplier) }}
        >
          {greeting}
        </Text>
        <View className="flex-row items-center">
          <Text
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: adaptColorOpacity('#E9E9F2', channels.textOpacityMultiplier) }}
          >
            {displayName}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
            className="ml-2 w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: adaptColorOpacity('rgba(255,255,255,0.03)', channels.glowOpacityMultiplier),
              borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
              borderWidth: 1,
            }}
          >
            <Settings size={16} color={adaptColorOpacity('rgba(140,124,255,0.9)', channels.textOpacityMultiplier)} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('NatalChart')}
        className="w-11 h-11 rounded-full justify-center items-center"
        style={{
          backgroundColor: adaptColorOpacity('rgba(201, 168, 76, 0.08)', channels.glowOpacityMultiplier),
          borderColor: adaptColorOpacity('rgba(201, 168, 76, 0.15)', channels.borderOpacityMultiplier),
          borderWidth: 1,
          shadowColor: theme.colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: 44,
            height: 44,
            transform: [{ rotate: spin }],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {miniPositions.map((p, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                color: adaptColorOpacity('rgba(201, 168, 76, 0.5)', channels.textOpacityMultiplier),
                fontSize: 8,
                fontWeight: 'normal',
                transform: [{ translateX: p.x }, { translateY: p.y }],
              }}
            >
              {p.s}
            </Text>
          ))}
        </Animated.View>

        <User size={18} color={theme.colors.gold} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
};
