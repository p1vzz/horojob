function clampMultiplier(multiplier: number) {
  if (!Number.isFinite(multiplier)) {
    return 1;
  }

  return Math.max(0, multiplier);
}

function clampChannelValue(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Adapts opacity value based on a semantic brightness multiplier.
 * Clamps result to the 0-1 range.
 */
export function adaptOpacity(baseOpacity: number, multiplier: number): number {
  return clampChannelValue(baseOpacity * clampMultiplier(multiplier));
}

/**
 * Adapts intensity value (for example ring or loader pulse intensity)
 * based on a semantic brightness multiplier.
 */
export function adaptIntensity(baseIntensity: number, multiplier: number): number {
  return clampChannelValue(baseIntensity * clampMultiplier(multiplier));
}

/**
 * Parses an rgb/rgba string and returns the same color with adapted alpha.
 */
export function adaptRGBA(rgbaColor: string, multiplier: number): string {
  const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!match) return rgbaColor;

  const [, r, g, b, a] = match;
  const originalAlpha = a ? parseFloat(a) : 1;
  const adaptedAlpha = adaptOpacity(originalAlpha, multiplier);

  return `rgba(${r}, ${g}, ${b}, ${adaptedAlpha.toFixed(3)})`;
}

/**
 * Adapts any supported color into an rgba string with adjusted opacity.
 * Supports rgb/rgba and 6/8-digit hex colors.
 */
export function adaptColorOpacity(color: string, multiplier: number): string {
  const normalized = color.trim();
  if (normalized.toLowerCase() === 'transparent') {
    return color;
  }

  if (normalized.startsWith('rgb')) {
    return adaptRGBA(normalized, multiplier);
  }

  if (!normalized.startsWith('#')) {
    return color;
  }

  const hex = normalized.slice(1);
  if (hex.length !== 6 && hex.length !== 8) {
    return color;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const originalAlpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  const adaptedAlpha = adaptOpacity(originalAlpha, multiplier);

  return `rgba(${r}, ${g}, ${b}, ${adaptedAlpha.toFixed(3)})`;
}

/**
 * Adapts a hex opacity scalar when the source color stays separate.
 */
export function adaptHexOpacity(baseOpacity: number, multiplier: number): number {
  return adaptOpacity(baseOpacity, multiplier);
}
