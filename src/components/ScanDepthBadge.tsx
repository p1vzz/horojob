import React from 'react';
import { Text, View } from 'react-native';

type ScanDepthBadgeProps = {
  depth: 'lite' | 'full';
  compact?: boolean;
};

export function ScanDepthBadge({ depth, compact = false }: ScanDepthBadgeProps) {
  const isFull = depth === 'full';
  return (
    <View
      className="rounded-full border"
      style={{
        paddingHorizontal: compact ? 7 : 10,
        paddingVertical: compact ? 3 : 5,
        backgroundColor: isFull ? 'rgba(201,168,76,0.16)' : 'rgba(101,184,255,0.14)',
        borderColor: isFull ? 'rgba(201,168,76,0.44)' : 'rgba(101,184,255,0.38)',
      }}
    >
      <Text
        className="font-semibold uppercase"
        style={{
          color: isFull ? '#E6CA73' : '#8AC9FF',
          fontSize: compact ? 9 : 10,
          letterSpacing: 0,
        }}
      >
        {isFull ? 'Full scan' : 'Lite scan'}
      </Text>
    </View>
  );
}
