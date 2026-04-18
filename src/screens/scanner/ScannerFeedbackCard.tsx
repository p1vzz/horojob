import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity } from '../../utils/brightnessAdaptation';
import { SCREENSHOT_FALLBACK_GUIDANCE, type ScannerErrorState } from '../scannerUtilsCore';

type ScannerFeedbackCardProps = {
  scanSummary: string | null;
  errorState: ScannerErrorState | null;
  retryAtText: string | null;
  canUseScreenshotFallback: boolean;
  hasAnalysis: boolean;
  isLoading: boolean;
  showTechnicalHints: boolean;
  onUpgrade: () => void;
  onOpenScreenshotFallback: () => void;
};

export function ScannerFeedbackCard(props: ScannerFeedbackCardProps) {
  const {
    canUseScreenshotFallback,
    errorState,
    hasAnalysis,
    isLoading,
    onOpenScreenshotFallback,
    onUpgrade,
    retryAtText,
    scanSummary,
    showTechnicalHints,
  } = props;
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();

  return (
    <>
      {showTechnicalHints && scanSummary ? (
        <Text
          className="text-[11px] mt-2"
          style={{ color: adaptColorOpacity('rgba(212,212,224,0.52)', channels.textOpacityMultiplier) }}
        >
          {scanSummary}
        </Text>
      ) : null}

      {errorState ? (
        <View
          className="rounded-[14px] px-3 py-2 mt-3"
          style={{
            backgroundColor: adaptColorOpacity('rgba(255,107,138,0.12)', channels.glowOpacityMultiplier),
            borderColor: adaptColorOpacity('rgba(255,107,138,0.35)', channels.borderOpacityMultiplier),
            borderWidth: 1,
          }}
        >
          <Text
            className="text-[12px] font-semibold"
            style={{ color: adaptColorOpacity('#FF9FB4', channels.textOpacityMultiplier) }}
          >
            {errorState.message}
          </Text>
          {errorState.usageContext ? (
            <Text
              className="text-[11px] mt-1"
              style={{ color: adaptColorOpacity('rgba(255,191,205,0.85)', channels.textOpacityMultiplier) }}
            >
              {errorState.usageContext}
            </Text>
          ) : null}
          {retryAtText ? (
            <Text
              className="text-[11px] mt-1"
              style={{ color: adaptColorOpacity('rgba(255,191,205,0.85)', channels.textOpacityMultiplier) }}
            >
              Retry after: {retryAtText}
            </Text>
          ) : null}
          {canUseScreenshotFallback ? (
            <Text
              className="text-[11px] mt-2"
              style={{ color: adaptColorOpacity('rgba(255,191,205,0.9)', channels.textOpacityMultiplier) }}
            >
              {SCREENSHOT_FALLBACK_GUIDANCE}
            </Text>
          ) : null}
          {errorState.code === 'usage_limit_reached' ? (
            <Pressable
              onPress={onUpgrade}
              className="mt-2 self-start px-3 py-1.5 rounded-full border"
              style={{
                borderColor: adaptColorOpacity('rgba(201,168,76,0.45)', channels.borderOpacityMultiplier),
                backgroundColor: adaptColorOpacity('rgba(201,168,76,0.16)', channels.glowOpacityMultiplier),
              }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: theme.colors.gold }}>
                Upgrade to Premium
              </Text>
            </Pressable>
          ) : null}
          {canUseScreenshotFallback ? (
            <Pressable
              onPress={onOpenScreenshotFallback}
              className="mt-2 self-start px-3 py-1.5 rounded-full border"
              style={{
                borderColor: adaptColorOpacity('rgba(124,229,176,0.45)', channels.borderOpacityMultiplier),
                backgroundColor: adaptColorOpacity('rgba(124,229,176,0.14)', channels.glowOpacityMultiplier),
              }}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{ color: adaptColorOpacity('#8AF0C2', channels.textOpacityMultiplier) }}
              >
                Scan from screenshots
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!hasAnalysis && !isLoading ? (
        <View
          className="rounded-[14px] px-3 py-3 mt-3"
          style={{
            backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
            borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
            borderWidth: 1,
          }}
        >
          <Text
            className="text-[12px] font-semibold"
            style={{ color: adaptColorOpacity('rgba(233,233,242,0.92)', channels.textOpacityMultiplier) }}
          >
            No scan result yet
          </Text>
          <Text
            className="text-[11px] mt-1"
            style={{ color: adaptColorOpacity('rgba(212,212,224,0.55)', channels.textOpacityMultiplier) }}
          >
            Paste a vacancy URL and run scan to see compatibility, overall fit, AI risk, and factor breakdown.
          </Text>
        </View>
      ) : null}
    </>
  );
}
