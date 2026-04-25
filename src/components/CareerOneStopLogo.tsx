import React from 'react';
import Svg, { Path } from 'react-native-svg';

type CareerOneStopLogoProps = {
  width?: number;
  height?: number;
};

export function CareerOneStopLogo({ width = 24, height = 18 }: CareerOneStopLogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 48" accessible accessibilityLabel="CareerOneStop logo">
      <Path
        d="M6 10.5 20.8 3l9.2 9.2-5.8 10.2 7.1 8.4-13 4.2-6.4 9.8-4.4-15.2L0 22.8l9.7-4.7Z"
        fill="#1B69B3"
      />
      <Path
        d="M29.2 2.6c8.8 3.4 17.7 3.3 26.8.1l5.8 9.2c-9.6 3.2-19.1 3.1-28.5-.4Z"
        fill="#D6473D"
      />
      <Path
        d="M31.5 14.7c9.7 3.5 19.4 3.6 29.2.3L64 25c-9.9 3.2-19.8 3.1-29.7-.4Z"
        fill="#D6473D"
      />
      <Path
        d="M34.7 27.6c9.1 3.2 18.4 3.3 27.8.2L59.8 39c-8.3 2.2-16.8 2-25.4-.8Z"
        fill="#D6473D"
      />
      <Path
        d="M28.5 2.8c1.6 3.1 2.9 5.9 4.2 8.7l1.6 13.1c.2 4.4.2 8.9.1 13.5l-9.5-7.5-2.1-8.1Z"
        fill="#0F4F95"
        opacity="0.2"
      />
    </Svg>
  );
}
