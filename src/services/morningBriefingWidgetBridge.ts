import { NativeModules, Platform } from 'react-native';
import type { MorningBriefingResponse } from './astrologyApiCore';
import { DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT } from './morningBriefingWidgetVariants';
import {
  createMorningBriefingWidgetBridge,
  type MorningBriefingWidgetNativeModule,
} from './morningBriefingWidgetBridgeCore';

export * from './morningBriefingWidgetBridgeCore';

const morningBriefingWidgetBridge = createMorningBriefingWidgetBridge({
  platformOs: Platform.OS,
  defaultVariantId: DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT,
  getNativeModule: () => {
    return NativeModules.MorningBriefingWidgetModule as MorningBriefingWidgetNativeModule | undefined;
  },
});

export const syncMorningBriefingWidget = (payload: MorningBriefingResponse) => {
  return morningBriefingWidgetBridge.syncMorningBriefingWidget(payload);
};

export const setMorningBriefingWidgetLocked = morningBriefingWidgetBridge.setMorningBriefingWidgetLocked;
export const setMorningBriefingWidgetProfileMissing = morningBriefingWidgetBridge.setMorningBriefingWidgetProfileMissing;
export const clearMorningBriefingWidget = morningBriefingWidgetBridge.clearMorningBriefingWidget;
export const requestPinMorningBriefingWidget = morningBriefingWidgetBridge.requestPinMorningBriefingWidget;
export const hasMorningBriefingWidgetInstance = morningBriefingWidgetBridge.hasMorningBriefingWidgetInstance;
