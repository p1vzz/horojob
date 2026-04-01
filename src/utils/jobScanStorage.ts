import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';

const JOB_SCAN_KEY_BY_USER = 'job-scan:last:v1-by-user';

export type JobScanCache = {
  url: string;
  analysis: JobAnalyzeSuccessResponse;
  meta: {
    source: string;
    cached: boolean;
    provider: string | null;
  };
  savedAt: string;
};

type JobScanByUser = Record<string, JobScanCache>;

function parseByUser(raw: string | null): JobScanByUser {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const normalized: JobScanByUser = {};
    for (const [userId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!userId || !value || typeof value !== 'object' || Array.isArray(value)) continue;
      const candidate = value as Partial<JobScanCache>;
      if (
        typeof candidate.url !== 'string' ||
        !candidate.analysis ||
        typeof candidate.meta !== 'object' ||
        candidate.meta === null ||
        typeof candidate.savedAt !== 'string'
      ) {
        continue;
      }

      const meta = candidate.meta as Partial<JobScanCache['meta']>;
      normalized[userId] = {
        url: candidate.url,
        analysis: candidate.analysis as JobAnalyzeSuccessResponse,
        meta: {
          source: typeof meta.source === 'string' ? meta.source : 'unknown',
          cached: typeof meta.cached === 'boolean' ? meta.cached : false,
          provider: typeof meta.provider === 'string' || meta.provider === null ? meta.provider : null,
        },
        savedAt: candidate.savedAt,
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

export async function saveLastJobScanForUser(
  userId: string,
  payload: Omit<JobScanCache, 'savedAt'> & { savedAt?: string }
) {
  const raw = await AsyncStorage.getItem(JOB_SCAN_KEY_BY_USER);
  const byUser = parseByUser(raw);
  byUser[userId] = {
    ...payload,
    savedAt: payload.savedAt ?? new Date().toISOString(),
  };
  await AsyncStorage.setItem(JOB_SCAN_KEY_BY_USER, JSON.stringify(byUser));
}

export async function loadLastJobScanForUser(userId: string): Promise<JobScanCache | null> {
  const raw = await AsyncStorage.getItem(JOB_SCAN_KEY_BY_USER);
  const byUser = parseByUser(raw);
  return byUser[userId] ?? null;
}

export async function clearLastJobScanForUser(userId: string) {
  const raw = await AsyncStorage.getItem(JOB_SCAN_KEY_BY_USER);
  const byUser = parseByUser(raw);
  if (!byUser[userId]) return;
  delete byUser[userId];
  if (Object.keys(byUser).length === 0) {
    await AsyncStorage.removeItem(JOB_SCAN_KEY_BY_USER);
    return;
  }
  await AsyncStorage.setItem(JOB_SCAN_KEY_BY_USER, JSON.stringify(byUser));
}
