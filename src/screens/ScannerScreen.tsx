import React, { useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { FullScreenCosmicLoader } from '../components/loaders/FullScreenCosmicLoader';
import type { AppNavigationProp, AppRouteProp } from '../types/navigation';
import {
  SCREENSHOT_FALLBACK_ERROR_CODES,
  formatRetryAt,
  sourceHintFromUrl,
  toPhaseSubtitle,
  toPhaseTitle,
} from './scannerUtils';
import { ScannerAnalysisSection } from './scanner/ScannerAnalysisSection';
import { ScannerFeedbackCard } from './scanner/ScannerFeedbackCard';
import { ScannerSearchPanel } from './scanner/ScannerSearchPanel';
import { useScannerRuntime } from './useScannerRuntime';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptOpacity } from '../utils/brightnessAdaptation';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';

export const ScannerScreen = () => {
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();
  const pageAnim = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');
  const navigation = useNavigation<AppNavigationProp<'Scanner'>>();
  const route = useRoute<AppRouteProp<'Scanner'>>();
  const {
    analysis,
    errorState,
    historicalScan,
    isLoading,
    onReturnToActiveScan,
    onRunFullAnalysis,
    onScanPress,
    phase,
    scanMeta,
    setUrl,
    url,
  } = useScannerRuntime({
    navigation,
    route,
  });

  React.useEffect(() => {
    Animated.timing(pageAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pageAnim]);

  const contentStyle = {
    opacity: pageAnim,
    transform: [
      {
        translateY: pageAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  const hasAnalysis = analysis !== null;
  const retryAtText = formatRetryAt(errorState?.retryAt ?? null);
  const sourceHint = useMemo(() => sourceHintFromUrl(url), [url]);
  const canUseScreenshotFallback =
    !!errorState && SCREENSHOT_FALLBACK_ERROR_CODES.has(errorState.code) && !isLoading;

  const scanSummary = useMemo(() => {
    if (!scanMeta) return null;
    const source = scanMeta.source.toUpperCase();
    const providerLabel = scanMeta.provider ? ` via ${scanMeta.provider.replace('_', ' ')}` : '';
    const depthLabel = analysis?.scanDepth === 'lite' ? 'Lite' : 'Full';
    return `${depthLabel} | ${source}${providerLabel}${scanMeta.cached ? ' - cached result' : ' - fresh scan'}`;
  }, [analysis?.scanDepth, scanMeta]);

  const openHistory = React.useCallback(() => {
    navigation.navigate('ScannerHistory');
  }, [navigation]);

  const openHistoricalUrl = React.useCallback(() => {
    if (!historicalScan?.canOpenUrl) return;
    const trimmed = historicalScan.url.trim();
    const externalUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
    void Linking.openURL(externalUrl).catch(() => {
      // Opening source URLs is optional and should not block scanner usage.
    });
  }, [historicalScan]);

  const handleBack = React.useCallback(() => {
    if (historicalScan) {
      onReturnToActiveScan();
      return;
    }
    navigation.navigate('Dashboard');
  }, [historicalScan, navigation, onReturnToActiveScan]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient
              id="scanGrad1"
              cx="45%"
              cy="-5%"
              rx="70%"
              ry="50%"
              fx="45%"
              fy="-5%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor="rgba(90,58,204,0.35)"
                stopOpacity={adaptOpacity(0.35, channels.glowOpacityMultiplier).toString()}
              />
              <Stop
                offset="55%"
                stopColor="rgba(90,58,204,0.08)"
                stopOpacity={adaptOpacity(0.08, channels.glowOpacityMultiplier).toString()}
              />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="scanGrad2"
              cx="80%"
              cy="105%"
              rx="65%"
              ry="45%"
              fx="80%"
              fy="105%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopColor="rgba(201,168,76,0.18)"
                stopOpacity={adaptOpacity(0.18, channels.glowOpacityMultiplier).toString()}
              />
              <Stop
                offset="55%"
                stopColor="rgba(201,168,76,0.05)"
                stopOpacity={adaptOpacity(0.05, channels.glowOpacityMultiplier).toString()}
              />
              <Stop offset="100%" stopColor="rgba(201,168,76,0)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#scanGrad1)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#scanGrad2)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                {
                  width: '100%',
                  maxWidth: 430,
                  alignSelf: 'center',
                },
                contentStyle,
              ]}
              className="pt-6"
            >
              <View className="px-5">
                <ScannerSearchPanel
                  url={url}
                  onChangeUrl={setUrl}
                  onScanPress={onScanPress}
                  isLoading={isLoading}
                  sourceHint={sourceHint}
                  historicalScan={historicalScan}
                  onBack={handleBack}
                  onOpenHistoricalUrl={openHistoricalUrl}
                  onOpenHistory={openHistory}
                />
                <ScannerFeedbackCard
                  scanSummary={scanSummary}
                  errorState={errorState}
                  retryAtText={retryAtText}
                  canUseScreenshotFallback={canUseScreenshotFallback}
                  hasAnalysis={hasAnalysis}
                  isLoading={isLoading}
                  showTechnicalHints={SHOULD_EXPOSE_TECHNICAL_SURFACES}
                  onUpgrade={() => navigation.navigate('PremiumPurchase')}
                  onOpenScreenshotFallback={() =>
                    navigation.navigate('JobScreenshotUpload', {
                      failedUrl: url.trim(),
                      failedCode: errorState?.code,
                    })
                  }
                />
              </View>
              <ScannerAnalysisSection
                analysis={analysis}
                isLoading={isLoading}
                onRunFullAnalysis={onRunFullAnalysis}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ position: 'absolute', inset: 0 }}>
          <FullScreenCosmicLoader title={toPhaseTitle(phase)} subtitle={toPhaseSubtitle(phase)} />
        </View>
      ) : null}
    </View>
  );
};
