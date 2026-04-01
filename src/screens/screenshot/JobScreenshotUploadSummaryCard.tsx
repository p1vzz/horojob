import React from 'react';
import { View, Text } from 'react-native';
import { SCREENSHOT_UPLOAD_TEXTS } from '../jobScreenshotUploadCore';

type JobScreenshotUploadSummaryCardProps = {
  itemCount: number;
  maxScreenshots: number;
  totalBytesText: string;
};

export function JobScreenshotUploadSummaryCard(props: JobScreenshotUploadSummaryCardProps) {
  const { itemCount, maxScreenshots, totalBytesText } = props;

  return (
    <View
      className="rounded-[16px] p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }}
    >
      <Text className="text-[13px] font-semibold" style={{ color: 'rgba(233,233,242,0.94)' }}>
        {SCREENSHOT_UPLOAD_TEXTS.summaryTitle}
      </Text>
      <Text className="text-[12px] mt-1 leading-[17px]" style={{ color: 'rgba(212,212,224,0.55)' }}>
        {SCREENSHOT_UPLOAD_TEXTS.summaryBody}
      </Text>
      <Text className="text-[11px] mt-2" style={{ color: 'rgba(201,168,76,0.82)' }}>
        Total selected: {itemCount}/{maxScreenshots} ({totalBytesText})
      </Text>
    </View>
  );
}
