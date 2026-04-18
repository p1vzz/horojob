import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { createRevenueCatService } from './revenueCatCore';
import { APP_ENVIRONMENT } from '../config/appEnvironment';

export * from './revenueCatCore';

const revenueCatService = createRevenueCatService<LOG_LEVEL, PurchasesOffering, PurchasesPackage, CustomerInfo>({
  platformOs: Platform.OS,
  getEnv: (name) => process.env[name],
  appEnvironment: APP_ENVIRONMENT,
  logLevels: {
    DEBUG: LOG_LEVEL.DEBUG,
    INFO: LOG_LEVEL.INFO,
    WARN: LOG_LEVEL.WARN,
    ERROR: LOG_LEVEL.ERROR,
  },
  purchases: {
    setLogLevel: (level) => Purchases.setLogLevel(level),
    isConfigured: () => Purchases.isConfigured(),
    configure: (input) => Purchases.configure(input),
    logIn: (userId) => Purchases.logIn(userId),
    setAttributes: (attributes) => Purchases.setAttributes(attributes),
    getOfferings: () => Purchases.getOfferings(),
    purchasePackage: (pkg) => Purchases.purchasePackage(pkg),
    restorePurchases: () => Purchases.restorePurchases(),
  },
});

export const isRevenueCatConfigured = revenueCatService.isRevenueCatConfigured;
export const configureRevenueCatForUser = revenueCatService.configureRevenueCatForUser;
export const getMainRevenueCatOffering =
  revenueCatService.getMainRevenueCatOffering as () => Promise<PurchasesOffering | null>;
export const purchaseRevenueCatPackage =
  revenueCatService.purchaseRevenueCatPackage as (pkg: PurchasesPackage) => Promise<CustomerInfo>;
export const restoreRevenueCatPurchases = revenueCatService.restoreRevenueCatPurchases;
export const hasPremiumRevenueCatEntitlement =
  revenueCatService.hasPremiumRevenueCatEntitlement as (customerInfo: CustomerInfo) => boolean;
