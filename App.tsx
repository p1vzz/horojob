import 'react-native-gesture-handler';
import "./global.css";
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import { FullScreenCosmicLoader } from './src/components/loaders/FullScreenCosmicLoader';
import { ensureAuthSession, updateCurrentSessionUser } from './src/services/authSession';
import { fetchBirthProfile } from './src/services/astrologyApi';
import { clearNatalChartCacheForUser } from './src/utils/natalChartStorage';
import type { RootStackParamList } from './src/types/navigation';
import { syncMorningBriefingCache } from './src/services/morningBriefingSync';
import { configureRevenueCatForUser, isRevenueCatConfigured } from './src/services/revenueCat';
import { syncRevenueCatSubscription } from './src/services/billingApi';
import { registerPushTokenForUser } from './src/services/pushNotifications';
import * as Notifications from 'expo-notifications';
import { ThemeModeProvider, useThemeMode } from './src/theme/ThemeModeProvider';
import { resolveInitialRouteName, shouldForceOnboardingEntry } from './src/appStartupCore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppShell() {
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const pendingDashboardOpenRef = useRef(false);
  const { mode, theme, isReady: isThemeReady } = useThemeMode();
  const forceOnboardingEntry = shouldForceOnboardingEntry(process.env.EXPO_PUBLIC_FORCE_ONBOARDING_ENTRY, __DEV__);
  const initialRouteName = resolveInitialRouteName({
    hasOnboarded,
    forceOnboardingEntry,
  });
  const isAppReady = isReady && isThemeReady;

  useEffect(() => {
    const openDashboard = () => {
      pendingDashboardOpenRef.current = true;
      if (navigationRef.isReady()) {
        navigationRef.navigate('Dashboard');
        pendingDashboardOpenRef.current = false;
      }
    };

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      const type = typeof data?.type === 'string' ? data.type : null;
      if (type === 'burnout_alert') {
        openDashboard();
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
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            if (pendingDashboardOpenRef.current) {
              navigationRef.navigate('Dashboard');
              pendingDashboardOpenRef.current = false;
            }
          }}
        >
          {isAppReady ? (
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
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
          ) : (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <FullScreenCosmicLoader
                title="Preparing Session"
                subtitle={isThemeReady ? 'Syncing profile and chart data...' : 'Restoring saved appearance and profile...'}
              />
            </View>
          )}
          <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AppShell />
    </ThemeModeProvider>
  );
}
