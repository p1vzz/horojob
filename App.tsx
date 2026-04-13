import 'react-native-gesture-handler';
import "./global.css";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DarkTheme as NavigationDarkTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import {
  clearOnboardingForUser,
  loadOnboardingForUser,
  saveOnboardingForUser,
} from './src/utils/onboardingStorage';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { PremiumPurchaseScreen } from './src/screens/PremiumPurchaseScreen';
import { NatalChartScreen } from './src/screens/NatalChartScreen';
import { DiscoverRolesScreen } from './src/screens/DiscoverRolesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { JobScreenshotUploadScreen } from './src/screens/JobScreenshotUploadScreen';
import { FullNatalCareerAnalysisScreen } from './src/screens/FullNatalCareerAnalysisScreen';
import { BrandStartupLoader, BRAND_STARTUP_BACKGROUND } from './src/components/loaders/BrandStartupLoader';
import { ensureAuthSession, updateCurrentSessionUser } from './src/services/authSession';
import { fetchBirthProfile } from './src/services/astrologyApi';
import { clearNatalChartCacheForUser } from './src/utils/natalChartStorage';
import type { RootStackParamList } from './src/types/navigation';
import { syncMorningBriefingCache } from './src/services/morningBriefingSync';
import { configureRevenueCatForUser, isRevenueCatConfigured } from './src/services/revenueCat';
import { syncRevenueCatSubscription } from './src/services/billingApi';
import { registerPushTokenForUser } from './src/services/pushNotifications';
import { trackAnalyticsEvent } from './src/services/analytics';
import * as Notifications from 'expo-notifications';
import { ThemeModeProvider, useThemeMode } from './src/theme/ThemeModeProvider';
import { BrightnessAdaptationProvider } from './src/contexts/BrightnessAdaptationContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import {
  buildDashboardAlertPushAnalyticsProperties,
  DASHBOARD_ALERT_OPENED_FROM_PUSH_EVENT,
  normalizeDashboardAlertNotificationType,
  resolveDashboardAlertFocus,
} from './src/screens/dashboardAlertEntryCore';
import {
  resolveInitialRouteName,
  shouldForceOnboardingEntry,
  shouldForceStartupLoader,
  shouldShowStartupLoaderGate,
} from './src/appStartupCore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const STARTUP_LOADER_MIN_DURATION_MS = 3000;
type DashboardOpenParams = NonNullable<RootStackParamList['Dashboard']>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppShell() {
  const [isReady, setIsReady] = useState(false);
  const [hasMetStartupLoaderMinimum, setHasMetStartupLoaderMinimum] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const pendingDashboardOpenRef = useRef<DashboardOpenParams | null>(null);
  const alertFocusKeyRef = useRef(0);
  const { theme, isReady: isThemeReady } = useThemeMode();
  const forceOnboardingEntry = shouldForceOnboardingEntry(process.env.EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY, __DEV__);
  const forceStartupLoader = shouldForceStartupLoader(process.env.EXPO_PUBLIC_FORCE_STARTUP_LOADER, __DEV__);
  const initialRouteName = resolveInitialRouteName({
    hasOnboarded,
    forceOnboardingEntry,
  });
  const isAppReady = isReady && isThemeReady;
  const shouldShowStartupLoader = shouldShowStartupLoaderGate({
    forceStartupLoader,
    hasMetStartupLoaderMinimum,
    isAppReady,
  });
  const effectiveBackgroundColor = shouldShowStartupLoader ? BRAND_STARTUP_BACKGROUND : theme.colors.background;
  const navigationTheme = useMemo(
    () => ({
      ...NavigationDarkTheme,
      colors: {
        ...NavigationDarkTheme.colors,
        background: effectiveBackgroundColor,
        card: effectiveBackgroundColor,
        border: 'transparent',
      },
    }),
    [effectiveBackgroundColor]
  );

  useEffect(() => {
    const timerId = setTimeout(() => {
      setHasMetStartupLoaderMinimum(true);
    }, STARTUP_LOADER_MIN_DURATION_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    const openDashboard = (params: DashboardOpenParams) => {
      pendingDashboardOpenRef.current = params;
      if (navigationRef.isReady()) {
        navigationRef.navigate('Dashboard', params);
        pendingDashboardOpenRef.current = null;
      }
    };

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      const notificationType = normalizeDashboardAlertNotificationType(data?.type);
      const alertFocus = resolveDashboardAlertFocus(notificationType);
      if (alertFocus) {
        alertFocusKeyRef.current += 1;
        trackAnalyticsEvent(
          DASHBOARD_ALERT_OPENED_FROM_PUSH_EVENT,
          buildDashboardAlertPushAnalyticsProperties({
            focus: alertFocus,
            alertFocusKey: alertFocusKeyRef.current,
            notificationType,
            outcome: 'opened',
          })
        );
        openDashboard({
          alertFocus,
          alertFocusKey: alertFocusKeyRef.current,
          openedFromPush: true,
          notificationType,
        });
        void Notifications.clearLastNotificationResponseAsync().catch(() => {
          // Ignore cleanup errors.
        });
      }
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response);
    });

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        handleResponse(response);
      })
      .catch(() => {
        // Ignore stale response retrieval issues.
      });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (forceStartupLoader) {
      return;
    }

    let mounted = true;
    const run = async () => {
      let localProfile = null;
      let userId: string | null = null;

      try {
        const session = await ensureAuthSession();
        userId = session.user.id;
        localProfile = await loadOnboardingForUser(session.user.id);
        if (isRevenueCatConfigured()) {
          await configureRevenueCatForUser(session.user.id);
        }
      } catch {
        // If auth bootstrap fails, onboarding must be completed again.
      }

      if (userId) {
        try {
          const remote = await fetchBirthProfile();
          if (remote?.profile) {
            localProfile = {
              name: remote.profile.name ?? '',
              birthDate: remote.profile.birthDate,
              birthTime: remote.profile.birthTime,
              unknownTime: remote.profile.unknownTime,
              city: remote.profile.city,
              latitude: remote.profile.latitude ?? null,
              longitude: remote.profile.longitude ?? null,
              country: remote.profile.country ?? null,
              admin1: remote.profile.admin1 ?? null,
            };
            await saveOnboardingForUser(userId, localProfile);
          } else {
            // Server explicitly reports that current session has no birth profile.
            // Clear local session-bound cache so onboarding is not skipped.
            localProfile = null;
            await Promise.all([clearOnboardingForUser(userId), clearNatalChartCacheForUser(userId)]);
          }
        } catch {
          // Ignore remote profile errors and keep per-user local fallback.
        }
      }

      if (mounted) {
        setHasOnboarded(Boolean(localProfile));
        setIsReady(true);
      }

      if (userId) {
        void (async () => {
          await registerPushTokenForUser(userId).catch(() => {
            // Push token registration should never block app startup.
          });

          if (isRevenueCatConfigured()) {
            try {
              const synced = await syncRevenueCatSubscription();
              await updateCurrentSessionUser(synced.user);
            } catch {
              // Keep startup resilient even if billing sync is temporarily unavailable.
            }
          }

          await syncMorningBriefingCache().catch(() => {
            // Background sync should not block startup.
          });
        })();
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [forceStartupLoader]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: effectiveBackgroundColor }}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => {
            if (pendingDashboardOpenRef.current) {
              navigationRef.navigate('Dashboard', pendingDashboardOpenRef.current);
              pendingDashboardOpenRef.current = null;
            }
          }}
        >
          {shouldShowStartupLoader ? (
            <View style={{ flex: 1, backgroundColor: effectiveBackgroundColor }}>
              <BrandStartupLoader />
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: effectiveBackgroundColor,
              }}
            >
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: effectiveBackgroundColor },
                }}
                initialRouteName={initialRouteName}
              >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Scanner" component={ScannerScreen} />
                <Stack.Screen name="Profile" component={DashboardScreen} />
                <Stack.Screen name="PremiumPurchase" component={PremiumPurchaseScreen} />
                <Stack.Screen name="NatalChart" component={NatalChartScreen} />
                <Stack.Screen name="FullNatalCareerAnalysis" component={FullNatalCareerAnalysisScreen} />
                <Stack.Screen name="DiscoverRoles" component={DiscoverRolesScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="JobScreenshotUpload" component={JobScreenshotUploadScreen} />
              </Stack.Navigator>
            </View>
          )}
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <BrightnessAdaptationProvider>
          <AppShell />
        </BrightnessAdaptationProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}
