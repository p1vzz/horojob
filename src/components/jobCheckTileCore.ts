import type { RootStackParamList } from '../types/navigation';

export const JOB_CHECK_TILE_COPY = {
  title: 'Job Posting Check',
  description: 'Analyze any vacancy against your natal chart for cosmic alignment score.',
  placeholder: 'Paste vacancy URL...',
} as const;

export function normalizeJobCheckUrlInput(value: string) {
  return value.trim();
}

export function buildJobCheckScannerParams(
  value: string,
  options: { autoStart?: boolean } = {}
): RootStackParamList['Scanner'] {
  const trimmed = normalizeJobCheckUrlInput(value);
  if (!trimmed) return undefined;

  return {
    initialUrl: trimmed,
    autoStart: options.autoStart ?? false,
  };
}
