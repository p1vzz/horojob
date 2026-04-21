import React, { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

const VIEWBOX_SIZE = 100;
const AURA_CENTER_X = 50;
const AURA_CENTER_Y = 50;
const ZODIAC_RADIUS = 39;
const AURA_TRACK_PATH = 'M50 12 A38 38 0 1 1 50 88 A38 38 0 1 1 50 12';
const SCENE_CLIP_RADIUS = 31;
const ARCH_PATH = 'M42.3 72.3 V35.2 C42.3 26.6 46.9 20.6 54 20.6 C61.1 20.6 65.7 26.6 65.7 35.2 V72.3';
const STAIR_STEPS = [
  {
    riser: 'M24.5 70.2 L31.2 72.2 L31.2 75.2 L24.5 73.2 Z',
    top: 'M24.5 70.2 L31.2 72.2 L36.9 69.4 L30.1 67.4 Z',
  },
  {
    riser: 'M30.1 67.4 L36.9 69.4 L36.9 72.4 L30.1 70.4 Z',
    top: 'M30.1 67.4 L36.9 69.4 L42.6 66.6 L35.8 64.6 Z',
  },
  {
    riser: 'M35.8 64.6 L42.6 66.6 L42.6 69.6 L35.8 67.6 Z',
    top: 'M35.8 64.6 L42.6 66.6 L48.3 63.8 L41.5 61.8 Z',
  },
  {
    riser: 'M41.5 61.8 L48.3 63.8 L48.3 66.8 L41.5 64.8 Z',
    top: 'M41.5 61.8 L48.3 63.8 L54 61 L47.2 59 Z',
  },
  {
    riser: 'M47.2 59 L54 61 L54 64 L47.2 62 Z',
    top: 'M47.2 59 L54 61 L59.7 58.2 L52.9 56.2 Z',
  },
] as const;
const STAIR_BASE_PATH = 'M24.5 73.2 L31.2 75.2 L36.9 72.4 L42.6 69.6 L48.3 66.8 L54 64';
const ASCENT_ARROW_CONNECTOR_PATH = 'M59.7 58.2 H72.2';
const ASCENT_ARROW_SHAFT_PATH = 'M72.2 78.6 V37.2';
const ASCENT_ARROW_HEAD_PATH = 'M69.9 40.6 L72.2 37.2 L74.5 40.6';
const ARCH_GLYPH_SPARKLE_PATH = 'M54 18.9 L54.8 20.4 L56.3 21.2 L54.8 22 L54 23.5 L53.2 22 L51.7 21.2 L53.2 20.4 Z';
const ARCH_GLYPH_CRESCENT_PATH =
  'M61.2 23.5 C59.8 23.8 58.9 25 58.9 26.4 C58.9 27.9 59.9 29.2 61.3 29.5 C60.5 28.7 60.1 27.7 60.1 26.5 C60.1 25.4 60.5 24.4 61.2 23.5 Z';
const SPARKLE_PATH = 'M0 -1.8 L0.6 -0.6 L1.8 0 L0.6 0.6 L0 1.8 L-0.6 0.6 L-1.8 0 L-0.6 -0.6 Z';
const SPARKLES = [
  { x: 27, y: 31, scale: 1.12 },
  { x: 72.1, y: 31.2, scale: 1.18 },
  { x: 22.5, y: 49, scale: 1.02 },
  { x: 34.5, y: 79, scale: 0.74 },
  { x: 58.5, y: 78.5, scale: 1.08 },
  { x: 70.8, y: 65.8, scale: 1.02 },
] as const;
const STAR_DOTS = [
  { x: 33.2, y: 25.4, r: 0.68 },
  { x: 67.5, y: 25.4, r: 0.64 },
  { x: 22.7, y: 58.6, r: 0.58 },
  { x: 34, y: 51.5, r: 0.62 },
  { x: 67.4, y: 56.8, r: 0.52 },
  { x: 63.6, y: 68.2, r: 0.54 },
] as const;
type WalkerPose = {
  backArmPath: string;
  backFootPath: string;
  backLegPath: string;
  bodyPath: string;
  frontArmPath: string;
  frontFootPath: string;
  frontLegPath: string;
  hairPath: string;
  headCx: number;
  headCy: number;
  headR: number;
};

const WALKER_STATIC_POSE: WalkerPose = {
  hairPath: 'M52.9 40.1 C51.2 40.5 50.1 41.8 49.8 43.4 C51 43.2 52.1 42.9 53 42 C53.4 41.3 53.4 40.7 52.9 40.1 Z',
  bodyPath: 'M53.7 44 L56.9 45.4 L58 49 L56.1 51.4 L53.1 50.5 L52.5 46.7 Z',
  backArmPath: 'M54.5 45.3 L51.7 44.7 L50.3 47.2',
  frontArmPath: 'M56.6 46 L59.1 47.5 L61.3 45.9',
  backLegPath: 'M54.8 50.9 L52.6 53.8 L50.9 56.1',
  frontLegPath: 'M56 50.8 L58.4 52.7 L60.7 52',
  backFootPath: 'M50.8 56.2 L49.4 56.8',
  frontFootPath: 'M60.7 52 L62.2 52',
  headCx: 55,
  headCy: 41.7,
  headR: 2.25,
};

const WALKER_ASCENT_POSES: readonly WalkerPose[] = [
  {
    hairPath: 'M52.8 40.2 C51.1 40.6 50 41.9 49.7 43.5 C50.9 43.3 52 43 52.9 42.2 C53.3 41.4 53.3 40.8 52.8 40.2 Z',
    bodyPath: 'M53.6 44.1 L56.8 45.5 L57.9 49 L56 51.4 L53 50.6 L52.4 46.8 Z',
    backArmPath: 'M54.5 45.4 L51.8 44.9 L50.4 47.2',
    frontArmPath: 'M56.5 46.1 L59 47.4 L61.1 46',
    backLegPath: 'M54.7 50.9 L52.6 53.5 L51.2 55.4',
    frontLegPath: 'M55.9 50.8 L58 52.3 L59.8 51.9',
    backFootPath: 'M51.1 55.5 L49.9 56',
    frontFootPath: 'M59.8 51.9 L61 52',
    headCx: 54.9,
    headCy: 41.8,
    headR: 2.23,
  },
  {
    hairPath: 'M52.4 40.4 C50.8 40.8 49.8 42 49.5 43.6 C50.6 43.4 51.8 43.1 52.6 42.4 C53 41.7 53 41.1 52.4 40.4 Z',
    bodyPath: 'M53.2 44.3 L56.4 45.6 L57.3 49 L55.7 51.3 L52.9 50.7 L52.2 47.2 Z',
    backArmPath: 'M54.2 45.5 L52.2 45.5 L51.2 47.8',
    frontArmPath: 'M56.3 46.1 L58.2 47.2 L59.8 46.6',
    backLegPath: 'M54.6 50.9 L53.7 53 L53 55.1',
    frontLegPath: 'M55.8 50.9 L57.2 52.8 L58.3 54.4',
    backFootPath: 'M52.9 55.1 L51.9 55.5',
    frontFootPath: 'M58.3 54.4 L59.5 54.3',
    headCx: 54.7,
    headCy: 41.9,
    headR: 2.22,
  },
  {
    hairPath: 'M51.8 41.1 C50.2 41.4 49.2 42.7 49 44.3 C50.1 44.1 51.1 43.8 51.9 43 C52.4 42.3 52.4 41.7 51.8 41.1 Z',
    bodyPath: 'M52.8 44.8 L56 46.2 L57 49.6 L55.2 51.9 L52.3 51.1 L51.6 47.6 Z',
    backArmPath: 'M53.4 46.2 L50.9 45.4 L49.5 47.1',
    frontArmPath: 'M55.8 46.9 L58.6 48 L60.9 47.1',
    backLegPath: 'M53.9 50.9 L52.5 52.4 L51 52',
    frontLegPath: 'M55.4 50.9 L57.6 53.1 L59.3 55.1',
    backFootPath: 'M50.9 52 L49.8 52.4',
    frontFootPath: 'M59.3 55.1 L60.4 55.4',
    headCx: 54,
    headCy: 42.4,
    headR: 2.18,
  },
] as const;

const WALKER_ASCENT_POSE_SEQUENCE = [0, 1, 2, 1] as const;

export const BRAND_ASCENT_ARROW_TRACK_PATH = 'M24.5 70.2 L31.2 72.2 L36.9 69.4 L42.6 66.6 L48.3 63.8 L54 61 L59.7 58.2 L72.2 58.2 L72.2 37.2';
export const BRAND_ASCENT_AURA_TRACK_PATH = AURA_TRACK_PATH;

const ZODIAC_GLYPHS = [
  '\u2648\uFE0E',
  '\u2649\uFE0E',
  '\u264A\uFE0E',
  '\u264B\uFE0E',
  '\u264C\uFE0E',
  '\u264D\uFE0E',
  '\u264E\uFE0E',
  '\u264F\uFE0E',
  '\u2650\uFE0E',
  '\u2651\uFE0E',
  '\u2652\uFE0E',
  '\u2653\uFE0E',
] as const;

const ZODIAC_POSITIONS = ZODIAC_GLYPHS.map((glyph, index) => {
  const degrees = (index * 30) - 90;
  const radians = (degrees * Math.PI) / 180;

  return {
    glyph,
    x: AURA_CENTER_X + Math.cos(radians) * ZODIAC_RADIUS,
    y: AURA_CENTER_Y + Math.sin(radians) * ZODIAC_RADIUS,
  };
});

type BrandAstroWheelMarkProps = {
  glowColor?: string;
  goldColor?: string;
  goldHighlightColor?: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  walkerFlightProgress?: number;
  walkerStridePhase?: number;
  walkerTravelProgress?: number;
};

export function BrandAstroWheelMark({
  glowColor = 'rgba(201,168,76,0.16)',
  goldColor = '#C9A84C',
  goldHighlightColor = '#FFF1BF',
  size,
  style,
  walkerFlightProgress = 0,
  walkerStridePhase,
  walkerTravelProgress = 1,
}: BrandAstroWheelMarkProps) {
  const gradientIdsRef = useRef({
    sceneClip: `brandAscentSceneClip_${Math.random().toString(36).slice(2, 10)}`,
    glow: `brandAscentGlow_${Math.random().toString(36).slice(2, 10)}`,
    gold: `brandAscentGold_${Math.random().toString(36).slice(2, 10)}`,
  });
  const { sceneClip, glow, gold } = gradientIdsRef.current;
  const clampedWalkerTravelProgress = Math.max(0, Math.min(1, walkerTravelProgress));
  const clampedWalkerFlightProgress = Math.max(0, Math.min(1, walkerFlightProgress));
  const hasAnimatedStride = typeof walkerStridePhase === 'number';
  const normalizedWalkerStridePhase = hasAnimatedStride
    ? (((walkerStridePhase % 1) + 1) % 1)
    : 0;
  const walkerPose = hasAnimatedStride
    ? WALKER_ASCENT_POSES[
      WALKER_ASCENT_POSE_SEQUENCE[
        Math.min(
          WALKER_ASCENT_POSE_SEQUENCE.length - 1,
          Math.floor(normalizedWalkerStridePhase * WALKER_ASCENT_POSE_SEQUENCE.length)
        )
      ]
    ]
    : WALKER_STATIC_POSE;
  const walkerBobOffsetX = hasAnimatedStride
    ? Math.sin(normalizedWalkerStridePhase * Math.PI) * 0.18
    : 0;
  const walkerBobOffsetY = hasAnimatedStride
    ? -Math.sin(normalizedWalkerStridePhase * Math.PI) * 0.48
    : 0;
  const walkerTranslateX = -23 + (23 * clampedWalkerTravelProgress) + walkerBobOffsetX + (clampedWalkerFlightProgress * 2.8);
  const walkerTranslateY =
    14
    - (14 * clampedWalkerTravelProgress)
    + walkerBobOffsetY
    - (clampedWalkerFlightProgress * 42);
  const walkerOpacity = 1 - (clampedWalkerFlightProgress * 0.96);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      style={style}
    >
      <Defs>
        <LinearGradient id={gold} x1="24" y1="74" x2="78" y2="32" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={goldColor} stopOpacity="1" />
          <Stop offset="58%" stopColor={goldColor} stopOpacity="0.96" />
          <Stop offset="100%" stopColor={goldHighlightColor} stopOpacity="1" />
        </LinearGradient>
        <RadialGradient id={glow} cx="50%" cy="50%" r="52%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity="0.24" />
          <Stop offset="68%" stopColor={glowColor} stopOpacity="0.08" />
          <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </RadialGradient>
        <ClipPath id={sceneClip}>
          <Circle cx={AURA_CENTER_X} cy={AURA_CENTER_Y} r={SCENE_CLIP_RADIUS} />
        </ClipPath>
      </Defs>

      <Circle cx="50" cy="50" r="41" fill={`url(#${glow})`} />

      <Path
        d={AURA_TRACK_PATH}
        fill="none"
        opacity={0.22}
        stroke={goldColor}
        strokeDasharray="1.4 2.6"
        strokeLinecap="round"
        strokeWidth={0.72}
      />

      {ZODIAC_POSITIONS.map((item, index) => (
        <SvgText
          key={`${item.glyph}-${index}`}
          alignmentBaseline="middle"
          fill={goldColor}
          fontSize="5.2"
          fontWeight="700"
          opacity={0.96}
          textAnchor="middle"
          x={item.x}
          y={item.y + 0.4}
        >
          {item.glyph}
        </SvgText>
      ))}

      <G clipPath={`url(#${sceneClip})`}>
        {SPARKLES.map((item, index) => (
          <Path
            key={`sparkle-${index}`}
            d={SPARKLE_PATH}
            fill={goldHighlightColor}
            opacity={0.94}
            transform={`translate(${item.x} ${item.y}) scale(${item.scale})`}
          />
        ))}
        {STAR_DOTS.map((item, index) => (
          <Circle
            key={`star-dot-${index}`}
            cx={item.x}
            cy={item.y}
            fill={goldHighlightColor}
            opacity={0.9}
            r={item.r}
          />
        ))}

        <Path
          d={ARCH_PATH}
          fill="none"
          opacity={0.96}
          stroke={`url(#${gold})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.44}
        />
        <Circle
          cx="47.2"
          cy="24.6"
          fill="none"
          opacity={0.94}
          r={1.55}
          stroke={goldHighlightColor}
          strokeWidth={0.9}
        />
        <Path
          d={ARCH_GLYPH_SPARKLE_PATH}
          fill={goldHighlightColor}
          opacity={0.94}
        />
        <Path
          d={ARCH_GLYPH_CRESCENT_PATH}
          fill={goldHighlightColor}
          opacity={0.92}
        />

        {STAIR_STEPS.map((step, index) => (
          <Path
            key={`step-riser-${index}`}
            d={step.riser}
            fill="none"
            opacity={0.9}
            stroke={`url(#${gold})`}
            strokeLinejoin="round"
            strokeWidth={1.1}
          />
        ))}
        {STAIR_STEPS.map((step, index) => (
          <Path
            key={`step-top-${index}`}
            d={step.top}
            fill="none"
            opacity={0.98}
            stroke={`url(#${gold})`}
            strokeLinejoin="round"
            strokeWidth={1.22}
          />
        ))}
        <Path
          d={STAIR_BASE_PATH}
          fill="none"
          opacity={0.82}
          stroke={`url(#${gold})`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.02}
        />
        <Path
          d={ASCENT_ARROW_CONNECTOR_PATH}
          fill="none"
          opacity={0.96}
          stroke={`url(#${gold})`}
          strokeLinecap="round"
          strokeWidth={1.24}
        />
        <Path
          d={ASCENT_ARROW_SHAFT_PATH}
          fill="none"
          opacity={0.96}
          stroke={`url(#${gold})`}
          strokeLinecap="round"
          strokeWidth={1.24}
        />
        <Path
          d={ASCENT_ARROW_HEAD_PATH}
          fill="none"
          opacity={0.96}
          stroke={goldHighlightColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.24}
        />

        <G opacity={walkerOpacity} transform={`translate(${walkerTranslateX} ${walkerTranslateY})`}>
          <Path
            d={walkerPose.hairPath}
            fill={goldHighlightColor}
            opacity={0.94}
          />
          <Path
            d={walkerPose.bodyPath}
            fill={goldHighlightColor}
            opacity={0.98}
          />
          <Path
            d={walkerPose.backArmPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.02}
          />
          <Path
            d={walkerPose.frontArmPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.02}
          />
          <Path
            d={walkerPose.backLegPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.12}
          />
          <Path
            d={walkerPose.frontLegPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.12}
          />
          <Path
            d={walkerPose.backFootPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.68}
          />
          <Path
            d={walkerPose.frontFootPath}
            fill="none"
            opacity={0.98}
            stroke={goldHighlightColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.68}
          />
          <Circle
            cx={walkerPose.headCx}
            cy={walkerPose.headCy}
            fill={goldHighlightColor}
            opacity={0.98}
            r={walkerPose.headR}
          />
        </G>
      </G>
    </Svg>
  );
}
