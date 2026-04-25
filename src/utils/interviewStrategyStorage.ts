import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  InterviewStrategyCalendarPermissionCache,
  InterviewStrategyCalendarSyncMap,
} from '../types/interviewStrategy';

const INTERVIEW_PREFERENCES_KEY_PREFIX = 'interview-strategy:preferences:v1';
const INTERVIEW_PLAN_KEY_PREFIX = 'interview-strategy:plan:v1';
const INTERVIEW_CALENDAR_SYNC_MAP_KEY_PREFIX = 'interview-strategy:calendar-sync:v1';
const INTERVIEW_CALENDAR_PERMISSION_CACHE_KEY_PREFIX = 'interview-strategy:calendar-permission:v1';
const INTERVIEW_SELECTED_CALENDAR_ID_KEY_PREFIX = 'interview-strategy:selected-calendar-id:v1';

function preferencesKeyForUser(userId: string) {
  return `${INTERVIEW_PREFERENCES_KEY_PREFIX}:${userId}`;
}

function planKeyForUser(userId: string) {
  return `${INTERVIEW_PLAN_KEY_PREFIX}:${userId}`;
}

function syncMapKeyForUser(userId: string) {
  return `${INTERVIEW_CALENDAR_SYNC_MAP_KEY_PREFIX}:${userId}`;
}

function permissionKeyForUser(userId: string) {
  return `${INTERVIEW_CALENDAR_PERMISSION_CACHE_KEY_PREFIX}:${userId}`;
}

function selectedCalendarIdKeyForUser(userId: string) {
  return `${INTERVIEW_SELECTED_CALENDAR_ID_KEY_PREFIX}:${userId}`;
}

function parseSyncMap(raw: string | null): InterviewStrategyCalendarSyncMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const map: InterviewStrategyCalendarSyncMap = {};
    for (const [slotId, eventId] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof slotId !== 'string' || slotId.trim().length === 0) continue;
      if (typeof eventId !== 'string' || eventId.trim().length === 0) continue;
      map[slotId] = eventId;
    }
    return map;
  } catch {
    return {};
  }
}

function parsePermissionCache(raw: string | null): InterviewStrategyCalendarPermissionCache | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const candidate = parsed as Partial<InterviewStrategyCalendarPermissionCache>;
    if (candidate.status !== 'granted' && candidate.status !== 'denied' && candidate.status !== 'undetermined') {
      return null;
    }
    if (typeof candidate.canAskAgain !== 'boolean') return null;
    if (typeof candidate.updatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.updatedAt))) return null;
    return {
      status: candidate.status,
      canAskAgain: candidate.canAskAgain,
      updatedAt: candidate.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function saveInterviewStrategyCalendarSyncMapForUser(userId: string, map: InterviewStrategyCalendarSyncMap) {
  await AsyncStorage.setItem(syncMapKeyForUser(userId), JSON.stringify(map));
}

export async function loadInterviewStrategyCalendarSyncMapForUser(userId: string): Promise<InterviewStrategyCalendarSyncMap> {
  const raw = await AsyncStorage.getItem(syncMapKeyForUser(userId));
  return parseSyncMap(raw);
}

export async function saveInterviewStrategyCalendarPermissionCacheForUser(
  userId: string,
  cache: InterviewStrategyCalendarPermissionCache
) {
  await AsyncStorage.setItem(permissionKeyForUser(userId), JSON.stringify(cache));
}

export async function loadInterviewStrategyCalendarPermissionCacheForUser(
  userId: string
): Promise<InterviewStrategyCalendarPermissionCache | null> {
  const raw = await AsyncStorage.getItem(permissionKeyForUser(userId));
  return parsePermissionCache(raw);
}

export async function saveInterviewStrategySelectedCalendarIdForUser(userId: string, calendarId: string | null) {
  const key = selectedCalendarIdKeyForUser(userId);
  if (!calendarId || calendarId.trim().length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, calendarId.trim());
}

export async function loadInterviewStrategySelectedCalendarIdForUser(userId: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(selectedCalendarIdKeyForUser(userId));
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function clearInterviewStrategyStateForUser(userId: string) {
  await Promise.all([
    AsyncStorage.removeItem(preferencesKeyForUser(userId)),
    AsyncStorage.removeItem(planKeyForUser(userId)),
    AsyncStorage.removeItem(syncMapKeyForUser(userId)),
    AsyncStorage.removeItem(permissionKeyForUser(userId)),
    AsyncStorage.removeItem(selectedCalendarIdKeyForUser(userId)),
  ]);
}
