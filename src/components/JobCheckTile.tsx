import React, { useMemo } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Search, Link as LinkIcon, ArrowRight } from 'lucide-react-native';
import { ScanButton } from './ScanButton';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../utils/brightnessAdaptation';
import { buildJobCheckScannerParams, JOB_CHECK_TILE_COPY } from './jobCheckTileCore';
import { JOB_CHECK_TILE_VISUALS } from './jobCheckTileVisuals';

export const JobCheckTile = React.memo(() => {
  const theme = useAppTheme();
  const { channels } = useBrightnessAdaptation();
  const navigation = useNavigation<AppNavigationProp>();
  const [urlInput, setUrlInput] = React.useState('');
  const visuals = useMemo(
    () => ({
      actionIcon: adaptColorOpacity(JOB_CHECK_TILE_VISUALS.actionIcon, channels.textOpacityMultiplier),
      descriptionText: adaptColorOpacity(JOB_CHECK_TILE_VISUALS.descriptionText, channels.textOpacityMultiplier),
      inputBackground: adaptColorOpacity(
        JOB_CHECK_TILE_VISUALS.inputBackground,
        channels.glowOpacityMultiplier
      ),
      inputBorder: adaptColorOpacity(JOB_CHECK_TILE_VISUALS.inputBorder, channels.borderOpacityMultiplier),
      inputIcon: adaptColorOpacity(JOB_CHECK_TILE_VISUALS.inputIcon, channels.textOpacityMultiplier),
      inputPlaceholder: adaptColorOpacity(
        JOB_CHECK_TILE_VISUALS.inputPlaceholder,
        channels.textOpacityMultiplier
      ),
    }),
    [channels]
  );

  const navigateToScanner = (options?: { autoStart?: boolean }) => {
    const scannerParams = buildJobCheckScannerParams(urlInput, options);
    if (!scannerParams) {
      navigation.navigate('Scanner');
      return;
    }

    navigation.navigate('Scanner', scannerParams);
  };

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
          <Pressable style={{ marginLeft: 'auto' }} onPress={() => navigateToScanner()}>
            <ArrowRight size={14} color={visuals.actionIcon} />
          </Pressable>
        </View>

        <Text className="text-[12px] mb-4 leading-[18px]" style={{ color: visuals.descriptionText }}>
          {JOB_CHECK_TILE_COPY.description}
        </Text>

        <View
          className="flex-row items-center rounded-[14px] p-1.5"
          style={{
            backgroundColor: visuals.inputBackground,
            borderColor: visuals.inputBorder,
            borderWidth: 1,
          }}
        >
          <View className="flex-1 flex-row items-center pl-3 pr-2">
            <LinkIcon size={13} color={visuals.inputIcon} />
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder={JOB_CHECK_TILE_COPY.placeholder}
              placeholderTextColor={visuals.inputPlaceholder}
              className="flex-1 h-10 text-[13px] ml-2"
              style={{ color: theme.colors.foreground }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScanButton onPress={() => navigateToScanner({ autoStart: true })} />
        </View>
      </View>
    </View>
  );
});
