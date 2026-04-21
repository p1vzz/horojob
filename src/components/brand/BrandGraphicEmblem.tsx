import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { BrandAstroWheelMark } from './BrandAstroWheelMark';

type BrandGraphicEmblemProps = {
  discFill?: string;
  glyphColor?: string;
  ringColor?: string;
  ringSoftColor?: string;
  size: number;
  stairColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function BrandGraphicEmblem({
  discFill = 'rgba(255,255,255,0.14)',
  glyphColor = 'rgba(181,141,43,0.86)',
  ringColor = '#B58D2B',
  ringSoftColor = 'rgba(181,141,43,0.18)',
  size,
  stairColor = '#B58D2B',
  style,
}: BrandGraphicEmblemProps) {
  return (
    <BrandAstroWheelMark
      size={size}
      style={style}
      glowColor={discFill}
      goldColor={stairColor ?? ringColor}
      goldHighlightColor={glyphColor ?? ringSoftColor ?? ringColor}
    />
  );
}
