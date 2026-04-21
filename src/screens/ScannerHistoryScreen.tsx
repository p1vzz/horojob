import React from 'react';
import { ActivityIndicator, ScrollView, Text, Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import { adaptColorOpacity, adaptOpacity } from '../utils/brightnessAdaptation';
import { ensureAuthSession } from '../services/authSession';
import { loadJobScanHistoryForUser, type JobScanHistoryEntry } from '../utils/jobScanHistoryStorage';
import { ScannerHistorySection } from './scanner/ScannerHistorySection';
import type { AppNavigationProp } from '../types/navigation';

export const ScannerHistoryScreen = () => {
  const { theme } = useThemeMode();
  const { channels } = useBrightnessAdaptation();
  const navigation = useNavigation<AppNavigationProp<'ScannerHistory'>>();
  const [entries, setEntries] = React.useState<JobScanHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      setIsLoading(true);
      setErrorText(null);

      void ensureAuthSession()
        .then((session) => loadJobScanHistoryForUser(session.user.id))
        .then((history) => {
          if (!mounted) return;
          setEntries(history);
        })
        .catch(() => {
          if (!mounted) return;
          setErrorText('Unable to load saved scans right now.');
        })
        .finally(() => {
          if (!mounted) return;
          setIsLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Scanner');
  }, [navigation]);

  const handleSelect = React.useCallback(
    (entry: JobScanHistoryEntry) => {
      navigation.navigate('Scanner', {
        historyEntry: entry,
      });
    },
    [navigation]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="absolute inset-0">
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient id="historyGradTop" cx="40%" cy="-5%" rx="75%" ry="50%">
              <Stop
                offset="0%"
                stopColor="rgba(90,58,204,0.28)"
                stopOpacity={adaptOpacity(0.28, channels.glowOpacityMultiplier).toString()}
              />
              <Stop
                offset="60%"
                stopColor="rgba(90,58,204,0.06)"
                stopOpacity={adaptOpacity(0.06, channels.glowOpacityMultiplier).toString()}
              />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="historyGradBottom" cx="80%" cy="110%" rx="65%" ry="45%">
              <Stop
                offset="0%"
                stopColor="rgba(201,168,76,0.16)"
                stopOpacity={adaptOpacity(0.16, channels.glowOpacityMultiplier).toString()}
              />
              <Stop offset="100%" stopColor="rgba(201,168,76,0)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#historyGradTop)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#historyGradBottom)" />
        </Svg>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: 430, alignSelf: 'center' }} className="px-5 pt-6">
            <View className="flex-row items-center mb-5">
              <Pressable
                accessibilityRole="button"
                onPress={handleBack}
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
                  borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
                  borderWidth: 1,
                }}
              >
                <ChevronLeft
                  size={18}
                  color={adaptColorOpacity('rgba(212,212,224,0.75)', channels.textOpacityMultiplier)}
                />
              </Pressable>
              <Text className="text-[15px] font-semibold" style={{ color: theme.colors.foreground }}>
                Scan History
              </Text>
            </View>

            {isLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator color={theme.colors.gold} />
                <Text
                  className="text-[12px] mt-3"
                  style={{ color: adaptColorOpacity('rgba(212,212,224,0.55)', channels.textOpacityMultiplier) }}
                >
                  Loading saved scans...
                </Text>
              </View>
            ) : errorText ? (
              <View
                className="rounded-[8px] p-4 border"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,107,138,0.1)', channels.glowOpacityMultiplier),
                  borderColor: adaptColorOpacity('rgba(255,107,138,0.3)', channels.borderOpacityMultiplier),
                }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: theme.colors.danger }}>
                  {errorText}
                </Text>
              </View>
            ) : entries.length > 0 ? (
              <ScannerHistorySection entries={entries} heading="SAVED SCANS" onSelect={handleSelect} />
            ) : (
              <View
                className="rounded-[8px] p-4 border"
                style={{
                  backgroundColor: adaptColorOpacity('rgba(255,255,255,0.04)', channels.glowOpacityMultiplier),
                  borderColor: adaptColorOpacity('rgba(255,255,255,0.1)', channels.borderOpacityMultiplier),
                }}
              >
                <Text className="text-[13px] font-semibold" style={{ color: theme.colors.foreground }}>
                  No saved scans yet
                </Text>
                <Text
                  className="text-[12px] mt-2 leading-[18px]"
                  style={{ color: adaptColorOpacity('rgba(212,212,224,0.58)', channels.textOpacityMultiplier) }}
                >
                  Completed checks will appear here after you scan a job posting.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
