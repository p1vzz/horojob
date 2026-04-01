import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';

const SESSION_SCAN_TTL_MS = 10 * 60 * 1000;

type JobScanSessionMeta = {
  source: string;
  cached: boolean;
  provider: string | null;
};

type JobScanSessionEntry = {
  key: string;
  analysis: JobAnalyzeSuccessResponse;
  meta: JobScanSessionMeta;
  savedAtMs: number;
};

const cacheByUser = new Map<string, Map<string, JobScanSessionEntry>>();

function normalizeUrlForSessionKey(rawUrl: string) {
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

function getUserCache(userId: string) {
  let userCache = cacheByUser.get(userId);
  if (!userCache) {
    userCache = new Map<string, JobScanSessionEntry>();
    cacheByUser.set(userId, userCache);
  }
  return userCache;
}

function isExpired(entry: JobScanSessionEntry, nowMs: number) {
  return nowMs - entry.savedAtMs >= SESSION_SCAN_TTL_MS;
}

export function loadSessionJobScanForUser(userId: string, url: string) {
  const key = normalizeUrlForSessionKey(url);
  if (!key) return null;

  const userCache = cacheByUser.get(userId);
  if (!userCache) return null;

  const entry = userCache.get(key);
  if (!entry) return null;

  const nowMs = Date.now();
  if (isExpired(entry, nowMs)) {
    userCache.delete(key);
    if (userCache.size === 0) {
      cacheByUser.delete(userId);
    }
    return null;
  }

  return {
    analysis: entry.analysis,
    meta: entry.meta,
  };
}

export function saveSessionJobScanForUser(
  userId: string,
  url: string,
  payload: {
    analysis: JobAnalyzeSuccessResponse;
    meta: JobScanSessionMeta;
  }
) {
  const key = normalizeUrlForSessionKey(url);
  if (!key) return;

  const userCache = getUserCache(userId);
  userCache.set(key, {
    key,
    analysis: payload.analysis,
    meta: payload.meta,
    savedAtMs: Date.now(),
  });
}

export function clearSessionJobScansForUser(userId: string) {
  cacheByUser.delete(userId);
}
