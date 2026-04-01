import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import type { JobScreenshotItem } from '../jobScreenshotUploadCore';
import { SCREENSHOT_UPLOAD_TEXTS } from '../jobScreenshotUploadCore';

type JobScreenshotGalleryProps = {
  items: JobScreenshotItem[];
  onRemove: (id: string) => void;
};

export function JobScreenshotGallery(props: JobScreenshotGalleryProps) {
  const { items, onRemove } = props;

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <Text className="text-[10px] tracking-[1.8px] mb-2" style={{ color: 'rgba(212,212,224,0.44)' }}>
        {SCREENSHOT_UPLOAD_TEXTS.selectedHeading}
      </Text>
      <View className="flex-row flex-wrap">
        {items.map((item, index) => (
          <View key={item.id} className="mr-2 mb-2">
            <View
              className="rounded-[12px] overflow-hidden"
              style={{
                width: 96,
                height: 156,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
              }}
            >
              <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Pressable
              onPress={() => onRemove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove screenshot ${index + 1}`}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
              style={{
                backgroundColor: 'rgba(255,107,138,0.88)',
                borderColor: 'rgba(255,255,255,0.22)',
                borderWidth: 1,
              }}
            >
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
