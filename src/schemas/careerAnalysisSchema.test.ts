import assert from 'node:assert/strict';
import test from 'node:test';
import { FullNatalCareerAnalysisResponseSchema } from './careerAnalysisSchema';

test('full natal career analysis schema accepts current route payload', () => {
  const payload = FullNatalCareerAnalysisResponseSchema.parse({
    cached: false,
    model: 'gpt-4o-mini',
    promptVersion: 'v1',
    narrativeSource: 'llm',
    generatedAt: '2026-03-20T12:00:00.000Z',
    profileUpdatedAt: '2026-03-20T11:00:00.000Z',
    profileChangeNotice: {
      profileUpdatedAt: '2026-03-20T11:00:00.000Z',
      expiresAt: '2026-03-23T11:00:00.000Z',
    },
    analysis: {
      schemaVersion: 'full_natal_analysis.v1',
      headline: 'Full Natal Career Blueprint',
      executiveSummary: 'A practical blueprint for role selection, growth sequencing, and sustainable execution.',
      careerArchetypes: [
        { name: 'Strategic Builder', score: 82, evidence: ['Mercury in Virgo, house 10'] },
        { name: 'Systems Thinker', score: 78, evidence: ['Mercury-Saturn trine'] },
        { name: 'Execution Optimizer', score: 76, evidence: ['Sun in Libra, house 11'] },
      ],
      strengths: [
        { title: 'Planning', details: 'Structured planning strength.', evidence: ['Mercury in Virgo'] },
        { title: 'Learning', details: 'Fast learning under complexity.', evidence: ['Saturn aspect'] },
        { title: 'Delivery', details: 'High ownership in delivery.', evidence: ['10th house signal'] },
        { title: 'Calibration', details: 'Strong review cadence.', evidence: ['Earth emphasis'] },
      ],
      blindSpots: [
        {
          title: 'Overextension',
          risk: 'Too many parallel initiatives can dilute impact.',
          mitigation: 'Prioritize one quarterly objective.',
          evidence: ['Mutable emphasis'],
        },
        {
          title: 'Speed',
          risk: 'Fast execution can hide assumptions.',
          mitigation: 'Use short decision memos.',
          evidence: ['Mercury signal'],
        },
        {
          title: 'Mismatch',
          risk: 'Unclear ownership can reduce performance.',
          mitigation: 'Validate mandate clarity early.',
          evidence: ['10th house signal'],
        },
      ],
      roleFitMatrix: [
        { domain: 'Product', fitScore: 84, why: 'Systems thinking and prioritization.', exampleRoles: ['PM', 'Program Lead'] },
        { domain: 'Operations', fitScore: 80, why: 'Repeatable execution.', exampleRoles: ['Ops Manager', 'Delivery Lead'] },
        { domain: 'Data', fitScore: 77, why: 'Evidence-backed decisions.', exampleRoles: ['BI Lead', 'Analyst'] },
        { domain: 'Consulting', fitScore: 75, why: 'Diagnosis and advisory work.', exampleRoles: ['Consultant', 'Advisor'] },
        { domain: 'Leadership', fitScore: 73, why: 'Goal-oriented team ownership.', exampleRoles: ['Team Lead', 'Director'] },
      ],
      phasePlan: [
        {
          phase: '0_6_months',
          goal: 'Stabilize direction.',
          actions: ['Define target role', 'Set skill roadmap'],
          kpis: ['Two artifacts shipped'],
          risks: ['Scope drift'],
        },
        {
          phase: '6_18_months',
          goal: 'Scale ownership.',
          actions: ['Lead visible initiative', 'Negotiate scope'],
          kpis: ['Initiative delivered'],
          risks: ['Burnout'],
        },
        {
          phase: '18_36_months',
          goal: 'Consolidate leadership.',
          actions: ['Select specialization', 'Build mentorship system'],
          kpis: ['Scope expansion'],
          risks: ['Identity lock-in'],
        },
      ],
      decisionRules: ['Choose scope before title.'],
      next90DaysPlan: ['Define your primary 12-month career outcome.'],
    },
  });

  assert.equal(payload.narrativeSource, 'llm');
  assert.equal(payload.profileChangeNotice?.profileUpdatedAt, '2026-03-20T11:00:00.000Z');
  assert.equal(payload.analysis.phasePlan[0]?.phase, '0_6_months');
  assert.equal(payload.analysis.roleFitMatrix.length, 5);
});

test('full natal career analysis schema rejects legacy template fallback reports', () => {
  const parsed = FullNatalCareerAnalysisResponseSchema.safeParse({
    cached: true,
    model: 'gpt-4o-mini',
    promptVersion: 'v1',
    narrativeSource: 'template',
    generatedAt: '2026-03-20T12:00:00.000Z',
    analysis: {
      schemaVersion: 'full_natal_analysis.v1',
      headline: 'Full Natal Career Blueprint',
      executiveSummary: 'A practical blueprint for role selection, growth sequencing, and sustainable execution.',
      careerArchetypes: [],
      strengths: [],
      blindSpots: [],
      roleFitMatrix: [],
      phasePlan: [],
      decisionRules: [],
      next90DaysPlan: [],
    },
  });

  assert.equal(parsed.success, false);
});
