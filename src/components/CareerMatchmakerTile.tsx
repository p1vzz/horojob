import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, Compass, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { useAppTheme } from '../theme/ThemeModeProvider';
import type { DashboardCareerFeaturePrerequisites } from '../hooks/useDashboardPrerequisites';

export const CareerMatchmakerTile = ({
  careerPrerequisites,
}: {
  careerPrerequisites?: DashboardCareerFeaturePrerequisites;
}) => {
  const theme = useAppTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const isBlocked = careerPrerequisites ? !careerPrerequisites.isReadyForCareerFeatures : false;
  const openDiscoverRoles = () => navigation.navigate('DiscoverRoles');
  const openNatalChart = () => navigation.navigate('NatalChart');

  if (isBlocked) {
    return (
      <View className="px-5 py-2">
        <LinearGradient
          colors={['rgba(90,58,204,0.06)', 'rgba(201,168,76,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5 rounded-[24px] overflow-hidden relative"
          style={{
            minHeight: 168,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.14)',
          }}
        >
          <View className="absolute top-4 right-4">
            <Compass size={40} color="rgba(201, 168, 76, 0.18)" />
          </View>

          <View className="flex-row items-center mb-2">
            <Sparkles size={15} color={theme.colors.gold} />
            <Text className="text-[13px] font-semibold ml-2" style={{ color: theme.colors.foreground }}>
              Career Matchmaker
            </Text>
          </View>

          <Text className="text-[16px] font-medium tracking-tight mb-1" style={{ color: theme.colors.foreground }}>
            {careerPrerequisites?.blockTitle ?? 'Preparing your career map'}
          </Text>
          <Text className="text-[12px] mb-5 leading-[18px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
            {careerPrerequisites?.blockBody ?? 'Career matching will unlock after your natal chart is ready.'}
          </Text>

          <Pressable
            onPress={careerPrerequisites?.reason === 'checking' ? undefined : openNatalChart}
            disabled={careerPrerequisites?.reason === 'checking'}
            className="flex-row items-center self-start px-4 py-2 rounded-[12px]"
            style={{
              opacity: careerPrerequisites?.reason === 'checking' ? 0.62 : 1,
              backgroundColor: 'rgba(201,168,76,0.1)',
              borderColor: 'rgba(201,168,76,0.18)',
              borderWidth: 1,
            }}
          >
            <Text className="text-[13px] font-semibold" style={{ color: theme.colors.gold, marginRight: 8 }}>
              {careerPrerequisites?.actionLabel ?? 'Open Natal Chart'}
            </Text>
            <ArrowRight size={14} color={theme.colors.gold} />
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="px-5 py-2">
      <Pressable onPress={openDiscoverRoles} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
        <LinearGradient
          colors={['rgba(90,58,204,0.06)', 'rgba(56,204,136,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5 rounded-[24px] overflow-hidden relative"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(90,58,204,0.1)',
          }}
        >
          <View className="absolute top-4 right-4">
            <Compass size={40} color="rgba(90, 58, 204, 0.2)" />
          </View>

          <View className="flex-row items-center mb-2">
            <Sparkles size={15} color={theme.colors.amethyst} />
            <Text className="text-[13px] font-semibold ml-2" style={{ color: theme.colors.foreground }}>
              Career Matchmaker
            </Text>
          </View>

          <Text className="text-[16px] font-medium tracking-tight mb-1" style={{ color: 'rgba(212,212,224,0.85)' }}>
            What job is right for you?
          </Text>
          <Text className="text-[12px] mb-5 leading-[18px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
            Explore roles based on your midheaven sign and planetary strengths.
          </Text>

          <View
            className="flex-row items-center self-start px-4 py-2 rounded-[12px]"
            style={{
              backgroundColor: 'rgba(90,58,204,0.08)',
              borderColor: 'rgba(90,58,204,0.15)',
              borderWidth: 1,
            }}
          >
            <Text className="text-[13px] font-semibold" style={{ color: theme.colors.amethyst, marginRight: 8 }}>
              Discover Roles
            </Text>
            <ArrowRight size={14} color={theme.colors.amethyst} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};
