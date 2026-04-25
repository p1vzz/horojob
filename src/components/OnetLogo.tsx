import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

type OnetLogoProps = {
  width?: number;
  height?: number;
};

export function OnetLogo({ width = 28, height = 28 }: OnetLogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" accessible accessibilityLabel="O*NET logo">
      <Circle cx="32" cy="32" r="27" fill="#12387F" />
      <SvgText
        x="32"
        y="35"
        fill="#FFFFFF"
        fontSize="18"
        fontWeight="700"
        fontFamily="Georgia"
        textAnchor="middle"
      >
        o*net
      </SvgText>
      <SvgText
        x="49.5"
        y="19.5"
        fill="#FFFFFF"
        fontSize="6.5"
        fontWeight="700"
        fontFamily="Georgia"
      >
        R
      </SvgText>
      <Path
        d="M24.5 38.4C24.5 35.1 30.2 33 36 33"
        fill="none"
        stroke="#FFD94D"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <Path
        d="M39.8 33.1C46.5 33.4 51 35.5 51 38.4C51 42 44.7 44.1 36.5 43.6C32.9 43.3 29.8 42.7 27.5 41.5"
        fill="none"
        stroke="#FFD94D"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}
