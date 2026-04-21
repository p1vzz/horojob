import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeModeProvider';

export function DashboardReadyGate() {
  const theme = useAppTheme();

  return (
    <View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        }}
      >
        <LinearGradient
          colors={['rgba(201,168,76,0.10)', 'rgba(90,58,204,0.08)', 'rgba(255,255,255,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center' }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
              backgroundColor: theme.colors.cardMuted,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Sparkles size={20} color={theme.colors.gold} />
          </View>

          <Text
            style={{
              color: theme.colors.foreground,
              fontSize: 19,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Preparing Dashboard
          </Text>
          <Text
            style={{
              color: theme.colors.foregroundSecondary,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            Setting up your career map and priority alerts. Live text cards can finish inside the dashboard.
          </Text>
          <ActivityIndicator size="small" color={theme.colors.gold} />
        </LinearGradient>
      </View>
    </View>
  );
}
