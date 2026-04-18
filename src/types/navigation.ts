import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { JobAnalyzeSuccessResponse } from '../services/jobsApi';
import type { JobScanHistoryEntry } from '../utils/jobScanHistoryStorage';

export type ScannerImportedMeta = {
  source: string;
  cached: boolean;
  provider: string | null;
};

export type DashboardAlertFocus = 'burnout' | 'lunar';

export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard:
    | {
        alertFocus?: DashboardAlertFocus;
        alertFocusKey?: number;
        openedFromPush?: boolean;
        notificationType?: string | null;
      }
    | undefined;
  Scanner:
    | {
        importedAnalysis?: JobAnalyzeSuccessResponse;
        importedMeta?: ScannerImportedMeta;
        importedUrl?: string;
        initialUrl?: string;
        autoStart?: boolean;
        historyEntry?: JobScanHistoryEntry;
      }
    | undefined;
  ScannerHistory: undefined;
  Profile: undefined;
  PremiumPurchase: undefined;
  NatalChart: undefined;
  CareerVibePlan: undefined;
  FullNatalCareerAnalysis: undefined;
  DiscoverRoles: undefined;
  Settings:
    | {
        openWidgetSetup?: boolean;
        widgetSetupKey?: number;
      }
    | undefined;
  JobScreenshotUpload:
    | {
        failedUrl?: string;
        failedCode?: string;
      }
    | undefined;
};

export type AppNavigationProp<RouteName extends keyof RootStackParamList = keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, RouteName>;

export type AppRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<RootStackParamList, RouteName>;

export type AppScreenProps<RouteName extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  RouteName
>;
