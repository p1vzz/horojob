import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  JobAnalyzeSuccessResponse,
  JobScanHistoryEntry,
  JobScanHistoryMeta,
} from '../services/jobsApiCore';

const JOB_SCAN_HISTORY_KEY_BY_USER = 'job-scan:history:v1-by-user';
export const JOB_SCAN_HISTORY_LIMIT = 8;
export type { JobScanHistoryEntry, JobScanHistoryMeta } from '../services/jobsApiCore';

type JobScanHistoryByUser = Record<string, JobScanHistoryEntry[]>;

function parseByUser(raw: string | null): JobScanHistoryByUser {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const normalized: JobScanHistoryByUser = {};
    for (const [userId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!userId || !Array.isArray(value)) continue;

      const rows: JobScanHistoryEntry[] = [];
      for (const row of value) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
        const candidate = row as Partial<JobScanHistoryEntry>;
        if (
          typeof candidate.url !== 'string' ||
          !candidate.analysis ||
          !candidate.meta ||
          typeof candidate.meta !== 'object' ||
          typeof candidate.savedAt !== 'string'
        ) {
          continue;
        }

        const meta = candidate.meta as Partial<JobScanHistoryMeta>;
        rows.push({
          url: candidate.url,
          analysis: candidate.analysis as JobAnalyzeSuccessResponse,
          meta: {
            source: typeof meta.source === 'string' ? meta.source : 'unknown',
            cached: typeof meta.cached === 'boolean' ? meta.cached : false,
            provider: typeof meta.provider === 'string' || meta.provider === null ? meta.provider : null,
          },
          savedAt: candidate.savedAt,
        });
      }

      normalized[userId] = rows;
    }
    return normalized;
  } catch {
    return {};
  }
}

export function normalizeJobScanHistoryUrlForKey(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return trimmed.toLowerCase();
  }
}

function toTs(iso: string) {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getJobScanHistoryEntryKey(entry: Pick<JobScanHistoryEntry, 'url' | 'analysis'>) {
  const normalizedUrl = normalizeJobScanHistoryUrlForKey(entry.url);
  return normalizedUrl.length > 0 ? normalizedUrl : `analysis:${entry.analysis.analysisId}`;
}

export function mergeJobScanHistoryEntries(entries: JobScanHistoryEntry[], limit = JOB_SCAN_HISTORY_LIMIT) {
  const byKey = new Map<string, JobScanHistoryEntry>();

  for (const entry of entries) {
    const key = getJobScanHistoryEntryKey(entry);
    const existing = byKey.get(key);
    if (!existing || toTs(entry.savedAt) >= toTs(existing.savedAt)) {
      byKey.set(key, entry);
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => toTs(b.savedAt) - toTs(a.savedAt))
    .slice(0, limit);
}

export function selectJobScanHistoryEntriesForSync(
  localEntries: JobScanHistoryEntry[],
  remoteEntries: JobScanHistoryEntry[],
) {
  const remoteByKey = new Map(
    mergeJobScanHistoryEntries(remoteEntries, Number.MAX_SAFE_INTEGER).map((entry) => [
      getJobScanHistoryEntryKey(entry),
      entry,
    ]),
  );

  return mergeJobScanHistoryEntries(localEntries, Number.MAX_SAFE_INTEGER).filter((entry) => {
    const remoteEntry = remoteByKey.get(getJobScanHistoryEntryKey(entry));
    if (!remoteEntry) {
      return true;
    }
    return toTs(entry.savedAt) > toTs(remoteEntry.savedAt);
  });
}

function upsertHistoryEntry(existing: JobScanHistoryEntry[], incoming: JobScanHistoryEntry) {
  return mergeJobScanHistoryEntries([incoming, ...existing]);
}

export async function loadJobScanHistoryForUser(userId: string): Promise<JobScanHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(JOB_SCAN_HISTORY_KEY_BY_USER);
  const byUser = parseByUser(raw);
  return mergeJobScanHistoryEntries(byUser[userId] ?? []);
}

export async function saveJobScanHistoryEntryForUser(userId: string, entry: Omit<JobScanHistoryEntry, 'savedAt'>) {
  const raw = await AsyncStorage.getItem(JOB_SCAN_HISTORY_KEY_BY_USER);
  const byUser = parseByUser(raw);
  const nextEntry: JobScanHistoryEntry = {
    ...entry,
    savedAt: new Date().toISOString(),
  };
  const updated = upsertHistoryEntry(byUser[userId] ?? [], nextEntry);
  byUser[userId] = updated;
  await AsyncStorage.setItem(JOB_SCAN_HISTORY_KEY_BY_USER, JSON.stringify(byUser));
  return updated;
}

export async function replaceJobScanHistoryForUser(userId: string, entries: JobScanHistoryEntry[]) {
  const raw = await AsyncStorage.getItem(JOB_SCAN_HISTORY_KEY_BY_USER);
  const byUser = parseByUser(raw);
  byUser[userId] = mergeJobScanHistoryEntries(entries);
  await AsyncStorage.setItem(JOB_SCAN_HISTORY_KEY_BY_USER, JSON.stringify(byUser));
  return byUser[userId];
}

export async function clearJobScanHistoryForUser(userId: string) {
  const raw = await AsyncStorage.getItem(JOB_SCAN_HISTORY_KEY_BY_USER);
  const byUser = parseByUser(raw);
  if (!byUser[userId]) return;
  delete byUser[userId];
  if (Object.keys(byUser).length === 0) {
    await AsyncStorage.removeItem(JOB_SCAN_HISTORY_KEY_BY_USER);
    return;
  }
  await AsyncStorage.setItem(JOB_SCAN_HISTORY_KEY_BY_USER, JSON.stringify(byUser));
}
