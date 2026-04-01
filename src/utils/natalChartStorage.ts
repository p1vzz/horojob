import AsyncStorage from '@react-native-async-storage/async-storage';

const NATAL_CHART_KEY_BY_USER = 'natal-chart:v2-by-user';
const LEGACY_NATAL_CHART_KEY = 'natal-chart:v1';

export type NatalChartCache = {
  payload: unknown;
  savedAt: string;
};

type NatalChartCacheByUser = Record<string, NatalChartCache>;

function parseByUser(raw: string | null): NatalChartCacheByUser {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const normalized: NatalChartCacheByUser = {};
    for (const [userId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!userId || !value || typeof value !== 'object') continue;
      const candidate = value as Partial<NatalChartCache>;
      if (typeof candidate.savedAt !== 'string') continue;
      normalized[userId] = {
        payload: candidate.payload,
        savedAt: candidate.savedAt,
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

export async function saveNatalChartCacheForUser(userId: string, payload: unknown) {
  const value: NatalChartCache = {
    payload,
    savedAt: new Date().toISOString(),
  };
  const raw = await AsyncStorage.getItem(NATAL_CHART_KEY_BY_USER);
  const byUser = parseByUser(raw);
  byUser[userId] = value;
  await AsyncStorage.setItem(NATAL_CHART_KEY_BY_USER, JSON.stringify(byUser));
}

export async function loadNatalChartCacheForUser(userId: string): Promise<NatalChartCache | null> {
  const raw = await AsyncStorage.getItem(NATAL_CHART_KEY_BY_USER);
  const byUser = parseByUser(raw);
  return byUser[userId] ?? null;
}

export async function clearNatalChartCacheForUser(userId: string) {
  const raw = await AsyncStorage.getItem(NATAL_CHART_KEY_BY_USER);
  const byUser = parseByUser(raw);
  if (!byUser[userId]) return;
  delete byUser[userId];
  if (Object.keys(byUser).length === 0) {
    await AsyncStorage.removeItem(NATAL_CHART_KEY_BY_USER);
    return;
  }
  await AsyncStorage.setItem(NATAL_CHART_KEY_BY_USER, JSON.stringify(byUser));
}

export async function clearNatalChartCache() {
  await Promise.all([
    AsyncStorage.removeItem(NATAL_CHART_KEY_BY_USER),
    AsyncStorage.removeItem(LEGACY_NATAL_CHART_KEY),
  ]);
}
