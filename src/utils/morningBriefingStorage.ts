import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MorningBriefingResponse } from '../services/astrologyApiCore';
import {
  DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
  isMorningBriefingWidgetVariantId,
  type MorningBriefingWidgetVariantId,
} from '../services/morningBriefingWidgetVariants';

const BRIEFING_KEY_PREFIX = 'morning-briefing:v1';
const SETUP_STATE_KEY_PREFIX = 'morning-briefing-setup:v1';
const WIDGET_VARIANT_KEY_PREFIX = 'morning-briefing-widget-variant:v1';

export type MorningBriefingSetupState =
  | 'not_eligible'
  | 'eligible_not_prompted'
  | 'prompt_dismissed'
  | 'pin_requested'
  | 'enabled'
  | 'failed';

function cacheKeyForUser(userId: string) {
  return `${BRIEFING_KEY_PREFIX}:${userId}`;
}

function setupStateKeyForUser(userId: string) {
  return `${SETUP_STATE_KEY_PREFIX}:${userId}`;
}

function widgetVariantKeyForUser(userId: string) {
  return `${WIDGET_VARIANT_KEY_PREFIX}:${userId}`;
}

export async function saveMorningBriefingForUser(userId: string, payload: MorningBriefingResponse) {
  await AsyncStorage.setItem(cacheKeyForUser(userId), JSON.stringify(payload));
}

export async function loadMorningBriefingForUser(userId: string): Promise<MorningBriefingResponse | null> {
  const raw = await AsyncStorage.getItem(cacheKeyForUser(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MorningBriefingResponse;
  } catch {
    return null;
  }
}

export async function clearMorningBriefingForUser(userId: string) {
  await AsyncStorage.removeItem(cacheKeyForUser(userId));
}

export async function saveMorningBriefingSetupStateForUser(userId: string, state: MorningBriefingSetupState) {
  await AsyncStorage.setItem(setupStateKeyForUser(userId), state);
}

export async function loadMorningBriefingSetupStateForUser(userId: string): Promise<MorningBriefingSetupState | null> {
  const raw = await AsyncStorage.getItem(setupStateKeyForUser(userId));
  if (raw === 'not_eligible' || raw === 'eligible_not_prompted' || raw === 'prompt_dismissed' || raw === 'pin_requested' || raw === 'enabled' || raw === 'failed') {
    return raw;
  }
  return null;
}

export async function clearMorningBriefingSetupStateForUser(userId: string) {
  await AsyncStorage.removeItem(setupStateKeyForUser(userId));
}

export async function saveMorningBriefingWidgetVariantForUser(userId: string, variantId: MorningBriefingWidgetVariantId) {
  await AsyncStorage.setItem(widgetVariantKeyForUser(userId), variantId);
}

export async function loadMorningBriefingWidgetVariantForUser(userId: string): Promise<MorningBriefingWidgetVariantId> {
  const raw = await AsyncStorage.getItem(widgetVariantKeyForUser(userId));
  if (isMorningBriefingWidgetVariantId(raw)) return raw;
  return DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT;
}

export async function clearMorningBriefingWidgetVariantForUser(userId: string) {
  await AsyncStorage.removeItem(widgetVariantKeyForUser(userId));
}
