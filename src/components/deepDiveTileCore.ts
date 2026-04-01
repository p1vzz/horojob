import type { FullNatalCareerAnalysisResponse } from '../services/astrologyApi';

type FullNatalAnalysis = FullNatalCareerAnalysisResponse['analysis'];

export type DeepDiveSnapshot = {
  topArchetypeName: string;
  topArchetypeScore: number;
  topRoleDomain: string;
  topRoleFitScore: number;
  keyBlindSpotTitle: string;
  executiveSummary: string;
  currentPhaseLabel: string;
  nextStep: string;
};

export const FALLBACK_DEEP_DIVE_SNAPSHOT: DeepDiveSnapshot = {
  topArchetypeName: 'Strategic Builder',
  topArchetypeScore: 82,
  topRoleDomain: 'Product & Strategy',
  topRoleFitScore: 84,
  keyBlindSpotTitle: 'Overextension risk',
  executiveSummary:
    'Your long-range path is strongest when strategy, ownership, and execution rhythm stay aligned. Use this blueprint to sequence growth and avoid overcommitment.',
  currentPhaseLabel: '0-6 months',
  nextStep: 'Define one primary 12-month career outcome in one paragraph.',
};

export function clampDeepDiveScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function formatDeepDivePercent(value: number) {
  return `${clampDeepDiveScore(value)}%`;
}

export function formatDeepDivePhaseLabel(phase: FullNatalAnalysis['phasePlan'][number]['phase'] | undefined) {
  if (phase === '0_6_months') return '0-6 months';
  if (phase === '6_18_months') return '6-18 months';
  if (phase === '18_36_months') return '18-36 months';
  return '0-6 months';
}

export function toDeepDiveSnapshot(analysis: FullNatalAnalysis): DeepDiveSnapshot {
  const topArchetype = analysis.careerArchetypes
    .slice()
    .sort((a, b) => b.score - a.score)[0];
  const topRole = analysis.roleFitMatrix
    .slice()
    .sort((a, b) => b.fitScore - a.fitScore)[0];
  const earlyPhase = analysis.phasePlan.find((item) => item.phase === '0_6_months') ?? analysis.phasePlan[0];

  return {
    topArchetypeName: topArchetype?.name ?? FALLBACK_DEEP_DIVE_SNAPSHOT.topArchetypeName,
    topArchetypeScore: clampDeepDiveScore(topArchetype?.score ?? FALLBACK_DEEP_DIVE_SNAPSHOT.topArchetypeScore),
    topRoleDomain: topRole?.domain ?? FALLBACK_DEEP_DIVE_SNAPSHOT.topRoleDomain,
    topRoleFitScore: clampDeepDiveScore(topRole?.fitScore ?? FALLBACK_DEEP_DIVE_SNAPSHOT.topRoleFitScore),
    keyBlindSpotTitle: analysis.blindSpots[0]?.title ?? FALLBACK_DEEP_DIVE_SNAPSHOT.keyBlindSpotTitle,
    executiveSummary: analysis.executiveSummary || FALLBACK_DEEP_DIVE_SNAPSHOT.executiveSummary,
    currentPhaseLabel: formatDeepDivePhaseLabel(earlyPhase?.phase),
    nextStep: analysis.next90DaysPlan[0] ?? FALLBACK_DEEP_DIVE_SNAPSHOT.nextStep,
  };
}
