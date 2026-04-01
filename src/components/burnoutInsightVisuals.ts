export const BURNOUT_INSIGHT_LAYOUT = {
  orbOffsetRight: -64,
  orbOffsetTop: -56,
  orbSize: 210,
} as const;

export const DARK_BURNOUT_INSIGHT_PALETTE = {
  cardGradient: ['rgba(255,72,72,0.14)', 'rgba(255,132,64,0.08)', 'rgba(255,72,72,0.05)'] as const,
  cardBorder: 'rgba(255,116,116,0.28)',
  cardOverlay: ['rgba(255,255,255,0.1)', 'transparent', 'rgba(0,0,0,0.22)'] as const,
  cardOverlayOpacity: 0.65,
  orbGradient: ['rgba(255,92,92,0.38)', 'rgba(255,92,92,0.12)', 'rgba(255,92,92,0)'] as const,
  orbOpacity: 0.35,
  badgeBg: 'rgba(255,107,107,0.14)',
  badgeBorder: 'rgba(255,107,107,0.24)',
  badgeIcon: '#FF8787',
  badgeText: '#FFB1B1',
  dateText: 'rgba(255,199,199,0.72)',
  score: '#FF6B6B',
  scorePercent: '#FFAAAA',
  severity: '#FFC1A8',
  headlineIcon: '#FF9F9F',
  headline: '#FFE3D8',
  summary: 'rgba(255,226,214,0.86)',
  algorithmBg: 'rgba(255,124,124,0.14)',
  algorithmBorder: 'rgba(255,124,124,0.24)',
  algorithmText: '#FFCFCF',
  reasonIcon: '#FF9D8F',
  reasonText: 'rgba(255,224,214,0.84)',
  metricLabel: 'rgba(255,208,196,0.72)',
  metricTrack: 'rgba(255,255,255,0.1)',
  footnote: 'rgba(255,210,200,0.62)',
  hydrationVeil: 'rgba(12,8,8,0.08)',
  hydrationShimmer: ['transparent', 'rgba(255,214,214,0.22)', 'transparent'] as const,
  syncBg: 'rgba(255,255,255,0.06)',
  syncBorder: 'rgba(255,255,255,0.12)',
  syncText: 'rgba(255,226,214,0.78)',
  retryBg: 'rgba(255,255,255,0.08)',
  retryBorder: 'rgba(255,255,255,0.16)',
  retryText: '#FFE3D8',
} as const;

export const LIGHT_BURNOUT_INSIGHT_PALETTE = {
  cardGradient: ['rgba(248,188,176,0.28)', 'rgba(253,226,205,0.42)', 'rgba(255,255,255,0.86)'] as const,
  cardBorder: 'rgba(224,140,125,0.32)',
  cardOverlay: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)'] as const,
  cardOverlayOpacity: 0.72,
  orbGradient: ['rgba(244,113,113,0.32)', 'rgba(244,113,113,0.1)', 'rgba(244,113,113,0)'] as const,
  orbOpacity: 0.24,
  badgeBg: 'rgba(216,90,90,0.14)',
  badgeBorder: 'rgba(216,90,90,0.3)',
  badgeIcon: '#D85A5A',
  badgeText: '#BA5959',
  dateText: 'rgba(153, 88, 80, 0.84)',
  score: '#D95E5E',
  scorePercent: '#C97272',
  severity: '#A86A4F',
  headlineIcon: '#CC7568',
  headline: '#5C3E39',
  summary: 'rgba(102, 66, 60, 0.92)',
  algorithmBg: 'rgba(224,140,125,0.14)',
  algorithmBorder: 'rgba(216,112,95,0.28)',
  algorithmText: '#8F594F',
  reasonIcon: '#B86C5E',
  reasonText: 'rgba(103, 68, 61, 0.9)',
  metricLabel: 'rgba(118, 79, 71, 0.78)',
  metricTrack: 'rgba(176, 132, 118, 0.34)',
  footnote: 'rgba(129, 86, 77, 0.74)',
  hydrationVeil: 'rgba(255,255,255,0.18)',
  hydrationShimmer: ['transparent', 'rgba(255,255,255,0.46)', 'transparent'] as const,
  syncBg: 'rgba(255,255,255,0.58)',
  syncBorder: 'rgba(216,112,95,0.2)',
  syncText: '#8F594F',
  retryBg: 'rgba(255,255,255,0.62)',
  retryBorder: 'rgba(216,112,95,0.24)',
  retryText: '#8F594F',
} as const;

export function resolveBurnoutInsightSourcePalette(mode: 'live' | 'preview' | 'fallback', isLight: boolean) {
  if (mode === 'live') {
    return isLight
      ? {
          backgroundColor: 'rgba(56,204,136,0.12)',
          borderColor: 'rgba(56,204,136,0.26)',
          textColor: '#2F8E62',
        }
      : {
          backgroundColor: 'rgba(56,204,136,0.12)',
          borderColor: 'rgba(56,204,136,0.28)',
          textColor: '#7FE0A8',
        };
  }

  if (mode === 'fallback') {
    return isLight
      ? {
          backgroundColor: 'rgba(201,168,76,0.14)',
          borderColor: 'rgba(201,168,76,0.26)',
          textColor: '#9A6F2A',
        }
      : {
          backgroundColor: 'rgba(201,168,76,0.14)',
          borderColor: 'rgba(201,168,76,0.28)',
          textColor: '#F1D38D',
        };
  }

  return isLight
    ? {
        backgroundColor: 'rgba(124,92,255,0.1)',
        borderColor: 'rgba(124,92,255,0.2)',
        textColor: '#745FBD',
      }
    : {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.14)',
        textColor: 'rgba(255,226,214,0.78)',
      };
}
