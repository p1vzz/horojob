import React from 'react';
import { View, Text, TextInput, Pressable, Keyboard } from 'react-native';
import { ArrowRight, ChevronLeft, Link as LinkIcon } from 'lucide-react-native';
import { ScanButton } from '../../components/ScanButton';
import { ScanDepthBadge } from '../../components/ScanDepthBadge';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../../utils/brightnessAdaptation';
import type { SourceHintState } from '../scannerUtils';
import type { ScannerHistoryDisplay } from '../scannerRuntimeCore';

type ScannerSearchPanelProps = {
  url: string;
  onChangeUrl: (value: string) => void;
  onScanPress: () => void;
  isLoading: boolean;
  sourceHint: SourceHintState;
  historicalScan: ScannerHistoryDisplay | null;
  onBack: () => void;
  onOpenHistoricalUrl: () => void;
  onOpenHistory: () => void;
};

export function ScannerSearchPanel(props: ScannerSearchPanelProps) {
  const {
    historicalScan,
    isLoading,
    onBack,
    onChangeUrl,
    onOpenHistoricalUrl,
    onOpenHistory,
    onScanPress,
    sourceHint,
    url,
  } = props;
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();
  const isHistoricalScan = historicalScan !== null;
  const handleScanPress = React.useCallback(() => {
    Keyboard.dismiss();
    onScanPress();
  }, [onScanPress]);

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
        <Pressable
          accessibilityRole="button"
          onPress={onOpenHistory}
          className="ml-auto flex-row items-center px-2.5 py-1.5 rounded-[8px] border"
          style={{
            borderColor: adaptColorOpacity('rgba(201,168,76,0.36)', channels.borderOpacityMultiplier),
            backgroundColor: adaptColorOpacity('rgba(201,168,76,0.12)', channels.glowOpacityMultiplier),
          }}
        >
          <Text
            className="text-[11px] font-semibold mr-1"
            style={{ color: adaptColorOpacity('#E6CA73', channels.textOpacityMultiplier) }}
          >
            History
          </Text>
          <ArrowRight size={12} color={adaptColorOpacity('#E6CA73', channels.textOpacityMultiplier)} />
        </Pressable>
      </View>

      <View
        className="rounded-[8px] p-1"
        style={{
          backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
          borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
          borderWidth: 1,
        }}
      >
        {isHistoricalScan ? (
          <View className="px-3 py-3">
            <Text
              className="text-[10px] uppercase mb-1"
              style={{ color: adaptColorOpacity('rgba(212,212,224,0.48)', channels.textOpacityMultiplier) }}
            >
              Saved scan
            </Text>
            <View className="flex-row items-start">
              <Text className="text-[14px] font-semibold leading-[20px] flex-1 mr-2" style={{ color: theme.colors.foreground }}>
                {historicalScan.title}
              </Text>
              <ScanDepthBadge depth={historicalScan.scanDepth} compact />
            </View>
            <Pressable
              accessibilityRole={historicalScan.canOpenUrl ? 'link' : 'text'}
              disabled={!historicalScan.canOpenUrl}
              onPress={onOpenHistoricalUrl}
              className="flex-row items-center mt-2"
            >
              <LinkIcon size={13} color={adaptColorOpacity('rgba(212,212,224,0.5)', channels.textOpacityMultiplier)} />
              <Text
                numberOfLines={2}
                className="text-[11px] leading-[16px] ml-1.5 flex-1"
                style={{ color: adaptColorOpacity('rgba(212,212,224,0.58)', channels.textOpacityMultiplier) }}
              >
                {historicalScan.url}
              </Text>
            </Pressable>
          </View>
        ) : (
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
            <ScanButton onPress={handleScanPress} disabled={isLoading} />
          </View>
        )}
      </View>

      {isHistoricalScan ? (
        <Text
          className="text-[11px] mt-2"
          style={{ color: adaptColorOpacity('rgba(212,212,224,0.52)', channels.textOpacityMultiplier) }}
        >
          Use the back arrow to return to your current scan.
        </Text>
      ) : (
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
      )}
    </>
  );
}
