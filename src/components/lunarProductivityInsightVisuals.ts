export const LUNAR_PRODUCTIVITY_VISUALS = {
  cardGradient: ['rgba(245,247,255,0.16)', 'rgba(202,217,255,0.09)', 'rgba(245,247,255,0.05)'] as const,
  cardBorder: 'rgba(245,247,255,0.30)',
  cardOverlay: ['rgba(255,255,255,0.14)', 'transparent', 'rgba(0,0,0,0.24)'] as const,
  cardOverlayOpacity: 0.62,
  orbGradient: ['rgba(245,247,255,0.40)', 'rgba(196,214,255,0.16)', 'rgba(245,247,255,0.0)'] as const,
  orbOpacity: 0.38,
  orbOffsetRight: -68,
  orbOffsetTop: -56,
  orbSize: 220,
  badgeBg: 'rgba(245,247,255,0.16)',
  badgeBorder: 'rgba(245,247,255,0.30)',
  badgeText: 'rgba(245,247,255,0.92)',
  dateText: 'rgba(245,247,255,0.72)',
  scorePercent: '#DCE7FF',
  severity: '#C8D8FF',
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

export function resolveLunarProductivityInsightSourcePalette(mode: 'live' | 'preview' | 'fallback') {
  if (mode === 'live') {
    return {
      backgroundColor: 'rgba(0,255,204,0.12)',
      borderColor: 'rgba(0,255,204,0.24)',
      textColor: '#A7FFF1',
    };
  }

  if (mode === 'fallback') {
    return {
      backgroundColor: 'rgba(225,192,102,0.12)',
      borderColor: 'rgba(225,192,102,0.24)',
      textColor: '#F2DFAB',
    };
  }

  return {
    backgroundColor: 'rgba(245,247,255,0.12)',
    borderColor: 'rgba(245,247,255,0.2)',
    textColor: 'rgba(245,247,255,0.92)',
  };
}
