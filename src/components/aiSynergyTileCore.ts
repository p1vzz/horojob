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
    summary: "Your chart and today's transit support focused AI-assisted execution.",
    description: 'Your Mercury-Uranus pattern favors prompt precision. Keep AI on repeatable tasks and retain final human judgment.',
    recommendations: [
      'Batch repetitive work into structured AI prompts.',
      'Validate high-impact outputs before shipping.',
      'Use AI for first draft, then human refinement.',
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
