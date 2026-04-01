import type { MorningBriefingWidgetVariantId } from './morningBriefingWidgetVariants';

export type MorningBriefingWidgetNativeModule = {
  syncMorningBriefing: (payloadJson: string) => Promise<boolean>;
  markLocked: () => Promise<boolean>;
  markProfileMissing: () => Promise<boolean>;
  clearWidget: () => Promise<boolean>;
  requestPinWidget: () => Promise<boolean>;
  requestPinWidgetVariant?: (variantId: string) => Promise<boolean>;
  hasWidgetInstance: () => Promise<boolean>;
  hasWidgetInstanceForVariant?: (variantId: string) => Promise<boolean>;
};

export type MorningBriefingWidgetBridgeDeps = {
  platformOs: string;
  defaultVariantId: MorningBriefingWidgetVariantId;
  getNativeModule: () => MorningBriefingWidgetNativeModule | null | undefined;
};

export function createMorningBriefingWidgetBridge(deps: MorningBriefingWidgetBridgeDeps) {
  const resolveNativeModule = () => {
    if (deps.platformOs !== 'android') return null;
    const module = deps.getNativeModule();
    if (!module) return null;
    return module;
  };

  const syncMorningBriefingWidget = async (payload: unknown) => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      return Boolean(await module.syncMorningBriefing(JSON.stringify(payload)));
    } catch {
      return false;
    }
  };

  const setMorningBriefingWidgetLocked = async () => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      return Boolean(await module.markLocked());
    } catch {
      return false;
    }
  };

  const setMorningBriefingWidgetProfileMissing = async () => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      return Boolean(await module.markProfileMissing());
    } catch {
      return false;
    }
  };

  const clearMorningBriefingWidget = async () => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      return Boolean(await module.clearWidget());
    } catch {
      return false;
    }
  };

  const requestPinMorningBriefingWidget = async (variantId: MorningBriefingWidgetVariantId = deps.defaultVariantId) => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      if (module.requestPinWidgetVariant) {
        return Boolean(await module.requestPinWidgetVariant(variantId));
      }
      return Boolean(await module.requestPinWidget());
    } catch {
      return false;
    }
  };

  const hasMorningBriefingWidgetInstance = async (variantId?: MorningBriefingWidgetVariantId) => {
    const module = resolveNativeModule();
    if (!module) return false;
    try {
      if (variantId && module.hasWidgetInstanceForVariant) {
        return Boolean(await module.hasWidgetInstanceForVariant(variantId));
      }
      return Boolean(await module.hasWidgetInstance());
    } catch {
      return false;
    }
  };

  return {
    syncMorningBriefingWidget,
    setMorningBriefingWidgetLocked,
    setMorningBriefingWidgetProfileMissing,
    clearMorningBriefingWidget,
    requestPinMorningBriefingWidget,
    hasMorningBriefingWidgetInstance,
  };
}
