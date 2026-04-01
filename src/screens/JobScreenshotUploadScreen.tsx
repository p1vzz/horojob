import React from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FullScreenCosmicLoader } from '../components/loaders/FullScreenCosmicLoader';
import { useThemeMode } from '../theme/ThemeModeProvider';
import type { AppNavigationProp, AppRouteProp } from '../types/navigation';
import {
  MAX_SCREENSHOTS,
  SCREENSHOT_UPLOAD_TEXTS,
  toScreenshotMbText,
} from './jobScreenshotUploadCore';
import { useJobScreenshotUploadRuntime } from './useJobScreenshotUploadRuntime';
import { JobScreenshotGallery } from './screenshot/JobScreenshotGallery';
import { JobScreenshotUploadActions } from './screenshot/JobScreenshotUploadActions';
import { JobScreenshotUploadHeader } from './screenshot/JobScreenshotUploadHeader';
import { JobScreenshotUploadSummaryCard } from './screenshot/JobScreenshotUploadSummaryCard';

export const JobScreenshotUploadScreen = () => {
  const { theme } = useThemeMode();
  const navigation = useNavigation<AppNavigationProp<'JobScreenshotUpload'>>();
  const route = useRoute<AppRouteProp<'JobScreenshotUpload'>>();
  const { width, height } = Dimensions.get('window');
  const { canAddMore, errorText, isLoading, items, onAnalyzePress, pickScreenshots, removeScreenshot, totalBytes } =
    useJobScreenshotUploadRuntime({
      navigation,
      route,
    });

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient id="shotGrad1" cx="45%" cy="-5%" rx="70%" ry="50%" fx="45%" fy="-5%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(90,58,204,0.35)" stopOpacity="0.35" />
              <Stop offset="55%" stopColor="rgba(90,58,204,0.08)" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="shotGrad2" cx="80%" cy="105%" rx="65%" ry="45%" fx="80%" fy="105%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(201,168,76,0.18)" stopOpacity="0.18" />
              <Stop offset="55%" stopColor="rgba(201,168,76,0.05)" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="rgba(201,168,76,0)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#shotGrad1)" />
          <Rect x="0" y="0" width={width} height={height} fill="url(#shotGrad2)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
            <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-5 pt-6">
              <JobScreenshotUploadHeader onBack={() => navigation.goBack()} />
              <JobScreenshotUploadSummaryCard
                itemCount={items.length}
                maxScreenshots={MAX_SCREENSHOTS}
                totalBytesText={toScreenshotMbText(totalBytes)}
              />
              <JobScreenshotGallery items={items} onRemove={removeScreenshot} />
              <JobScreenshotUploadActions
                canAddMore={canAddMore}
                errorText={errorText}
                hasItems={items.length > 0}
                isLoading={isLoading}
                onAnalyzePress={onAnalyzePress}
                onPickScreenshots={pickScreenshots}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ position: 'absolute', inset: 0 }}>
          <FullScreenCosmicLoader
            title={SCREENSHOT_UPLOAD_TEXTS.loadingTitle}
            subtitle={SCREENSHOT_UPLOAD_TEXTS.loadingSubtitle}
          />
        </View>
      ) : null}
    </View>
  );
};
