import type { DailyTransitResponse } from '../services/astrologyApi';

export type AiSynergyView = NonNullable<DailyTransitResponse['aiSynergy']>;

export type AiSynergyPalette = {
  scoreColor: string;
  scoreSubColor: string;
};

export function selectAiSynergyView(value: DailyTransitResponse['aiSynergy'] | null | undefined) {
  return value ?? null;
}

export function formatAiSynergyConfidenceLabel(confidence: number) {
  const value = Math.max(0, Math.min(100, Math.round(confidence)));
  if (value >= 75) return 'High signal clarity';
  if (value >= 55) return 'Moderate signal clarity';
  return 'Limited signal clarity';
}

export function resolveAiSynergyPalette(score: number): AiSynergyPalette {
  if (score >= 88) {
    return {
      scoreColor: '#00FFCC',
      scoreSubColor: 'rgba(0,255,204,0.7)',
    };
  }
  if (score >= 74) {
    return {
      scoreColor: '#38CC88',
      scoreSubColor: 'rgba(56,204,136,0.7)',
    };
  }
  return {
    scoreColor: '#C9A84C',
    scoreSubColor: 'rgba(56,204,136,0.7)',
  };
}
