import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Search, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../utils/brightnessAdaptation';
import { JOB_CHECK_SUPPORTED_SERVICES, JOB_CHECK_TILE_COPY } from './jobCheckTileCore';
import { getJobCheckTileVisuals } from './jobCheckTileVisuals';

export const JobCheckTile = React.memo(() => {
  const theme = useAppTheme();
  const { channels } = useBrightnessAdaptation();
  const navigation = useNavigation<AppNavigationProp>();
  const baseVisuals = getJobCheckTileVisuals(theme.isLight);
  const visuals = useMemo(
    () => ({
      actionBackground: adaptColorOpacity(
        baseVisuals.actionBackground,
        channels.glowOpacityMultiplier
      ),
      actionBorder: adaptColorOpacity(baseVisuals.actionBorder, channels.borderOpacityMultiplier),
      actionIcon: adaptColorOpacity(baseVisuals.actionIcon, channels.textOpacityMultiplier),
      actionText: adaptColorOpacity(baseVisuals.actionText, channels.textOpacityMultiplier),
      descriptionText: adaptColorOpacity(baseVisuals.descriptionText, channels.textOpacityMultiplier),
      footnoteText: adaptColorOpacity(baseVisuals.footnoteText, channels.textOpacityMultiplier),
      serviceBackground: adaptColorOpacity(baseVisuals.serviceBackground, channels.glowOpacityMultiplier),
      serviceBorder: adaptColorOpacity(baseVisuals.serviceBorder, channels.borderOpacityMultiplier),
      serviceDetailText: adaptColorOpacity(baseVisuals.serviceDetailText, channels.textOpacityMultiplier),
      serviceDot: adaptColorOpacity(baseVisuals.serviceDot, channels.textOpacityMultiplier),
      serviceLabelText: adaptColorOpacity(baseVisuals.serviceLabelText, channels.textOpacityMultiplier),
      servicesLabelText: adaptColorOpacity(
        baseVisuals.servicesLabelText,
        channels.textOpacityMultiplier
      ),
    }),
    [baseVisuals, channels]
  );

  const navigateToScanner = React.useCallback(() => {
    navigation.navigate('Scanner');
  }, [navigation]);

  return (
    <View className="px-5 py-2">
      <View
        className="p-5 rounded-[24px]"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center mb-3">
          <Search size={16} color={theme.colors.amethyst} />
          <Text className="text-[13px] font-semibold ml-2" style={{ color: theme.colors.foreground }}>
            {JOB_CHECK_TILE_COPY.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open job scanner"
            style={{ marginLeft: 'auto' }}
            onPress={navigateToScanner}
            hitSlop={8}
          >
            <ArrowRight size={14} color={visuals.actionIcon} />
          </Pressable>
        </View>

        <Text className="text-[12px] mb-4 leading-[18px]" style={{ color: visuals.descriptionText }}>
          {JOB_CHECK_TILE_COPY.description}
        </Text>

        <Text className="text-[10px] font-semibold uppercase mb-2" style={{ color: visuals.servicesLabelText }}>
          {JOB_CHECK_TILE_COPY.servicesLabel}
        </Text>

        <View className="flex-row flex-wrap mb-2">
          {JOB_CHECK_SUPPORTED_SERVICES.map((service, index) => (
            <View
              key={service.label}
              className="rounded-[8px] px-3 py-2"
              style={{
                backgroundColor: visuals.serviceBackground,
                borderColor: visuals.serviceBorder,
                borderWidth: 1,
                flexBasis: index === JOB_CHECK_SUPPORTED_SERVICES.length - 1 ? '100%' : '48%',
                marginBottom: 8,
                marginRight: index % 2 === 0 && index !== JOB_CHECK_SUPPORTED_SERVICES.length - 1 ? 8 : 0,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-1.5 h-1.5 rounded-full mr-2"
                  style={{ backgroundColor: visuals.serviceDot }}
                />
                <Text
                  className="text-[12px] font-semibold"
                  numberOfLines={1}
                  style={{ color: visuals.serviceLabelText }}
                >
                  {service.label}
                </Text>
              </View>
              <Text
                className="text-[10px] mt-1"
                numberOfLines={1}
                style={{ color: visuals.serviceDetailText }}
              >
                {service.detail}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center">
          <Text className="flex-1 text-[11px] leading-[16px] pr-3" style={{ color: visuals.footnoteText }}>
            {JOB_CHECK_TILE_COPY.footnote}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={navigateToScanner}
            className="flex-row items-center rounded-[8px] px-3 py-2 border"
            style={{
              backgroundColor: visuals.actionBackground,
              borderColor: visuals.actionBorder,
            }}
          >
            <Text className="text-[11px] font-semibold mr-1.5" style={{ color: visuals.actionText }}>
              {JOB_CHECK_TILE_COPY.actionLabel}
            </Text>
            <ArrowRight size={13} color={visuals.actionText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});
