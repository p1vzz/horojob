import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY_BY_USER = 'onboarding:v2-by-user';

export type OnboardingData = {
  name: string;
  birthDate: string;
  birthTime: string | null;
  unknownTime: boolean;
  city: string;
  currentJobTitle?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  admin1?: string | null;
};

type OnboardingByUser = Record<string, OnboardingData>;

function parseByUser(raw: string | null): OnboardingByUser {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const normalized: OnboardingByUser = {};
    for (const [userId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!userId || !value || typeof value !== 'object') continue;
      const candidate = value as Partial<OnboardingData>;
      if (
        typeof candidate.birthDate !== 'string' ||
        typeof candidate.city !== 'string' ||
        typeof candidate.unknownTime !== 'boolean'
      ) {
        continue;
      }
      normalized[userId] = {
        name: typeof candidate.name === 'string' ? candidate.name.trim() : '',
        birthDate: candidate.birthDate,
        birthTime: typeof candidate.birthTime === 'string' || candidate.birthTime === null ? candidate.birthTime : null,
        unknownTime: candidate.unknownTime,
        city: candidate.city,
        currentJobTitle:
          typeof candidate.currentJobTitle === 'string'
            ? candidate.currentJobTitle.trim() || null
            : candidate.currentJobTitle === null
              ? null
              : null,
        latitude: typeof candidate.latitude === 'number' ? candidate.latitude : null,
        longitude: typeof candidate.longitude === 'number' ? candidate.longitude : null,
        country: typeof candidate.country === 'string' ? candidate.country : null,
        admin1: typeof candidate.admin1 === 'string' ? candidate.admin1 : null,
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

export async function saveOnboardingForUser(userId: string, data: OnboardingData) {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY_BY_USER);
  const byUser = parseByUser(raw);
  byUser[userId] = data;
  await AsyncStorage.setItem(ONBOARDING_KEY_BY_USER, JSON.stringify(byUser));
}

export async function loadOnboardingForUser(userId: string): Promise<OnboardingData | null> {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY_BY_USER);
  const byUser = parseByUser(raw);
  return byUser[userId] ?? null;
}

export async function clearOnboardingForUser(userId: string) {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY_BY_USER);
  const byUser = parseByUser(raw);
  if (!byUser[userId]) return;
  delete byUser[userId];
  if (Object.keys(byUser).length === 0) {
    await AsyncStorage.removeItem(ONBOARDING_KEY_BY_USER);
    return;
  }
  await AsyncStorage.setItem(ONBOARDING_KEY_BY_USER, JSON.stringify(byUser));
}
