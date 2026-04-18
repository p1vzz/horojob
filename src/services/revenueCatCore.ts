export type RevenueCatPlatformOs = 'ios' | 'android' | string;

export type RevenueCatLogLevels<TLogLevel> = {
  DEBUG: TLogLevel;
  INFO: TLogLevel;
  WARN: TLogLevel;
  ERROR: TLogLevel;
};

export type RevenueCatOfferings<TOffering> = {
  all?: Record<string, TOffering | undefined> | null;
  current?: TOffering | null;
};

export type RevenueCatPurchaseResult<TCustomerInfo> = {
  customerInfo: TCustomerInfo;
};

export type RevenueCatPurchasesDeps<TLogLevel, TOffering, TPackage, TCustomerInfo> = {
  setLogLevel: (level: TLogLevel) => void;
  isConfigured: () => Promise<boolean>;
  configure: (input: { apiKey: string; appUserID: string }) => void;
  logIn: (userId: string) => Promise<unknown>;
  setAttributes: (attributes: Record<string, string>) => Promise<unknown>;
  getOfferings: () => Promise<RevenueCatOfferings<TOffering>>;
  purchasePackage: (pkg: TPackage) => Promise<RevenueCatPurchaseResult<TCustomerInfo>>;
  restorePurchases: () => Promise<unknown>;
};

export type RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo> = {
  platformOs: RevenueCatPlatformOs;
  getEnv: (name: string) => string | undefined;
  appEnvironment?: string;
  logLevels: RevenueCatLogLevels<TLogLevel>;
  purchases: RevenueCatPurchasesDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>;
};

function normalizeEnv(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function resolveLogLevel<TLogLevel, TOffering, TPackage, TCustomerInfo>(
  deps: RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>
) {
  const value = normalizeEnv(deps.getEnv('EXPO_PUBLIC_RC_LOG_LEVEL'))?.toUpperCase() ?? 'INFO';
  if (value === 'DEBUG') return deps.logLevels.DEBUG;
  if (value === 'WARN') return deps.logLevels.WARN;
  if (value === 'ERROR') return deps.logLevels.ERROR;
  return deps.logLevels.INFO;
}

function resolveOfferingId<TLogLevel, TOffering, TPackage, TCustomerInfo>(
  deps: RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>
) {
  return normalizeEnv(deps.getEnv('EXPO_PUBLIC_RC_OFFERING_MAIN')) ?? 'default';
}

function resolveEntitlementId<TLogLevel, TOffering, TPackage, TCustomerInfo>(
  deps: RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>
) {
  return normalizeEnv(deps.getEnv('EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM')) ?? 'premium';
}

function getPlatformApiKey<TLogLevel, TOffering, TPackage, TCustomerInfo>(
  deps: RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>
) {
  if (deps.platformOs === 'ios') {
    return normalizeEnv(deps.getEnv('EXPO_PUBLIC_RC_IOS_API_KEY'));
  }
  if (deps.platformOs === 'android') {
    return normalizeEnv(deps.getEnv('EXPO_PUBLIC_RC_ANDROID_API_KEY'));
  }
  return null;
}

export function createRevenueCatService<TLogLevel, TOffering, TPackage, TCustomerInfo>(
  deps: RevenueCatCoreDeps<TLogLevel, TOffering, TPackage, TCustomerInfo>
) {
  let configuredUserId: string | null = null;

  const isRevenueCatConfigured = () => {
    return Boolean(getPlatformApiKey(deps));
  };

  const configureRevenueCatForUser = async (userId: string) => {
    const apiKey = getPlatformApiKey(deps);
    if (!apiKey || !userId) {
      return false;
    }

    deps.purchases.setLogLevel(resolveLogLevel(deps));
    const configured = await deps.purchases.isConfigured().catch(() => false);

    if (!configured) {
      deps.purchases.configure({ apiKey, appUserID: userId });
      configuredUserId = userId;
    } else if (configuredUserId !== userId) {
      await deps.purchases.logIn(userId);
      configuredUserId = userId;
    }

    await deps.purchases.setAttributes({
      backend_user_id: userId,
      app_env: deps.appEnvironment ?? 'unknown',
    });

    return true;
  };

  const getMainRevenueCatOffering = async (): Promise<TOffering | null> => {
    const offerings = await deps.purchases.getOfferings();
    const offeringId = resolveOfferingId(deps);
    const fromAll = offerings.all?.[offeringId];
    return fromAll ?? offerings.current ?? null;
  };

  const purchaseRevenueCatPackage = async (pkg: TPackage) => {
    const result = await deps.purchases.purchasePackage(pkg);
    return result.customerInfo;
  };

  const restoreRevenueCatPurchases = async () => {
    return deps.purchases.restorePurchases();
  };

  const hasPremiumRevenueCatEntitlement = (customerInfo: { entitlements?: { active?: Record<string, unknown> } }) => {
    const entitlementId = resolveEntitlementId(deps);
    return Boolean(customerInfo.entitlements?.active?.[entitlementId]);
  };

  return {
    isRevenueCatConfigured,
    configureRevenueCatForUser,
    getMainRevenueCatOffering,
    purchaseRevenueCatPackage,
    restoreRevenueCatPurchases,
    hasPremiumRevenueCatEntitlement,
  };
}
