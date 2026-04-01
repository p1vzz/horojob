import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';
import type { ScannerImportedMeta } from '../types/navigation';

export type JobScreenshotItem = {
  id: string;
  uri: string;
  dataUrl: string;
  bytes: number;
};

export type ScreenshotPickerAssetInput = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

export type ScreenshotAnalyzeApiErrorLike = {
  status: number;
  payload: unknown;
};

export const MAX_SCREENSHOTS = 4;

export const SCREENSHOT_UPLOAD_TEXTS = {
  screenTitle: 'Analyze From Screenshots',
  summaryTitle: 'Upload vacancy screenshots',
  summaryBody:
    'If the vacancy page is closed or blocked, upload 1 to 4 screenshots. We will parse visible details and build compatibility score from your natal chart.',
  selectedHeading: 'SELECTED SCREENSHOTS',
  pickAction: 'Upload Screenshots',
  pickActionDisabled: 'Max screenshots reached',
  analyzeAction: 'Analyze Screenshots',
  loadingTitle: 'Reading Screenshots',
  loadingSubtitle: 'Extracting vacancy details and scoring compatibility...',
  mediaPermissionRequired: 'Media permission is required to upload screenshots.',
  unreadableImages: 'Could not read selected images. Please try different screenshots.',
  emptyAnalyze: 'Upload at least one screenshot first.',
  genericAnalyzeError: 'Screenshot parsing failed. Please try again.',
  fallbackImportUrl: 'Screenshot Upload',
} as const;

function asRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  return input as Record<string, unknown>;
}

export function toScreenshotMbText(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function selectionLimitForAdditionalScreenshots(currentCount: number, max = MAX_SCREENSHOTS) {
  return Math.max(1, max - currentCount);
}

export function buildScreenshotItems(
  assets: ScreenshotPickerAssetInput[],
  createId: (asset: ScreenshotPickerAssetInput, index: number) => string
) {
  const items: JobScreenshotItem[] = [];

  for (const [index, asset] of assets.entries()) {
    if (!asset.base64 || asset.base64.length === 0) {
      continue;
    }

    const mimeType = typeof asset.mimeType === 'string' && asset.mimeType.length > 0 ? asset.mimeType : 'image/jpeg';
    items.push({
      id: createId(asset, index),
      uri: asset.uri,
      dataUrl: `data:${mimeType};base64,${asset.base64}`,
      bytes: Math.round((asset.fileSize ?? asset.base64.length * 0.75) || 0),
    });
  }

  return items;
}

export function mergeScreenshotItems(
  current: JobScreenshotItem[],
  incoming: JobScreenshotItem[],
  limit = MAX_SCREENSHOTS
) {
  const merged = [...current];

  for (const item of incoming) {
    if (merged.length >= limit) {
      break;
    }

    if (merged.some((entry) => entry.uri === item.uri)) {
      continue;
    }

    merged.push(item);
  }

  return merged;
}

export function buildScannerImportFromScreenshotAnalysis(result: JobAnalyzeSuccessResponse, failedUrl: string) {
  const importedMeta: ScannerImportedMeta = {
    source: result.job?.source ?? 'manual',
    cached: false,
    provider: result.providerUsed ?? 'screenshot_vision',
  };

  return {
    importedMeta,
    importedUrl:
      failedUrl.trim().length > 0 ? failedUrl.trim() : SCREENSHOT_UPLOAD_TEXTS.fallbackImportUrl,
  };
}

export function toScreenshotAnalyzeErrorMessage(
  error: unknown,
  isApiError: (value: unknown) => value is ScreenshotAnalyzeApiErrorLike
) {
  if (!isApiError(error)) {
    return SCREENSHOT_UPLOAD_TEXTS.genericAnalyzeError;
  }

  const payload = asRecord(error.payload);
  const code = typeof payload?.code === 'string' ? payload.code : 'unknown';
  const reason = typeof payload?.reason === 'string' ? payload.reason : null;
  const missingFields = Array.isArray(payload?.missingFields)
    ? payload.missingFields.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];

  if (code === 'screenshot_not_vacancy') {
    return reason
      ? `Uploaded screenshots do not look like a vacancy page. ${reason}`
      : 'Uploaded screenshots do not look like a vacancy page.';
  }

  if (code === 'screenshot_incomplete_info') {
    if (missingFields.length > 0) {
      return `Not enough vacancy details are visible in screenshots. Missing: ${missingFields.join(', ')}.`;
    }

    return 'Not enough vacancy details are visible in screenshots.';
  }

  if (code === 'usage_limit_reached') {
    return 'You reached your plan limit for vacancy scans.';
  }

  if (typeof payload?.error === 'string') {
    return payload.error;
  }

  return `Screenshot parsing failed (${error.status}). Please try again.`;
}
