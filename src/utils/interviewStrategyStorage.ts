import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  InterviewStrategyCalendarPermissionCache,
  InterviewStrategyCalendarSyncMap,
  InterviewStrategyPlan,
  InterviewStrategyPreferences,
  InterviewStrategyScoreBreakdown,
  InterviewStrategySlot,
} from '../types/interviewStrategy';
import { normalizeInterviewStrategyPreferences } from '../services/interviewStrategy';

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

function parseInterviewPlan(raw: string | null): InterviewStrategyPlan | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const candidate = parsed as Partial<InterviewStrategyPlan>;
    if (candidate.algorithmVersion !== 'interview-strategy-v1') return null;
    if (typeof candidate.strategyId !== 'string' || candidate.strategyId.trim().length === 0) return null;
    if (candidate.generatedAt !== null && (typeof candidate.generatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.generatedAt)))) {
      return null;
    }
    if (typeof candidate.timezoneIana !== 'string' || candidate.timezoneIana.trim().length === 0) return null;
    if (typeof candidate.horizonDays !== 'number' || !Number.isFinite(candidate.horizonDays)) return null;
    if (!Array.isArray(candidate.slots) || !Array.isArray(candidate.weeks)) return null;

    const preferences =
      candidate.preferences && typeof candidate.preferences === 'object'
        ? normalizeInterviewStrategyPreferences(candidate.preferences)
        : undefined;
    let baselineScores: InterviewStrategyPlan['baselineScores'] | undefined;
    if (candidate.baselineScores && typeof candidate.baselineScores === 'object') {
      const rawBaseline = candidate.baselineScores as {
        dailyCareerScore?: unknown;
        aiSynergyScore?: unknown;
      };
      const dailyCareerScore = Number(rawBaseline.dailyCareerScore);
      const aiSynergyScore = Number(rawBaseline.aiSynergyScore);
      if (Number.isFinite(dailyCareerScore) && Number.isFinite(aiSynergyScore)) {
        baselineScores = {
          dailyCareerScore: Math.trunc(dailyCareerScore),
          aiSynergyScore: Math.trunc(aiSynergyScore),
        };
      }
    }
    const slots = candidate.slots
      .map((rawSlot) => {
        if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) return null;
        const slot = rawSlot as InterviewStrategyPlan['slots'][number];
        if (typeof slot.id !== 'string' || slot.id.trim().length === 0) return null;
        if (typeof slot.weekKey !== 'string' || slot.weekKey.trim().length === 0) return null;
        if (typeof slot.startAt !== 'string' || !Number.isFinite(Date.parse(slot.startAt))) return null;
        if (typeof slot.endAt !== 'string' || !Number.isFinite(Date.parse(slot.endAt))) return null;
        if (typeof slot.timezoneIana !== 'string' || slot.timezoneIana.trim().length === 0) return null;
        if (typeof slot.score !== 'number' || !Number.isFinite(slot.score)) return null;
        if (typeof slot.explanation !== 'string') return null;
        if (!slot.breakdown || typeof slot.breakdown !== 'object') return null;

        const breakdown = slot.breakdown as InterviewStrategyPlan['slots'][number]['breakdown'];
        if (
          !Number.isFinite(breakdown.dailyCareerScore) ||
          !Number.isFinite(breakdown.aiSynergyScore) ||
          !Number.isFinite(breakdown.weekdayWeight) ||
          !Number.isFinite(breakdown.hourWeight) ||
          !Number.isFinite(breakdown.conflictPenalty)
        ) {
          return null;
        }

        const normalizedBreakdown: InterviewStrategyScoreBreakdown = {
          dailyCareerScore: Math.trunc(breakdown.dailyCareerScore),
          aiSynergyScore: Math.trunc(breakdown.aiSynergyScore),
          weekdayWeight: Math.trunc(breakdown.weekdayWeight),
          hourWeight: Math.trunc(breakdown.hourWeight),
          conflictPenalty: Math.trunc(breakdown.conflictPenalty),
        };
        const natalCommunicationScore = optionalScore(breakdown.natalCommunicationScore);
        const transitNatalScore = optionalScore(breakdown.transitNatalScore);
        const careerHouseScore = optionalScore(breakdown.careerHouseScore);
        const rangeQualityScore = optionalScore(breakdown.rangeQualityScore);
        if (natalCommunicationScore !== undefined) normalizedBreakdown.natalCommunicationScore = natalCommunicationScore;
        if (transitNatalScore !== undefined) normalizedBreakdown.transitNatalScore = transitNatalScore;
        if (careerHouseScore !== undefined) normalizedBreakdown.careerHouseScore = careerHouseScore;
        if (rangeQualityScore !== undefined) normalizedBreakdown.rangeQualityScore = rangeQualityScore;

        const normalizedSlot: InterviewStrategySlot = {
          id: slot.id,
          weekKey: slot.weekKey,
          startAt: slot.startAt,
          endAt: slot.endAt,
          timezoneIana: slot.timezoneIana,
          score: Math.trunc(slot.score),
          explanation: slot.explanation,
          breakdown: normalizedBreakdown,
        };
        if (slot.explanationSource === 'deterministic' || slot.explanationSource === 'llm') {
          normalizedSlot.explanationSource = slot.explanationSource;
        }
        if (typeof slot.calendarNote === 'string') normalizedSlot.calendarNote = slot.calendarNote;
        return normalizedSlot;
      })
      .filter((slot): slot is InterviewStrategyPlan['slots'][number] => slot !== null);

    const weeks = candidate.weeks
      .map((rawWeek) => {
        if (!rawWeek || typeof rawWeek !== 'object' || Array.isArray(rawWeek)) return null;
        const week = rawWeek as InterviewStrategyPlan['weeks'][number];
        if (typeof week.weekKey !== 'string' || week.weekKey.trim().length === 0) return null;
        if (typeof week.weekStartAt !== 'string' || !Number.isFinite(Date.parse(week.weekStartAt))) return null;
        if (!Array.isArray(week.slots)) return null;

        const weekSlotIds = new Set(week.slots.map((slot) => (slot && typeof slot === 'object' ? slot.id : null)));
        const normalizedSlots = slots.filter((slot) => weekSlotIds.has(slot.id));
        return {
          weekKey: week.weekKey,
          weekStartAt: week.weekStartAt,
          slots: normalizedSlots,
        };
      })
      .filter((week): week is InterviewStrategyPlan['weeks'][number] => week !== null);

    return {
      strategyId: candidate.strategyId,
      algorithmVersion: 'interview-strategy-v1',
      generatedAt: candidate.generatedAt ?? null,
      horizonDays: Math.trunc(candidate.horizonDays),
      timezoneIana: candidate.timezoneIana,
      preferences,
      baselineScores,
      slots,
      weeks,
    };
  } catch {
    return null;
  }
}

function optionalScore(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
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

export async function saveInterviewStrategyPreferencesForUser(userId: string, preferences: InterviewStrategyPreferences) {
  const normalized = normalizeInterviewStrategyPreferences(preferences);
  await AsyncStorage.setItem(preferencesKeyForUser(userId), JSON.stringify(normalized));
}

export async function loadInterviewStrategyPreferencesForUser(userId: string): Promise<InterviewStrategyPreferences | null> {
  const raw = await AsyncStorage.getItem(preferencesKeyForUser(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return normalizeInterviewStrategyPreferences(parsed as Partial<InterviewStrategyPreferences>);
  } catch {
    return null;
  }
}

export async function saveInterviewStrategyPlanForUser(userId: string, plan: InterviewStrategyPlan) {
  await AsyncStorage.setItem(planKeyForUser(userId), JSON.stringify(plan));
}

export async function loadInterviewStrategyPlanForUser(userId: string): Promise<InterviewStrategyPlan | null> {
  const raw = await AsyncStorage.getItem(planKeyForUser(userId));
  return parseInterviewPlan(raw);
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
