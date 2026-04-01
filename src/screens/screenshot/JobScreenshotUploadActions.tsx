import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ImagePlus, Sparkles } from 'lucide-react-native';
import { SCREENSHOT_UPLOAD_TEXTS } from '../jobScreenshotUploadCore';

type JobScreenshotUploadActionsProps = {
  canAddMore: boolean;
  errorText: string | null;
  hasItems: boolean;
  isLoading: boolean;
  onAnalyzePress: () => void;
  onPickScreenshots: () => void;
};

export function JobScreenshotUploadActions(props: JobScreenshotUploadActionsProps) {
  const { canAddMore, errorText, hasItems, isLoading, onAnalyzePress, onPickScreenshots } = props;

  return (
    <>
      {errorText ? (
        <View
          className="rounded-[14px] px-3 py-2 mt-3"
          style={{
            backgroundColor: 'rgba(255,107,138,0.12)',
            borderColor: 'rgba(255,107,138,0.35)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: '#FF9FB4' }}>
            {errorText}
          </Text>
        </View>
      ) : null}

      <View className="mt-4">
        <Pressable
          onPress={onPickScreenshots}
          disabled={!canAddMore || isLoading}
          className="rounded-[14px] px-4 py-3 flex-row items-center justify-center"
          style={{
            backgroundColor: canAddMore ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
          }}
        >
          <ImagePlus size={16} color="rgba(212,212,224,0.86)" />
          <Text className="text-[12px] font-semibold ml-2" style={{ color: 'rgba(212,212,224,0.92)' }}>
            {canAddMore ? SCREENSHOT_UPLOAD_TEXTS.pickAction : SCREENSHOT_UPLOAD_TEXTS.pickActionDisabled}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3">
        <Pressable
          onPress={onAnalyzePress}
          disabled={isLoading || !hasItems}
          className="rounded-[14px] px-4 py-3 flex-row items-center justify-center"
          style={{
            backgroundColor: hasItems ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.08)',
            borderColor: 'rgba(201,168,76,0.35)',
            borderWidth: 1,
          }}
        >
          <Sparkles size={15} color="#C9A84C" />
          <Text className="text-[12px] font-semibold ml-2" style={{ color: '#E7C86A' }}>
            {SCREENSHOT_UPLOAD_TEXTS.analyzeAction}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
