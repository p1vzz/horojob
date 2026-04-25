import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CareerVibePlanResponse } from '../services/astrologyApiCore';

const CAREER_VIBE_PLAN_KEY_PREFIX = 'career-vibe-plan:v1';

function cacheKeyForUser(userId: string) {
  return `${CAREER_VIBE_PLAN_KEY_PREFIX}:${userId}`;
}

export async function saveCareerVibePlanForUser(userId: string, payload: CareerVibePlanResponse) {
  await AsyncStorage.setItem(cacheKeyForUser(userId), JSON.stringify(payload));
}

export async function loadCareerVibePlanForUser(userId: string): Promise<CareerVibePlanResponse | null> {
  const raw = await AsyncStorage.getItem(cacheKeyForUser(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CareerVibePlanResponse;
  } catch {
    return null;
  }
}

export async function clearCareerVibePlanForUser(userId: string) {
  await AsyncStorage.removeItem(cacheKeyForUser(userId));
}
