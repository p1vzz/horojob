export type BrightnessTier = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

export type BrightnessBoostChannels = {
  intensityMultiplier: number;
  textOpacityMultiplier: number;
  borderOpacityMultiplier: number;
  glowOpacityMultiplier: number;
};

const NEUTRAL_CHANNELS: BrightnessBoostChannels = {
  intensityMultiplier: 1,
  textOpacityMultiplier: 1,
  borderOpacityMultiplier: 1,
  glowOpacityMultiplier: 1,
};

export const BRIGHTNESS_SAMPLE_INTERVAL_MS = 1200;
export const BRIGHTNESS_TIER_HYSTERESIS = 0.04;

const BRIGHTNESS_TIER_THRESHOLDS: Record<BrightnessTier, readonly [number, number]> = {
  'very-low': [0.0, 0.25],
  'low': [0.25, 0.45],
  'medium': [0.45, 0.7],
  'high': [0.7, 0.9],
  'very-high': [0.9, 1.0],
};

const BRIGHTNESS_CHANNEL_GRID: Record<BrightnessTier, BrightnessBoostChannels> = {
  'very-low': {
    intensityMultiplier: 1.28,
    textOpacityMultiplier: 1.18,
    borderOpacityMultiplier: 1.24,
    glowOpacityMultiplier: 1.4,
  },
  'low': {
    intensityMultiplier: 1.14,
    textOpacityMultiplier: 1.1,
    borderOpacityMultiplier: 1.12,
    glowOpacityMultiplier: 1.18,
  },
  'medium': NEUTRAL_CHANNELS,
  'high': {
    intensityMultiplier: 0.98,
    textOpacityMultiplier: 0.96,
    borderOpacityMultiplier: 0.94,
    glowOpacityMultiplier: 0.88,
  },
  'very-high': {
    intensityMultiplier: 0.94,
    textOpacityMultiplier: 0.92,
    borderOpacityMultiplier: 0.9,
    glowOpacityMultiplier: 0.8,
  },
};

export function clampBrightnessSample(value: number) {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, value));
}

export function resolveBrightnessTier(
  rawBrightness: number,
  previousTier?: BrightnessTier,
  hysteresis = BRIGHTNESS_TIER_HYSTERESIS
): BrightnessTier {
  const brightness = clampBrightnessSample(rawBrightness);

  if (previousTier) {
    const [min, max] = BRIGHTNESS_TIER_THRESHOLDS[previousTier];
    const lowerBound = previousTier === 'very-low' ? min : Math.max(0, min - hysteresis);
    const upperBound = previousTier === 'very-high' ? max : Math.min(1, max + hysteresis);

    if (brightness >= lowerBound && brightness <= upperBound) {
      return previousTier;
    }
  }

  if (brightness < BRIGHTNESS_TIER_THRESHOLDS.low[0]) return 'very-low';
  if (brightness < BRIGHTNESS_TIER_THRESHOLDS.medium[0]) return 'low';
  if (brightness < BRIGHTNESS_TIER_THRESHOLDS.high[0]) return 'medium';
  if (brightness < BRIGHTNESS_TIER_THRESHOLDS['very-high'][0]) return 'high';
  return 'very-high';
}

export function resolveBrightnessBoostChannels(tier: BrightnessTier, isAdaptive: boolean): BrightnessBoostChannels {
  if (!isAdaptive) {
    return NEUTRAL_CHANNELS;
  }

  return BRIGHTNESS_CHANNEL_GRID[tier];
}
