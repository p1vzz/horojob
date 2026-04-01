import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';

const JOB_SCAN_HISTORY_KEY_BY_USER = 'job-scan:history:v1-by-user';
const JOB_SCAN_HISTORY_LIMIT = 8;

type JobScanHistoryMeta = {
  source: string;
  cached: boolean;
  provider: string | null;
};

export type JobScanHistoryEntry = {
  url: string;
  analysis: JobAnalyzeSuccessResponse;
  meta: JobScanHistoryMeta;
  savedAt: string;
};

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

function normalizeUrlForHistoryKey(rawUrl: string) {
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

function upsertHistoryEntry(existing: JobScanHistoryEntry[], incoming: JobScanHistoryEntry) {
  const incomingKey = normalizeUrlForHistoryKey(incoming.url);
  const filtered = existing.filter((entry) => normalizeUrlForHistoryKey(entry.url) !== incomingKey);
  const merged = [incoming, ...filtered].sort((a, b) => toTs(b.savedAt) - toTs(a.savedAt));
  return merged.slice(0, JOB_SCAN_HISTORY_LIMIT);
}

export async function loadJobScanHistoryForUser(userId: string): Promise<JobScanHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(JOB_SCAN_HISTORY_KEY_BY_USER);
  const byUser = parseByUser(raw);
  return (byUser[userId] ?? []).slice(0, JOB_SCAN_HISTORY_LIMIT);
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
