import type { DailyTransitResponse } from '../services/astrologyApi';

export type AiSynergyView = NonNullable<DailyTransitResponse['aiSynergy']>;

export type AiSynergyPalette = {
  scoreColor: string;
  scoreSubColor: string;
};

export function createFallbackAiSynergy(generatedAt = new Date().toISOString()): AiSynergyView {
  return {
    algorithmVersion: 'fallback',
    dateKey: '',
    narrativeSource: 'template',
    llmModel: null,
    llmPromptVersion: null,
    score: 92,
    scoreLabel: '92%',
    band: 'strong',
    confidence: 72,
    headline: 'Strong AI collaboration day',
    summary: 'Today supports focused AI-assisted execution.',
    description: 'Use AI for structured drafting, summarizing, and repetitive decisions. Keep final judgment on high-impact work.',
    recommendations: [
      'Turn one repetitive workflow into a structured prompt.',
      'Use AI for first drafts, then review the final output yourself.',
      'Keep vague strategy calls human-led today.',
    ],
    components: {
      cognitiveFlow: 90,
      automationReadiness: 93,
      decisionQuality: 86,
      collaborationWithAI: 88,
    },
    signals: {
      dominantPlanet: 'Mercury',
      dominantHouse: 10,
      mcSign: null,
      ascSign: null,
      positiveAspects: 3,
      hardAspects: 1,
      natalTechnicalBias: 78,
      natalCommunicationBias: 81,
    },
    generatedAt,
  };
}

export const FALLBACK_AI_SYNERGY = createFallbackAiSynergy();

export function selectAiSynergyView(value: DailyTransitResponse['aiSynergy'] | null | undefined) {
  return value ?? FALLBACK_AI_SYNERGY;
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
