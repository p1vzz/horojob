export const LUNAR_PRODUCTIVITY_LAYOUT = {
  backgroundViewBoxWidth: 320,
  backgroundViewBoxHeight: 380,
  craterMap: [
    { x: 36, y: 48, radius: 10, shadowRadius: 13 },
    { x: 118, y: 42, radius: 14, shadowRadius: 18 },
    { x: 256, y: 58, radius: 12, shadowRadius: 15 },
    { x: 294, y: 126, radius: 9, shadowRadius: 12 },
    { x: 64, y: 148, radius: 16, shadowRadius: 21 },
    { x: 178, y: 138, radius: 11, shadowRadius: 14 },
    { x: 106, y: 226, radius: 13, shadowRadius: 17 },
    { x: 244, y: 236, radius: 18, shadowRadius: 23 },
    { x: 38, y: 308, radius: 11, shadowRadius: 14 },
    { x: 170, y: 322, radius: 15, shadowRadius: 19 },
    { x: 284, y: 334, radius: 10, shadowRadius: 13 },
  ] as const,
} as const;

export const DARK_LUNAR_PRODUCTIVITY_PALETTE = {
  cardGradient: ['rgba(245,247,255,0.16)', 'rgba(202,217,255,0.09)', 'rgba(245,247,255,0.05)'] as const,
  cardBorder: 'rgba(245,247,255,0.30)',
  cardOverlay: ['rgba(255,255,255,0.14)', 'transparent', 'rgba(0,0,0,0.24)'] as const,
  cardOverlayOpacity: 0.62,
  craterFill: 'rgba(214,224,247,0.08)',
  craterBorder: 'rgba(255,255,255,0.07)',
  craterShadow: 'rgba(92,107,142,0.1)',
  craterShadowOpacity: 0.08,
  craterOpacity: 0.42,
  focusRing: 'rgba(245,247,255,0.9)',
  badgeBg: 'rgba(245,247,255,0.16)',
  badgeBorder: 'rgba(245,247,255,0.30)',
  badgeText: 'rgba(245,247,255,0.92)',
  dateText: 'rgba(245,247,255,0.72)',
  scorePercent: '#DCE7FF',
  severity: '#C8D8FF',
  directionSupportive: '#8BF0C2',
  directionDisruptive: '#FFADB9',
  pressureHint: 'rgba(232,238,255,0.72)',
  headlineIcon: '#E8EEFF',
  headline: '#F3F6FF',
  summary: 'rgba(236,242,255,0.86)',
  algorithmBg: 'rgba(245,247,255,0.14)',
  algorithmBorder: 'rgba(245,247,255,0.22)',
  algorithmText: '#E7EEFF',
  reasonIcon: '#DDE8FF',
  reasonText: 'rgba(234,241,255,0.82)',
  metricLabel: 'rgba(225,235,255,0.72)',
  metricTrack: 'rgba(255,255,255,0.10)',
  footnote: 'rgba(221,232,255,0.62)',
  hydrationVeil: 'rgba(18,26,44,0.1)',
  hydrationShimmer: ['transparent', 'rgba(245,247,255,0.28)', 'transparent'] as const,
  syncBg: 'rgba(245,247,255,0.12)',
  syncBorder: 'rgba(245,247,255,0.2)',
  syncText: 'rgba(245,247,255,0.92)',
  retryBg: 'rgba(245,247,255,0.16)',
  retryBorder: 'rgba(245,247,255,0.26)',
  retryText: '#F5F7FF',
} as const;

export const LIGHT_LUNAR_PRODUCTIVITY_PALETTE = {
  cardGradient: ['rgba(255,255,255,0.84)', 'rgba(234,239,249,0.74)', 'rgba(255,255,255,0.92)'] as const,
  cardBorder: 'rgba(183,191,210,0.28)',
  cardOverlay: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)'] as const,
  cardOverlayOpacity: 0.72,
  craterFill: 'rgba(216,222,236,0.1)',
  craterBorder: 'rgba(170,179,198,0.08)',
  craterShadow: 'rgba(183,191,210,0.1)',
  craterShadowOpacity: 0.06,
  craterOpacity: 0.34,
  focusRing: 'rgba(96,111,145,0.72)',
  badgeBg: 'rgba(240,244,252,0.7)',
  badgeBorder: 'rgba(183,191,210,0.32)',
  badgeText: '#5D6577',
  dateText: 'rgba(96, 103, 119, 0.78)',
  scorePercent: '#7A8396',
  severity: '#8A93A6',
  directionSupportive: '#2F7E5C',
  directionDisruptive: '#B14A58',
  pressureHint: 'rgba(84, 90, 104, 0.74)',
  headlineIcon: '#7C8699',
  headline: '#454C59',
  summary: 'rgba(77, 84, 97, 0.9)',
  algorithmBg: 'rgba(240,244,252,0.72)',
  algorithmBorder: 'rgba(183,191,210,0.28)',
  algorithmText: '#677084',
  reasonIcon: '#7B8598',
  reasonText: 'rgba(84, 90, 104, 0.88)',
  metricLabel: 'rgba(96, 103, 119, 0.76)',
  metricTrack: 'rgba(183,191,210,0.28)',
  footnote: 'rgba(106, 114, 128, 0.72)',
  hydrationVeil: 'rgba(255,255,255,0.18)',
  hydrationShimmer: ['transparent', 'rgba(255,255,255,0.46)', 'transparent'] as const,
  syncBg: 'rgba(255,255,255,0.6)',
  syncBorder: 'rgba(183,191,210,0.24)',
  syncText: '#677084',
  retryBg: 'rgba(255,255,255,0.66)',
  retryBorder: 'rgba(183,191,210,0.3)',
  retryText: '#677084',
} as const;

export function resolveLunarProductivityInsightSourcePalette(mode: 'live' | 'preview' | 'fallback', isLight: boolean) {
  if (mode === 'live') {
    return isLight
      ? {
          backgroundColor: 'rgba(47,174,121,0.12)',
          borderColor: 'rgba(47,174,121,0.24)',
          textColor: '#317E5C',
        }
      : {
          backgroundColor: 'rgba(0,255,204,0.12)',
          borderColor: 'rgba(0,255,204,0.24)',
          textColor: '#A7FFF1',
        };
  }

  if (mode === 'fallback') {
    return isLight
      ? {
          backgroundColor: 'rgba(177,136,56,0.12)',
          borderColor: 'rgba(177,136,56,0.24)',
          textColor: '#8B6B2E',
        }
      : {
          backgroundColor: 'rgba(225,192,102,0.12)',
          borderColor: 'rgba(225,192,102,0.24)',
          textColor: '#F2DFAB',
        };
  }

  return isLight
    ? {
        backgroundColor: 'rgba(240,244,252,0.66)',
        borderColor: 'rgba(183,191,210,0.28)',
        textColor: '#677084',
      }
    : {
        backgroundColor: 'rgba(245,247,255,0.12)',
        borderColor: 'rgba(245,247,255,0.2)',
        textColor: 'rgba(245,247,255,0.92)',
      };
}
