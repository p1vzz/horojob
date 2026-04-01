import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { SCREENSHOT_UPLOAD_TEXTS } from '../jobScreenshotUploadCore';

type JobScreenshotUploadHeaderProps = {
  onBack: () => void;
};

export function JobScreenshotUploadHeader(props: JobScreenshotUploadHeaderProps) {
  const { onBack } = props;
  const { theme } = useThemeMode();

  return (
    <View className="flex-row items-center mb-4">
      <Pressable
        onPress={onBack}
        className="w-8 h-8 rounded-full items-center justify-center mr-2"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        }}
      >
        <ChevronLeft size={18} color="rgba(212,212,224,0.75)" />
      </Pressable>
      <Text className="text-[15px] font-semibold" style={{ color: theme.colors.foreground }}>
        {SCREENSHOT_UPLOAD_TEXTS.screenTitle}
      </Text>
    </View>
  );
}
