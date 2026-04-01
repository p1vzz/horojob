import assert from 'node:assert/strict';
import test from 'node:test';
import type { FullNatalCareerAnalysisResponse } from '../services/astrologyApi';
import {
  FALLBACK_DEEP_DIVE_SNAPSHOT,
  clampDeepDiveScore,
  formatDeepDivePercent,
  formatDeepDivePhaseLabel,
  toDeepDiveSnapshot,
} from './deepDiveTileCore';

type FullNatalAnalysis = FullNatalCareerAnalysisResponse['analysis'];

function createAnalysis(
  partial?: Partial<FullNatalAnalysis>
): FullNatalAnalysis {
  return {
    schemaVersion: 'v1',
    headline: 'Career blueprint',
    executiveSummary: partial?.executiveSummary ?? 'Custom executive summary',
    careerArchetypes: partial?.careerArchetypes ?? [
      { name: 'Strategic Operator', score: 76, evidence: [] },
      { name: 'Systems Architect', score: 91, evidence: [] },
    ],
    strengths: partial?.strengths ?? [],
    blindSpots: partial?.blindSpots ?? [
      {
        title: 'Diffused focus',
        risk: 'Fragmented priorities reduce momentum.',
        mitigation: 'Constrain current bets to one main career lane.',
        evidence: [],
      },
    ],
    roleFitMatrix: partial?.roleFitMatrix ?? [
      { domain: 'Operations', fitScore: 71, why: 'Execution-heavy fit.', exampleRoles: [] },
      { domain: 'AI Product', fitScore: 94, why: 'Best strategic alignment.', exampleRoles: [] },
    ],
    phasePlan: partial?.phasePlan ?? [
      {
        phase: '6_18_months',
        goal: 'Build leverage in strategic execution.',
        actions: [],
        kpis: [],
        risks: [],
      },
      {
        phase: '0_6_months',
        goal: 'Ship first positioning move.',
        actions: [],
        kpis: [],
        risks: [],
      },
    ],
    decisionRules: partial?.decisionRules ?? [],
    next90DaysPlan: partial?.next90DaysPlan ?? ['Ship one concrete growth experiment'],
  };
}

test('deep dive tile core clamps and formats scores', () => {
  assert.equal(clampDeepDiveScore(-4), 0);
  assert.equal(clampDeepDiveScore(81.6), 82);
  assert.equal(clampDeepDiveScore(120), 100);
  assert.equal(formatDeepDivePercent(81.6), '82%');
});

test('deep dive tile core formats phase labels with fallback', () => {
  assert.equal(formatDeepDivePhaseLabel('0_6_months'), '0-6 months');
  assert.equal(formatDeepDivePhaseLabel('6_18_months'), '6-18 months');
  assert.equal(formatDeepDivePhaseLabel('18_36_months'), '18-36 months');
  assert.equal(formatDeepDivePhaseLabel(undefined), '0-6 months');
});

test('deep dive tile core maps analysis into snapshot', () => {
  const snapshot = toDeepDiveSnapshot(createAnalysis());

  assert.deepEqual(snapshot, {
    topArchetypeName: 'Systems Architect',
    topArchetypeScore: 91,
    topRoleDomain: 'AI Product',
    topRoleFitScore: 94,
    keyBlindSpotTitle: 'Diffused focus',
    executiveSummary: 'Custom executive summary',
    currentPhaseLabel: '0-6 months',
    nextStep: 'Ship one concrete growth experiment',
  });
});

test('deep dive tile core falls back when analysis fields are sparse', () => {
  const snapshot = toDeepDiveSnapshot(
    createAnalysis({
      executiveSummary: '',
      careerArchetypes: [],
      roleFitMatrix: [],
      blindSpots: [],
      phasePlan: [],
      next90DaysPlan: [],
    })
  );

  assert.deepEqual(snapshot, FALLBACK_DEEP_DIVE_SNAPSHOT);
});
