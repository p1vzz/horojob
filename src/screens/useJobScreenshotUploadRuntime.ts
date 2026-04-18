import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ApiError } from '../services/authSession';
import { analyzeJobScreenshots } from '../services/jobsApi';
import type { AppNavigationProp, AppRouteProp } from '../types/navigation';
import {
  MAX_SCREENSHOTS,
  SCREENSHOT_UPLOAD_TEXTS,
  buildScannerImportFromScreenshotAnalysis,
  buildScreenshotItems,
  mergeScreenshotItems,
  selectionLimitForAdditionalScreenshots,
  toScreenshotAnalyzeErrorMessage,
  validateScreenshotPayloadSize,
  type JobScreenshotItem,
  type ScreenshotAnalyzeApiErrorLike,
} from './jobScreenshotUploadCore';

type UseJobScreenshotUploadRuntimeArgs = {
  navigation: AppNavigationProp<'JobScreenshotUpload'>;
  route: AppRouteProp<'JobScreenshotUpload'>;
  deps?: {
    requestMediaLibraryPermissionsAsync?: typeof ImagePicker.requestMediaLibraryPermissionsAsync;
    launchImageLibraryAsync?: typeof ImagePicker.launchImageLibraryAsync;
    analyzeJobScreenshots?: typeof analyzeJobScreenshots;
    isApiError?: (value: unknown) => value is ScreenshotAnalyzeApiErrorLike;
    now?: () => number;
    random?: () => number;
  };
};

export function useJobScreenshotUploadRuntime(args: UseJobScreenshotUploadRuntimeArgs) {
  const { navigation, route, deps } = args;
  const requestMediaLibraryPermissionsAsync =
    deps?.requestMediaLibraryPermissionsAsync ?? ImagePicker.requestMediaLibraryPermissionsAsync;
  const launchImageLibraryAsync = deps?.launchImageLibraryAsync ?? ImagePicker.launchImageLibraryAsync;
  const analyzeScreenshots = deps?.analyzeJobScreenshots ?? analyzeJobScreenshots;
  const isApiError =
    deps?.isApiError ??
    ((value: unknown): value is ScreenshotAnalyzeApiErrorLike => value instanceof ApiError);
  const now = deps?.now ?? Date.now;
  const random = deps?.random ?? Math.random;
  const [items, setItems] = React.useState<JobScreenshotItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  const failedUrl = React.useMemo(
    () => (typeof route.params?.failedUrl === 'string' ? route.params.failedUrl : ''),
    [route.params?.failedUrl]
  );
  const canAddMore = items.length < MAX_SCREENSHOTS;
  const totalBytes = items.reduce((sum, entry) => sum + entry.bytes, 0);

  const pickScreenshots = React.useCallback(async () => {
    setErrorText(null);
    const permission = await requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorText(SCREENSHOT_UPLOAD_TEXTS.mediaPermissionRequired);
      return;
    }

    const selectionLimit = selectionLimitForAdditionalScreenshots(items.length);
    const result = await launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit,
      base64: true,
      quality: 0.55,
      exif: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const nextItems = buildScreenshotItems(result.assets, (asset, index) => {
      const suffix = Math.round(random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      return `${asset.uri}:${now()}:${suffix}:${index}`;
    });

    if (nextItems.length === 0) {
      setErrorText(SCREENSHOT_UPLOAD_TEXTS.unreadableImages);
      return;
    }

    const mergedItems = mergeScreenshotItems(items, nextItems);
    setItems(mergedItems);

    const sizeError = validateScreenshotPayloadSize(mergedItems);
    if (sizeError) {
      setErrorText(sizeError);
    }
  }, [items, launchImageLibraryAsync, now, random, requestMediaLibraryPermissionsAsync]);

  const removeScreenshot = React.useCallback((id: string) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const onAnalyzePress = React.useCallback(async () => {
    if (items.length === 0) {
      setErrorText(SCREENSHOT_UPLOAD_TEXTS.emptyAnalyze);
      return;
    }

    const sizeError = validateScreenshotPayloadSize(items);
    if (sizeError) {
      setErrorText(sizeError);
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      const result = await analyzeScreenshots(items.map((entry) => entry.dataUrl));
      const { importedMeta, importedUrl } = buildScannerImportFromScreenshotAnalysis(result, failedUrl);

      navigation.navigate('Scanner', {
        importedAnalysis: result,
        importedMeta,
        importedUrl,
      });
    } catch (error) {
      setErrorText(toScreenshotAnalyzeErrorMessage(error, isApiError));
    } finally {
      setIsLoading(false);
    }
  }, [analyzeScreenshots, failedUrl, isApiError, items, navigation]);

  return {
    canAddMore,
    errorText,
    failedUrl,
    isLoading,
    items,
    onAnalyzePress,
    pickScreenshots,
    removeScreenshot,
    totalBytes,
  };
}
