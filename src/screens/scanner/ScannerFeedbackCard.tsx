import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import type { ScannerErrorState } from '../scannerUtils';

type ScannerFeedbackCardProps = {
  scanSummary: string | null;
  errorState: ScannerErrorState | null;
  retryAtText: string | null;
  canUseScreenshotFallback: boolean;
  hasAnalysis: boolean;
  isLoading: boolean;
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
  } = props;
  const { theme } = useThemeMode();

  return (
    <>
      {scanSummary ? (
        <Text className="text-[11px] mt-2" style={{ color: 'rgba(212,212,224,0.52)' }}>
          {scanSummary}
        </Text>
      ) : null}

      {errorState ? (
        <View
          className="rounded-[14px] px-3 py-2 mt-3"
          style={{
            backgroundColor: 'rgba(255,107,138,0.12)',
            borderColor: 'rgba(255,107,138,0.35)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: '#FF9FB4' }}>
            {errorState.message}
          </Text>
          {errorState.usageContext ? (
            <Text className="text-[11px] mt-1" style={{ color: 'rgba(255,191,205,0.85)' }}>
              {errorState.usageContext}
            </Text>
          ) : null}
          {retryAtText ? (
            <Text className="text-[11px] mt-1" style={{ color: 'rgba(255,191,205,0.85)' }}>
              Retry after: {retryAtText}
            </Text>
          ) : null}
          {errorState.code === 'usage_limit_reached' ? (
            <Pressable
              onPress={onUpgrade}
              className="mt-2 self-start px-3 py-1.5 rounded-full border"
              style={{
                borderColor: 'rgba(201,168,76,0.45)',
                backgroundColor: 'rgba(201,168,76,0.16)',
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
                borderColor: 'rgba(124,229,176,0.45)',
                backgroundColor: 'rgba(124,229,176,0.14)',
              }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: '#8AF0C2' }}>
                Upload screenshots instead
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!hasAnalysis && !isLoading ? (
        <View
          className="rounded-[14px] px-3 py-3 mt-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
            No scan result yet
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.55)' }}>
            Paste a vacancy URL and run scan to see compatibility, overall fit, AI risk, and factor breakdown.
          </Text>
        </View>
      ) : null}
    </>
  );
}
