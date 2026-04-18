export type MorningBriefingWidgetVariantId =
  | 'small_vibe'
  | 'small_score'
  | 'small_energy_arc'
  | 'small_energy_value'
  | 'small_ring_score'
  | 'medium_vibe'
  | 'strip_peak'
  | 'strip_minimal';

export type MorningBriefingWidgetVariantOption = {
  id: MorningBriefingWidgetVariantId;
  title: string;
  subtitle: string;
  sizeLabel: '2x2' | '4x2' | '4x1';
  family: 'small' | 'medium' | 'strip';
};

export const DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT: MorningBriefingWidgetVariantId = 'medium_vibe';

export const MORNING_BRIEFING_WIDGET_VARIANTS: MorningBriefingWidgetVariantOption[] = [
  {
    id: 'small_vibe',
    title: 'Career Vibe',
    subtitle: 'Quick trend + action',
    sizeLabel: '2x2',
    family: 'small',
  },
  {
    id: 'small_score',
    title: 'Career Score',
    subtitle: 'Score + timing cues',
    sizeLabel: '2x2',
    family: 'small',
  },
  {
    id: 'small_energy_arc',
    title: 'Energy Arc',
    subtitle: 'Gauge-based energy',
    sizeLabel: '2x2',
    family: 'small',
  },
  {
    id: 'small_energy_value',
    title: 'Energy Value',
    subtitle: 'Numeric energy card',
    sizeLabel: '2x2',
    family: 'small',
  },
  {
    id: 'small_ring_score',
    title: 'Ring Score',
    subtitle: 'Circular score badge',
    sizeLabel: '2x2',
    family: 'small',
  },
  {
    id: 'medium_vibe',
    title: "Today's Career Vibe",
    subtitle: 'Main briefing card',
    sizeLabel: '4x2',
    family: 'medium',
  },
  {
    id: 'strip_peak',
    title: 'Peak Strip',
    subtitle: 'Vibe + peak time',
    sizeLabel: '4x1',
    family: 'strip',
  },
  {
    id: 'strip_minimal',
    title: 'Minimal Strip',
    subtitle: 'Ultra-compact strip',
    sizeLabel: '4x1',
    family: 'strip',
  },
];

export function isMorningBriefingWidgetVariantId(value: unknown): value is MorningBriefingWidgetVariantId {
  return MORNING_BRIEFING_WIDGET_VARIANTS.some((variant) => variant.id === value);
}

export function getMorningBriefingWidgetVariantOption(id: MorningBriefingWidgetVariantId) {
  return (
    MORNING_BRIEFING_WIDGET_VARIANTS.find((variant) => variant.id === id) ??
    MORNING_BRIEFING_WIDGET_VARIANTS.find((variant) => variant.id === DEFAULT_MORNING_BRIEFING_WIDGET_VARIANT) ??
    MORNING_BRIEFING_WIDGET_VARIANTS[0]
  );
}
