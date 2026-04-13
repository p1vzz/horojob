import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { ChevronLeft, Link as LinkIcon } from 'lucide-react-native';
import { ScanButton } from '../../components/ScanButton';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../../utils/brightnessAdaptation';
import type { SourceHintState } from '../scannerUtils';

type ScannerSearchPanelProps = {
  url: string;
  onChangeUrl: (value: string) => void;
  onScanPress: () => void;
  isLoading: boolean;
  sourceHint: SourceHintState;
  onBack: () => void;
};

export function ScannerSearchPanel(props: ScannerSearchPanelProps) {
  const { isLoading, onBack, onChangeUrl, onScanPress, sourceHint, url } = props;
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();

  return (
    <>
      <View className="flex-row items-center mb-4">
        <Pressable
          onPress={onBack}
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{
            backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
            borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
            borderWidth: 1,
          }}
        >
          <ChevronLeft size={18} color={adaptColorOpacity('rgba(212,212,224,0.75)', channels.textOpacityMultiplier)} />
        </Pressable>
        <Text className="text-[15px] font-semibold" style={{ color: theme.colors.foreground }}>
          Job Posting Check
        </Text>
        <View
          className="ml-auto px-2.5 py-1 rounded-full border"
          style={{
            borderColor: adaptColorOpacity('rgba(90,58,204,0.4)', channels.borderOpacityMultiplier),
            backgroundColor: adaptColorOpacity('rgba(90,58,204,0.12)', channels.glowOpacityMultiplier),
          }}
        >
          <Text
            className="text-[10px] uppercase tracking-[2px]"
            style={{ color: adaptColorOpacity('#8C7CFF', channels.textOpacityMultiplier) }}
          >
            Deep Analysis
          </Text>
        </View>
      </View>

      <View
        className="rounded-[18px] p-1"
        style={{
          backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
          borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center px-3 py-2">
          <View className="flex-1 flex-row items-center">
            <LinkIcon size={14} color={adaptColorOpacity('rgba(212,212,224,0.4)', channels.textOpacityMultiplier)} />
            <TextInput
              value={url}
              onChangeText={onChangeUrl}
              placeholder="Paste vacancy URL..."
              placeholderTextColor={adaptColorOpacity('rgba(212,212,224,0.35)', channels.textOpacityMultiplier)}
              className="flex-1 text-[14px] ml-2"
              style={{ color: theme.colors.foreground }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <ScanButton onPress={onScanPress} disabled={isLoading} />
        </View>
      </View>

      <Text
        className="text-[11px] mt-2"
        style={{
          color:
            sourceHint.tone === 'positive'
              ? adaptColorOpacity('rgba(124,229,176,0.85)', channels.textOpacityMultiplier)
              : sourceHint.tone === 'warning'
                ? adaptColorOpacity('rgba(255,191,128,0.88)', channels.textOpacityMultiplier)
                : adaptColorOpacity('rgba(212,212,224,0.52)', channels.textOpacityMultiplier),
        }}
      >
        {sourceHint.message}
      </Text>
    </>
  );
}
