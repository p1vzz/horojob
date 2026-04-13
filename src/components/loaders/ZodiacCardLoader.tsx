import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useBrightnessAdaptation } from '../../contexts/BrightnessAdaptationContext';
import type { BrightnessBoostChannels } from '../../contexts/brightnessAdaptationCore';
import { adaptColorOpacity, adaptOpacity } from '../../utils/brightnessAdaptation';
import { ZODIAC_META, type ZodiacSign } from '../../utils/zodiac';

export type LoaderAppearance = 'dark' | 'light';

type ZodiacCardLoaderSize = 'sm' | 'md' | 'lg';

type ZodiacCardLoaderProps = {
  sign: ZodiacSign;
  size?: ZodiacCardLoaderSize;
  text?: string;
  appearance?: LoaderAppearance;
  brightnessChannels?: BrightnessBoostChannels;
};

type ZodiacCardLoaderFullscreenProps = {
  sign: ZodiacSign;
  text?: string;
  subtitle?: string;
  appearance?: LoaderAppearance;
};

type IllustrationProps = {
  stroke: string;
};

type LoaderPalette = {
  frameStrong: string;
  frameSoft: string;
  frameDashed: string;
  cardBorder: string;
  cardBackground: string;
  cardGlow: string;
  cardShadow: string;
  badgeFill: string;
  badgeBorder: string;
  star: string;
  loadingText: string;
  fullscreenBackground: string;
  fullscreenSubtitle: string;
  ambientCircleA: string;
  ambientCircleB: string;
};

const GOLD = '#C9A84C';
const NEUTRAL_BRIGHTNESS_CHANNELS: BrightnessBoostChannels = {
  intensityMultiplier: 1,
  textOpacityMultiplier: 1,
  borderOpacityMultiplier: 1,
  glowOpacityMultiplier: 1,
};

const DARK_LOADER_PALETTE: LoaderPalette = {
  frameStrong: 'rgba(201,168,76,0.4)',
  frameSoft: 'rgba(201,168,76,0.25)',
  frameDashed: 'rgba(201,168,76,0.15)',
  cardBorder: 'rgba(201,168,76,0.3)',
  cardBackground: '#0A0A12',
  cardGlow: 'rgba(201,168,76,0.08)',
  cardShadow: '#C9A84C',
  badgeFill: 'rgba(201,168,76,0.16)',
  badgeBorder: 'rgba(201,168,76,0.42)',
  star: 'rgba(201,168,76,0.72)',
  loadingText: 'rgba(201,168,76,0.82)',
  fullscreenBackground: '#050508',
  fullscreenSubtitle: 'rgba(212,212,224,0.65)',
  ambientCircleA: 'rgba(201,168,76,0.08)',
  ambientCircleB: 'rgba(90,58,204,0.08)',
};

const LIGHT_LOADER_PALETTE: LoaderPalette = {
  frameStrong: 'rgba(181,141,43,0.42)',
  frameSoft: 'rgba(181,141,43,0.24)',
  frameDashed: 'rgba(181,141,43,0.16)',
  cardBorder: 'rgba(181,141,43,0.34)',
  cardBackground: '#FFF9F0',
  cardGlow: 'rgba(188,107,42,0.08)',
  cardShadow: '#B58D2B',
  badgeFill: 'rgba(181,141,43,0.12)',
  badgeBorder: 'rgba(181,141,43,0.34)',
  star: 'rgba(181,141,43,0.72)',
  loadingText: 'rgba(146,98,27,0.9)',
  fullscreenBackground: '#F3F0E9',
  fullscreenSubtitle: 'rgba(86,75,61,0.74)',
  ambientCircleA: 'rgba(188,107,42,0.08)',
  ambientCircleB: 'rgba(125,91,221,0.08)',
};

function resolveLoaderPalette(appearance: LoaderAppearance): LoaderPalette {
  return appearance === 'light' ? LIGHT_LOADER_PALETTE : DARK_LOADER_PALETTE;
}

function applyBrightnessToLoaderPalette(
  palette: LoaderPalette,
  channels: BrightnessBoostChannels
): LoaderPalette {
  return {
    frameStrong: adaptColorOpacity(palette.frameStrong, channels.borderOpacityMultiplier),
    frameSoft: adaptColorOpacity(palette.frameSoft, channels.borderOpacityMultiplier),
    frameDashed: adaptColorOpacity(palette.frameDashed, channels.borderOpacityMultiplier),
    cardBorder: adaptColorOpacity(palette.cardBorder, channels.borderOpacityMultiplier),
    cardBackground: palette.cardBackground,
    cardGlow: adaptColorOpacity(palette.cardGlow, channels.glowOpacityMultiplier),
    cardShadow: palette.cardShadow,
    badgeFill: adaptColorOpacity(palette.badgeFill, channels.glowOpacityMultiplier),
    badgeBorder: adaptColorOpacity(palette.badgeBorder, channels.borderOpacityMultiplier),
    star: adaptColorOpacity(palette.star, channels.glowOpacityMultiplier),
    loadingText: adaptColorOpacity(palette.loadingText, channels.textOpacityMultiplier),
    fullscreenBackground: palette.fullscreenBackground,
    fullscreenSubtitle: adaptColorOpacity(
      palette.fullscreenSubtitle,
      channels.textOpacityMultiplier
    ),
    ambientCircleA: adaptColorOpacity(palette.ambientCircleA, channels.glowOpacityMultiplier),
    ambientCircleB: adaptColorOpacity(palette.ambientCircleB, channels.glowOpacityMultiplier),
  };
}

const SIZE_CONFIG: Record<ZodiacCardLoaderSize, { width: number; height: number; illustration: number }> = {
  sm: { width: 120, height: 168, illustration: 98 },
  md: { width: 164, height: 230, illustration: 132 },
  lg: { width: 214, height: 300, illustration: 184 },
};

const STAR_POSITIONS = [
  { x: 0.14, y: 0.18 },
  { x: 0.28, y: 0.34 },
  { x: 0.82, y: 0.24 },
  { x: 0.68, y: 0.47 },
  { x: 0.2, y: 0.58 },
  { x: 0.36, y: 0.72 },
  { x: 0.84, y: 0.63 },
  { x: 0.62, y: 0.83 },
];

function AriesIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="75" cy="95" rx="28" ry="32" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M47 80 Q30 60 35 40 Q40 25 55 30 Q45 45 47 65" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <Path d="M55 30 Q65 35 60 50" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M103 80 Q120 60 115 40 Q110 25 95 30 Q105 45 103 65" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <Path d="M95 30 Q85 35 90 50" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Ellipse cx="62" cy="88" rx="4" ry="5" fill={stroke} fillOpacity="0.3" />
      <Ellipse cx="88" cy="88" rx="4" ry="5" fill={stroke} fillOpacity="0.3" />
      <Path d="M70 105 Q75 112 80 105" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M50 100 Q55 95 50 90" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M100 100 Q95 95 100 90" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M65 120 Q75 125 85 120" fill="none" stroke={stroke} strokeWidth="1" />
    </G>
  );
}

function TaurusIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="75" cy="95" rx="30" ry="28" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M45 75 Q30 55 40 40 Q50 30 55 45" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M105 75 Q120 55 110 40 Q100 30 95 45" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M42 70 Q35 65 38 75" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M108 70 Q115 65 112 75" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="60" cy="85" r="5" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="60" cy="85" r="2" fill={stroke} />
      <Circle cx="90" cy="85" r="5" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="90" cy="85" r="2" fill={stroke} />
      <Ellipse cx="75" cy="110" rx="10" ry="8" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="75" cy="118" r="4" fill="none" stroke={stroke} strokeWidth="2" />
      <Circle cx="70" cy="108" r="2" fill={stroke} fillOpacity="0.4" />
      <Circle cx="80" cy="108" r="2" fill={stroke} fillOpacity="0.4" />
    </G>
  );
}

function GeminiIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Path d="M55 60 Q45 65 42 80 Q40 95 45 110 Q50 120 55 118" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 60 Q65 55 70 60 Q72 70 70 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 60 Q50 50 55 42 Q65 35 75 40" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M48 55 Q40 50 42 60" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M45 65 Q38 62 38 72" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="52" cy="78" rx="3" ry="2" fill={stroke} fillOpacity="0.5" />
      <Path d="M95 60 Q105 65 108 80 Q110 95 105 110 Q100 120 95 118" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M95 60 Q85 55 80 60 Q78 70 80 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M95 60 Q100 50 95 42 Q85 35 75 40" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M102 55 Q110 50 108 60" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M105 65 Q112 62 112 72" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="98" cy="78" rx="3" ry="2" fill={stroke} fillOpacity="0.5" />
      <Path d="M70 95 Q75 90 80 95" fill="none" stroke={stroke} strokeWidth="1" strokeOpacity="0.6" />
      <Circle cx="75" cy="85" r="1.5" fill={stroke} fillOpacity="0.4" />
    </G>
  );
}

function CancerIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="75" cy="90" rx="28" ry="22" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Ellipse cx="75" cy="88" rx="20" ry="15" fill="none" stroke={stroke} strokeWidth="1" strokeOpacity="0.5" />
      <Path d="M60 85 Q75 75 90 85" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
      <Path d="M55 95 Q75 85 95 95" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
      <Path d="M47 85 Q35 80 30 70 Q28 60 35 55 Q42 52 45 60 Q40 65 42 75" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M35 55 Q30 58 32 65" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M103 85 Q115 80 120 70 Q122 60 115 55 Q108 52 105 60 Q110 65 108 75" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M115 55 Q120 58 118 65" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M65 72 Q63 65 60 62" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="58" cy="60" r="3" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1" />
      <Path d="M85 72 Q87 65 90 62" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="92" cy="60" r="3" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1" />
      <Path d="M50 100 Q45 108 40 115" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M55 105 Q52 112 48 118" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M100 100 Q105 108 110 115" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M95 105 Q98 112 102 118" fill="none" stroke={stroke} strokeWidth="1.2" />
    </G>
  );
}

function LeoIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <Path
          key={`leo-ray-${angle}`}
          d={`M75 85 L${75 + Math.cos((angle * Math.PI) / 180) * 45} ${85 + Math.sin((angle * Math.PI) / 180) * 45}`}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      ))}
      <Path d="M75 40 Q90 45 100 50 Q115 60 120 75 Q122 90 115 105 Q105 120 90 125 Q75 130 60 125 Q45 120 35 105 Q28 90 30 75 Q35 60 50 50 Q60 45 75 40" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M75 48 Q85 52 92 58" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M75 48 Q65 52 58 58" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M108 70 Q112 80 110 92" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M42 70 Q38 80 40 92" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="75" cy="88" rx="22" ry="25" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Ellipse cx="65" cy="82" rx="4" ry="3" fill={stroke} fillOpacity="0.4" />
      <Ellipse cx="85" cy="82" rx="4" ry="3" fill={stroke} fillOpacity="0.4" />
      <Path d="M72 92 L75 98 L78 92 Z" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1" />
      <Path d="M70 102 Q75 108 80 102" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Line x1="75" y1="98" x2="75" y2="105" stroke={stroke} strokeWidth="1" />
      <Circle cx="58" cy="95" r="1" fill={stroke} fillOpacity="0.4" />
      <Circle cx="55" cy="92" r="1" fill={stroke} fillOpacity="0.4" />
      <Circle cx="92" cy="95" r="1" fill={stroke} fillOpacity="0.4" />
      <Circle cx="95" cy="92" r="1" fill={stroke} fillOpacity="0.4" />
    </G>
  );
}

function VirgoIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="75" cy="70" rx="18" ry="20" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M57 55 Q50 50 48 60 Q45 75 50 90 Q52 100 48 115" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 52 Q48 55 45 65 Q42 80 45 95 Q44 108 42 120" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M93 55 Q100 50 102 60 Q105 75 100 90 Q98 100 102 115" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M95 52 Q102 55 105 65 Q108 80 105 95 Q106 108 108 120" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M57 55 Q65 45 75 45 Q85 45 93 55" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M60 50 Q75 40 90 50" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="68" cy="68" rx="3" ry="2" fill={stroke} fillOpacity="0.5" />
      <Ellipse cx="82" cy="68" rx="3" ry="2" fill={stroke} fillOpacity="0.5" />
      <Path d="M75 72 L75 78" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M70 82 Q75 85 80 82" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M68 90 L68 100" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M82 90 L82 100" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M75 105 L75 125" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M75 108 L68 102" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M75 108 L82 102" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M75 115 L65 110" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M75 115 L85 110" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="68" cy="102" rx="2" ry="4" fill={stroke} fillOpacity="0.3" />
      <Ellipse cx="82" cy="102" rx="2" ry="4" fill={stroke} fillOpacity="0.3" />
    </G>
  );
}

function LibraIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Rect x="72" y="90" width="6" height="35" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 125 L95 125" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M60 125 L75 118 L90 125" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="75" cy="55" r="8" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="75" cy="55" r="4" fill={stroke} fillOpacity="0.2" />
      <Path d="M35 70 L115 70" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M75 55 L75 70" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M35 70 L35 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M35 80 L25 78" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M35 80 L45 78" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="35" cy="90" rx="15" ry="8" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M25 78 Q22 85 20 90" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M45 78 Q48 85 50 90" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M115 70 L115 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M115 80 L105 78" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M115 80 L125 78" fill="none" stroke={stroke} strokeWidth="1" />
      <Ellipse cx="115" cy="90" rx="15" ry="8" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M105 78 Q102 85 100 90" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M125 78 Q128 85 130 90" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M65 65 Q60 60 65 55" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M85 65 Q90 60 85 55" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
    </G>
  );
}

function ScorpioIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="75" cy="100" rx="25" ry="15" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Ellipse cx="75" cy="98" rx="18" ry="10" fill="none" stroke={stroke} strokeWidth="1" strokeOpacity="0.5" />
      <Path d="M100 100 Q115 95 120 80 Q125 65 115 55 Q105 50 100 60" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M100 60 Q95 55 100 48 Q108 42 115 48" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M115 48 L120 42 L118 50 Z" fill={stroke} fillOpacity="0.5" stroke={stroke} strokeWidth="1" />
      <Path d="M50 95 Q35 85 30 75 Q28 65 35 60 Q42 58 45 65 Q40 72 45 80" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M35 60 Q30 62 32 70" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M50 100 Q38 95 32 88 Q28 80 35 75" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 110 Q50 118 45 122" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M65 112 Q62 120 58 125" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M85 112 Q88 120 92 125" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M95 110 Q100 118 105 122" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Circle cx="65" cy="95" r="2" fill={stroke} fillOpacity="0.5" />
      <Circle cx="85" cy="95" r="2" fill={stroke} fillOpacity="0.5" />
    </G>
  );
}

function SagittariusIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Path d="M40 110 Q30 85 45 55 Q60 35 85 40" fill="none" stroke={stroke} strokeWidth="2.5" />
      <Path d="M40 110 L85 40" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M50 95 L110 45" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M110 45 L115 38 L120 50 L110 45 L108 55" fill={stroke} fillOpacity="0.4" stroke={stroke} strokeWidth="1.5" />
      <Path d="M52 93 L48 100 L55 95" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M52 93 L58 98 L53 88" fill="none" stroke={stroke} strokeWidth="1" />
      <Circle cx="45" cy="55" r="3" fill={stroke} fillOpacity="0.3" />
      <Circle cx="40" cy="82" r="2" fill={stroke} fillOpacity="0.3" />
      <Circle cx="40" cy="110" r="3" fill={stroke} fillOpacity="0.3" />
      <Circle cx="95" cy="60" r="1.5" fill={stroke} fillOpacity="0.4" />
      <Circle cx="100" cy="75" r="1" fill={stroke} fillOpacity="0.3" />
      <Circle cx="80" cy="55" r="1" fill={stroke} fillOpacity="0.3" />
    </G>
  );
}

function CapricornIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse cx="60" cy="65" rx="18" ry="20" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M48 50 Q40 35 50 28 Q60 25 55 40" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M72 50 Q80 35 70 28 Q60 25 65 40" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M42 55 Q35 52 38 60" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Ellipse cx="55" cy="62" rx="3" ry="2" fill={stroke} fillOpacity="0.5" />
      <Path d="M55 80 Q50 90 52 100" fill="none" stroke={stroke} strokeWidth="1.2" />
      <Path d="M60 82 Q58 92 55 102" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M70 75 Q85 80 95 90 Q105 100 100 115 Q95 125 85 125" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M85 125 Q75 130 70 125 Q65 118 70 112 Q78 108 85 115" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M70 125 Q60 135 50 130 L55 125 L48 122" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M88 100 Q92 105 88 110" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M92 95 Q96 100 92 105" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M95 105 Q99 110 95 115" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
    </G>
  );
}

function AquariusIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Path d="M55 50 L50 45 L100 45 L95 50" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 50 Q50 55 50 65 Q50 80 60 85 L90 85 Q100 80 100 65 Q100 55 95 50" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M55 60 Q75 55 95 60" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M55 70 Q75 65 95 70" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M50 60 Q42 60 42 70 Q42 80 50 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M100 60 Q108 60 108 70 Q108 80 100 80" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Path d="M70 85 Q65 95 70 105 Q75 115 65 125" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M80 85 Q85 95 80 105 Q75 115 85 125" fill="none" stroke={stroke} strokeWidth="2" />
      <Path d="M75 90 Q70 100 75 110 Q80 120 75 130" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="60" cy="120" r="2" fill={stroke} fillOpacity="0.3" />
      <Circle cx="90" cy="118" r="2" fill={stroke} fillOpacity="0.3" />
      <Circle cx="72" cy="128" r="1.5" fill={stroke} fillOpacity="0.3" />
      <Path d="M55 130 Q65 125 75 130 Q85 135 95 130" fill="none" stroke={stroke} strokeWidth="1" strokeOpacity="0.5" />
    </G>
  );
}

function PiscesIllustration({ stroke }: IllustrationProps) {
  return (
    <G>
      <Ellipse
        cx="75"
        cy="55"
        rx="25"
        ry="12"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        transform="rotate(-15 75 55)"
      />
      <Path d="M98 50 L110 42 L110 58 L98 50" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1" />
      <Circle cx="58" cy="52" r="3" fill={stroke} fillOpacity="0.4" />
      <Path d="M65 55 Q70 52 75 55" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M75 55 Q80 52 85 55" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Ellipse
        cx="75"
        cy="115"
        rx="25"
        ry="12"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        transform="rotate(15 75 115)"
      />
      <Path d="M52 120 L40 128 L40 112 L52 120" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1" />
      <Circle cx="92" cy="112" r="3" fill={stroke} fillOpacity="0.4" />
      <Path d="M65 115 Q70 118 75 115" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M75 115 Q80 118 85 115" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.5" />
      <Path d="M75 67 Q65 85 75 85 Q85 85 75 103" fill="none" stroke={stroke} strokeWidth="1.5" />
      <Circle cx="60" cy="78" r="1.5" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
      <Circle cx="90" cy="92" r="2" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
      <Circle cx="65" cy="95" r="1" fill="none" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
    </G>
  );
}

const ILLUSTRATIONS: Record<ZodiacSign, React.ComponentType<IllustrationProps>> = {
  aries: AriesIllustration,
  taurus: TaurusIllustration,
  gemini: GeminiIllustration,
  cancer: CancerIllustration,
  leo: LeoIllustration,
  virgo: VirgoIllustration,
  libra: LibraIllustration,
  scorpio: ScorpioIllustration,
  sagittarius: SagittariusIllustration,
  capricorn: CapricornIllustration,
  aquarius: AquariusIllustration,
  pisces: PiscesIllustration,
};

export const ZodiacCardLoader = ({
  sign,
  size = 'md',
  text,
  appearance = 'dark',
  brightnessChannels = NEUTRAL_BRIGHTNESS_CHANNELS,
}: ZodiacCardLoaderProps) => {
  const cardPulse = useRef(new Animated.Value(0)).current;
  const innerPulse = useRef(new Animated.Value(0)).current;
  const textPulse = useRef(new Animated.Value(0)).current;
  const config = SIZE_CONFIG[size];
  const palette = applyBrightnessToLoaderPalette(resolveLoaderPalette(appearance), brightnessChannels);
  const accentGold = adaptColorOpacity(GOLD, brightnessChannels.textOpacityMultiplier);

  useEffect(() => {
    const cardLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardPulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    const innerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(innerPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(innerPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const textLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(textPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(textPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    cardLoop.start();
    innerLoop.start();
    textLoop.start();
    return () => {
      cardLoop.stop();
      innerLoop.stop();
      textLoop.stop();
    };
  }, [cardPulse, innerPulse, textPulse]);

  const scale = cardPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.992, 1.018],
  });
  const glowOpacity = cardPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.8],
  });
  const innerScale = innerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.965, 1.035],
  });
  const textOpacity = textPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.58, 1],
  });

  const meta = ZODIAC_META[sign];
  const Illustration = ILLUSTRATIONS[sign];

  return (
    <View style={styles.loaderRoot}>
      <Animated.View
        style={[
          styles.cardContainer,
          {
            width: config.width,
            height: config.height,
            borderColor: palette.cardBorder,
            backgroundColor: palette.cardBackground,
            shadowColor: palette.cardShadow,
            shadowOpacity: adaptOpacity(0.24, brightnessChannels.glowOpacityMultiplier),
            transform: [{ scale }],
          },
        ]}
      >
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
            <Path d="M5 20 Q5 5 20 5" fill="none" stroke={palette.frameStrong} strokeWidth="0.8" />
            <Path d="M5 25 Q5 10 25 10" fill="none" stroke={palette.frameSoft} strokeWidth="0.5" />
            <Path d="M95 20 Q95 5 80 5" fill="none" stroke={palette.frameStrong} strokeWidth="0.8" />
            <Path d="M95 25 Q95 10 75 10" fill="none" stroke={palette.frameSoft} strokeWidth="0.5" />
            <Path d="M5 120 Q5 135 20 135" fill="none" stroke={palette.frameStrong} strokeWidth="0.8" />
            <Path d="M5 115 Q5 130 25 130" fill="none" stroke={palette.frameSoft} strokeWidth="0.5" />
            <Path d="M95 120 Q95 135 80 135" fill="none" stroke={palette.frameStrong} strokeWidth="0.8" />
            <Path d="M95 115 Q95 130 75 130" fill="none" stroke={palette.frameSoft} strokeWidth="0.5" />
            <Rect
              x="8"
              y="8"
              width="84"
              height="124"
              rx="8"
              fill="none"
              stroke={palette.frameDashed}
              strokeWidth="0.5"
              strokeDasharray={[2, 2]}
            />
          </Svg>
        </View>

        <Animated.View style={[styles.cardGlow, { backgroundColor: palette.cardGlow, opacity: glowOpacity }]} />

        <View style={styles.badgeTop}>
          <View style={[styles.badgeTopCircle, { backgroundColor: palette.badgeFill, borderColor: palette.badgeBorder }]}>
            <Text style={[styles.badgeTopSymbol, { color: accentGold }]}>{meta.symbol}</Text>
          </View>
        </View>

        {STAR_POSITIONS.map((star, index) => (
          <View
            key={`star-${index}`}
            style={[
              styles.star,
              {
                left: config.width * star.x,
                top: config.height * star.y,
                backgroundColor: palette.star,
                opacity: 0.25 + (index % 4) * 0.12,
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.illustrationWrap,
            {
              width: config.illustration,
              height: config.illustration,
              marginLeft: -config.illustration / 2,
              transform: [{ scale: innerScale }],
            },
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 150 150">
            <Illustration stroke={accentGold} />
          </Svg>
        </Animated.View>

        <View style={styles.badgeBottom}>
          <View style={[styles.badgeBottomPill, { backgroundColor: palette.badgeFill, borderColor: palette.badgeBorder }]}>
            <Text style={[styles.badgeBottomText, { color: accentGold }]}>{meta.name}</Text>
          </View>
        </View>
      </Animated.View>

      {text ? (
        <Animated.Text style={[styles.loadingText, { color: palette.loadingText, opacity: textOpacity }]}>
          {text}
        </Animated.Text>
      ) : null}
    </View>
  );
};

export const ZodiacCardLoaderFullscreen = ({
  sign,
  text = 'Consulting the stars...',
  subtitle,
  appearance = 'dark',
}: ZodiacCardLoaderFullscreenProps) => {
  const ambientPulse = useRef(new Animated.Value(0)).current;
  const { channels } = useBrightnessAdaptation();
  const palette = applyBrightnessToLoaderPalette(resolveLoaderPalette(appearance), channels);

  useEffect(() => {
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientPulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    ambientLoop.start();
    return () => {
      ambientLoop.stop();
    };
  }, [ambientPulse]);

  const ambientScale = ambientPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const ambientOpacity = ambientPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });

  return (
    <View style={[styles.fullscreenRoot, { backgroundColor: palette.fullscreenBackground }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircleA,
          {
            backgroundColor: palette.ambientCircleA,
            opacity: ambientOpacity,
            transform: [{ scale: ambientScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircleB,
          {
            backgroundColor: palette.ambientCircleB,
            opacity: ambientOpacity,
            transform: [{ scale: ambientScale }],
          },
        ]}
      />
      <View style={styles.fullscreenContent}>
        <ZodiacCardLoader
          sign={sign}
          size="lg"
          text={text}
          appearance={appearance}
          brightnessChannels={channels}
        />
        {subtitle ? <Text style={[styles.fullscreenSubtitle, { color: palette.fullscreenSubtitle }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  badgeTop: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  badgeTopCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeTopSymbol: {
    color: GOLD,
    fontSize: 12,
  },
  illustrationWrap: {
    position: 'absolute',
    left: '50%',
    top: '13%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 99,
  },
  badgeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBottomPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeBottomText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    letterSpacing: 1.3,
  },
  fullscreenRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullscreenSubtitle: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  ambientCircleA: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 999,
  },
  ambientCircleB: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 999,
  },
});
