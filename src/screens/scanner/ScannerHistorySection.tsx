import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import type { JobScanHistoryEntry } from '../../utils/jobScanHistoryStorage';

type ScannerHistorySectionProps = {
  entries: JobScanHistoryEntry[];
  onSelect: (entry: JobScanHistoryEntry) => void;
};

export function ScannerHistorySection(props: ScannerHistorySectionProps) {
  const { entries, onSelect } = props;
  const { theme } = useThemeMode();

  if (entries.length === 0) {
    return null;
  }

  return (
    <View className="mt-3">
      <Text className="text-[10px] tracking-[1.8px] mb-1.5" style={{ color: 'rgba(212,212,224,0.44)' }}>
        RECENT CHECKS
      </Text>
      <View
        className="rounded-[14px] overflow-hidden"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        {entries.map((entry, index) => {
          const title = entry.analysis.job?.title || entry.url;
          const source = entry.meta.source.toUpperCase();
          const overall = entry.analysis.scores.overall;

          return (
            <Pressable
              key={`${entry.savedAt}:${entry.url}`}
              onPress={() => onSelect(entry)}
              className="px-3 py-2.5"
              style={{
                borderBottomColor: 'rgba(255,255,255,0.06)',
                borderBottomWidth: index === entries.length - 1 ? 0 : 1,
              }}
            >
              <View className="flex-row items-center">
                <Text
                  numberOfLines={1}
                  className="text-[12px] font-semibold flex-1 mr-2"
                  style={{ color: theme.colors.foreground }}
                >
                  {title}
                </Text>
                <Text className="text-[11px] font-semibold" style={{ color: '#C9A84C' }}>
                  {overall}%
                </Text>
              </View>
              <Text numberOfLines={1} className="text-[10px] mt-0.5" style={{ color: 'rgba(212,212,224,0.45)' }}>
                {source} | Tap to reopen
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
