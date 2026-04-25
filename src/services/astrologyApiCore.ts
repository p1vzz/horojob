import type { OnboardingData } from '../utils/onboardingStorage';
import { parseOccupationInsightResponse, type OccupationInsightResponse } from './marketApiCore';

export type BirthProfileEditLock = {
  lockedUntil: string | null;
  retryAfterSeconds: number | null;
  lockLevel: number;
  durationDays: number | null;
};

export type BirthProfileResponse = {
  profile: OnboardingData & {
    updatedAt?: string;
  };
  editLock?: BirthProfileEditLock;
};

export type CareerInsightsResponse = {
  tier: 'free' | 'premium';
  cached: boolean;
  promptVersion: string;
  model: string;
  summary: string;
  generatedAt: string;
  insights: Array<{
    title: string;
    tag: string;
    description: string;
    actions: string[];
  }>;
};

export type ScoredSignalTag = {
  group: string;
  label: string;
  score: number;
  reason: string;
};

export type LlmNarrativeStatus = 'ready' | 'pending' | 'unavailable' | 'failed';
export type LlmNarrativeFailureCode =
  | 'llm_unavailable'
  | 'llm_unconfigured'
  | 'llm_timeout'
  | 'llm_rate_limited'
  | 'llm_invalid_response'
  | 'llm_upstream_error';

export type DailyTransitResponse = {
  dateKey: string;
  cached: boolean;
  generatedAt: string;
  transit: {
    algorithmVersion?: string;
    title: string;
    modeLabel: string;
    summary: string;
    dominant: {
      planet: string;
      sign: string;
      house: number;
      retrograde: boolean;
    };
    metrics: {
      energy: number;
      focus: number;
      luck: number;
    };
    signals?: {
      positiveAspects: number;
      hardAspects: number;
      positiveAspectStrength: number;
      hardAspectStrength: number;
      dominantScore: number;
      secondaryHouse: number | null;
      secondaryHouseDensity: number;
      dignityBalance: number;
      momentum: {
        energy: number;
        focus: number;
        luck: number;
      };
    };
    tags?: ScoredSignalTag[];
    drivers?: string[];
    cautions?: string[];
  };
  meta: {
    placeName: string;
    source: 'profile_coordinates' | 'astrology_geo';
    timezone: number;
  };
  aiSynergy?: {
    algorithmVersion: string;
    dateKey: string;
    narrativeSource: 'llm' | null;
    narrativeStatus: LlmNarrativeStatus;
    narrativeFailureCode?: LlmNarrativeFailureCode | null;
    llmModel: string | null;
    llmPromptVersion: string | null;
    narrativeVariantId?: string;
    styleProfile?: string;
    score: number;
    scoreLabel: string;
    band: 'peak' | 'strong' | 'stable' | 'volatile';
    confidence: number;
    confidenceBreakdown?: {
      dataQuality: number;
      coherence: number;
      stability: number;
    };
    headline: string | null;
    summary: string | null;
    description: string | null;
    recommendations: string[];
    tags?: ScoredSignalTag[];
    drivers?: string[];
    cautions?: string[];
    actionsPriority?: string[];
    components: {
      cognitiveFlow: number;
      automationReadiness: number;
      decisionQuality: number;
      collaborationWithAI: number;
    };
    signals: {
      dominantPlanet: string;
      dominantHouse: number;
      mcSign: string | null;
      ascSign: string | null;
      positiveAspects: number;
      hardAspects: number;
      positiveAspectStrength?: number;
      hardAspectStrength?: number;
      secondaryHouse?: number | null;
      secondaryHouseDensity?: number;
      dignityBalance?: number;
      momentumScore?: number;
      natalTechnicalBias: number;
      natalCommunicationBias: number;
    };
    generatedAt: string;
  } | null;
};

export type MorningBriefingResponse = {
  dateKey: string;
  cached: boolean;
  generatedAt: string;
  schemaVersion: string;
  headline: string;
  summary: string;
  metrics: {
    energy: number;
    focus: number;
    luck: number;
    aiSynergy: number;
  };
  modeLabel: string;
  plan?: {
    headline: string;
    summary: string;
    primaryAction: string;
    peakWindow: string;
    riskGuardrail: string;
  };
  insights?: {
    vibe: {
      algorithmVersion: string;
      drivers: string[];
      cautions: string[];
      tags: ScoredSignalTag[];
    };
    aiSynergy?: {
      algorithmVersion: string;
      band: 'peak' | 'strong' | 'stable' | 'volatile';
      confidence: number;
      confidenceBreakdown: {
        dataQuality: number;
        coherence: number;
        stability: number;
      };
      drivers: string[];
      cautions: string[];
      actionsPriority: string[];
      tags: ScoredSignalTag[];
      narrativeVariantId: string;
      styleProfile: string;
    };
  };
  staleAfter: string;
  sources: {
    dailyTransitDateKey: string;
    aiSynergyDateKey: string | null;
  };
};

export type CareerVibePlanResponse = {
  dateKey: string;
  cached: boolean;
  schemaVersion: string;
  tier: 'free' | 'premium';
  narrativeSource: 'llm' | null;
  narrativeStatus: LlmNarrativeStatus;
  narrativeFailureCode?: LlmNarrativeFailureCode | null;
  model: string;
  promptVersion: string;
  generatedAt: string;
  staleAfter: string;
  modeLabel: string;
  metrics: {
    energy: number;
    focus: number;
    luck: number;
    opportunity: number;
    aiSynergy: number;
  };
  plan: {
    headline: string;
    summary: string;
    primaryAction: string;
    bestFor: string[];
    avoid: string[];
    peakWindow: string;
    focusStrategy: string;
    communicationStrategy: string;
    aiWorkStrategy: string;
    riskGuardrail: string;
  } | null;
  explanation: {
    drivers: string[];
    cautions: string[];
    metricNotes: string[];
  };
  sources: {
    dailyTransitDateKey: string;
    aiSynergyDateKey: string | null;
    dailyVibeAlgorithmVersion: string;
    aiSynergyAlgorithmVersion: string | null;
  };
};

export type MarketCareerPathGradient =
  | 'high_upside'
  | 'steady_growth'
  | 'stable_floor'
  | 'niche_path'
  | 'limited_data';

export type MarketCareerPath = {
  slug: string;
  title: string;
  domain: string;
  fitScore: number;
  fitLabel: string;
  opportunityScore: number;
  rationale: string;
  developmentVector: string;
  exampleRoles: string[];
  tags: string[];
  salaryRangeLabel: string | null;
  marketGradient: MarketCareerPathGradient;
  marketScoreLabel: OccupationInsightResponse['labels']['marketScore'] | null;
  demandLabel: OccupationInsightResponse['outlook']['demandLabel'] | null;
  sourceRoleTitle: string | null;
  market: OccupationInsightResponse | null;
};

export type NegotiationPrepGuidance = {
  title: string;
  summary: string;
  sourceRoleTitle: string | null;
  salaryRangeLabel: string | null;
  salaryVisibilityLabel: string;
  rangePositioningLabel: string;
  anchorStrategy: {
    label: string;
    target: string | null;
    explanation: string;
    talkingPoint: string;
  };
  guidance: string[];
  recruiterQuestions: string[];
  salaryExpectationScripts: Array<{
    label: string;
    script: string;
  }>;
  offerChecklist: string[];
  redFlags: string[];
  tradeoffLevers: string[];
  nextSteps: string[];
  market: OccupationInsightResponse | null;
};

export type MarketCareerContextResponse = {
  algorithmVersion: string;
  generatedAt: string;
  location: string;
  sourceNote: string;
  marketCareerPaths: MarketCareerPath[];
  negotiationPrep: NegotiationPrepGuidance;
};

export type FullNatalCareerAnalysisResponse = {
  cached: boolean;
  model: string;
  promptVersion: string;
  narrativeSource: 'llm';
  generatedAt: string;
  profileUpdatedAt?: string;
  profileChangeNotice?: {
    profileUpdatedAt: string;
    expiresAt: string;
  } | null;
  marketContext?: {
    algorithmVersion: string;
    generatedAt: string;
    location: string;
    sourceNote: string;
  } | null;
  marketCareerPaths?: MarketCareerPath[];
  analysis: {
    schemaVersion: string;
    headline: string;
    executiveSummary: string;
    careerArchetypes: Array<{
      name: string;
      score: number;
      evidence: string[];
    }>;
    strengths: Array<{
      title: string;
      details: string;
      evidence: string[];
    }>;
    blindSpots: Array<{
      title: string;
      risk: string;
      mitigation: string;
      evidence: string[];
    }>;
    roleFitMatrix: Array<{
      domain: string;
      fitScore: number;
      why: string;
      exampleRoles: string[];
    }>;
    phasePlan: Array<{
      phase: '0_6_months' | '6_18_months' | '18_36_months';
      goal: string;
      actions: string[];
      kpis: string[];
      risks: string[];
    }>;
    decisionRules: string[];
    next90DaysPlan: string[];
  };
};

export type OperationProgressStatus = 'idle' | 'running' | 'completed' | 'failed';
export type OperationProgressStageState = 'pending' | 'active' | 'complete' | 'failed';

export type OperationProgressResponse = {
  operation: string;
  status: OperationProgressStatus;
  title: string;
  subtitle: string;
  activeStageKey: string | null;
  stages: Array<{
    key: string;
    title: string;
    detail: string;
    state: OperationProgressStageState;
  }>;
  updatedAt: string | null;
  expiresAt: string | null;
};

export type AiSynergyHistoryResponse = {
  days: number;
  count: number;
  items: NonNullable<DailyTransitResponse['aiSynergy']>[];
};

export type DiscoverRoleRankingMode = 'fit' | 'opportunity';

export type DiscoverRoleDetail = {
  whyFit: {
    summary: string;
    bullets: string[];
    topTraits: string[];
  };
  realityCheck: {
    summary: string;
    tasks: string[];
    workContext: string[];
    toolThemes: string[];
  };
  entryBarrier: {
    level: 'accessible' | 'moderate' | 'specialized' | 'high';
    label: string;
    summary: string;
    signals: string[];
  };
  transitionMap: DiscoverRoleTransitionPath[];
  bestAlternative: DiscoverRoleBestAlternative | null;
};

export type DiscoverRoleDecisionRole = {
  slug: string;
  title: string;
  domain: string;
  fitScore: number;
  fitLabel: string;
  barrier: {
    level: DiscoverRoleDetail['entryBarrier']['level'];
    label: string;
  };
};

export type DiscoverRoleTransitionPath = {
  lane: 'best_match' | 'easier_entry' | 'higher_ceiling';
  label: string;
  summary: string;
  role: DiscoverRoleDecisionRole;
};

export type DiscoverRoleBestAlternative = {
  headline: string;
  summary: string;
  reasons: string[];
  role: DiscoverRoleDecisionRole;
};

export type DiscoverRolesResponse = {
  algorithmVersion: string;
  cached: boolean;
  generatedAt: string;
  rankingMode: DiscoverRoleRankingMode;
  query: string;
  context: {
    currentJob: DiscoverRoleCurrentJobContext | null;
  };
  recommended: Array<{
    slug: string;
    title: string;
    domain: string;
    score: number;
    scoreLabel: string;
    reason: string;
    tags: string[];
    source: {
      provider: 'onetonline' | 'manual';
      code: string | null;
      url: string | null;
    };
    market: OccupationInsightResponse | null;
    detail: DiscoverRoleDetail | null;
    opportunityScore: number;
  }>;
  search: Array<{
    slug: string;
    title: string;
    domain: string;
    tags: string[];
    score?: number;
    scoreLabel?: string;
    scoreStatus?: 'ready' | 'deferred';
    market: OccupationInsightResponse | null;
    detail: DiscoverRoleDetail | null;
    opportunityScore: number | null;
  }>;
  meta: {
    catalogSize: number;
    signals: string[];
  };
};

export type DiscoverRoleCurrentJobContext = {
  title: string;
  matchedRole: {
    slug: string;
    title: string;
    domain: string;
    source: {
      provider: 'onetonline' | 'manual';
      code: string | null;
      url: string | null;
    };
  } | null;
  updatedAt: string;
};

export type DiscoverRoleShortlistEntryResponse = {
  slug: string;
  role: string;
  domain: string;
  scoreLabel: string | null;
  scoreValue: number | null;
  tags: string[];
  market: OccupationInsightResponse | null;
  detail: DiscoverRoleDetail | null;
  savedAt: string;
};

export type AstrologyApiDeps = {
  authorizedFetch: (path: string, init?: AstrologyRequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

type AstrologyRequestInit = RequestInit & {
  timeoutMs?: number;
};

export const NATAL_CHART_FETCH_TIMEOUT_MS = 60_000;
export const FULL_NATAL_ANALYSIS_FETCH_TIMEOUT_MS = 120_000;

function resolveApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string') {
      return error;
    }
  }
  return fallback;
}

function resolveApiErrorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const code = (payload as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

const DISCOVER_RANKING_MODES = ['fit', 'opportunity'] as const;
const DISCOVER_SOURCE_PROVIDERS = ['onetonline', 'manual'] as const;
const MARKET_CAREER_GRADIENTS = [
  'high_upside',
  'steady_growth',
  'stable_floor',
  'niche_path',
  'limited_data',
] as const;

function parseDiscoverRolesResponse(input: unknown): DiscoverRolesResponse {
  const payload = asRecord(input);
  return {
    algorithmVersion: asString(payload?.algorithmVersion),
    cached: asBoolean(payload?.cached),
    generatedAt: asString(payload?.generatedAt),
    rankingMode: isOneOf(DISCOVER_RANKING_MODES, payload?.rankingMode) ? payload.rankingMode : 'fit',
    query: asString(payload?.query),
    context: {
      currentJob: parseDiscoverRoleCurrentJob(asRecord(payload?.context)?.currentJob),
    },
    recommended: parseDiscoverRecommended(payload?.recommended),
    search: parseDiscoverSearch(payload?.search),
    meta: {
      catalogSize: asNumber(asRecord(payload?.meta)?.catalogSize),
      signals: parseStringArray(asRecord(payload?.meta)?.signals),
    },
  };
}

function parseDiscoverRoleCurrentJob(input: unknown): DiscoverRoleCurrentJobContext | null {
  const payload = asRecord(input);
  const title = asString(payload?.title).trim();
  const updatedAt = asString(payload?.updatedAt);
  if (!title || !updatedAt) return null;

  return {
    title,
    matchedRole: parseDiscoverRoleCurrentJobMatch(payload?.matchedRole),
    updatedAt,
  };
}

function parseDiscoverRoleCurrentJobMatch(
  input: unknown,
): DiscoverRoleCurrentJobContext['matchedRole'] {
  const payload = asRecord(input);
  if (!payload) return null;

  const slug = asString(payload.slug).trim();
  const title = asString(payload.title).trim();
  const domain = asString(payload.domain).trim();
  if (!slug || !title || !domain) {
    return null;
  }

  return {
    slug,
    title,
    domain,
    source: parseDiscoverSource(payload.source),
  };
}

function parseDiscoverRoleShortlistEntry(input: unknown): DiscoverRoleShortlistEntryResponse | null {
  const payload = asRecord(input);
  if (!payload) return null;

  const slug = asString(payload.slug).trim();
  const role = asString(payload.role).trim();
  const savedAt = asString(payload.savedAt);
  if (!slug || !role || !savedAt) {
    return null;
  }

  return {
    slug,
    role,
    domain: asString(payload.domain, 'Career path'),
    scoreLabel: asNullableString(payload.scoreLabel),
    scoreValue: asNullableNumber(payload.scoreValue),
    tags: parseStringArray(payload.tags).slice(0, 6),
    market: payload.market ? parseOccupationInsightResponse(payload.market) : null,
    detail: parseDiscoverRoleDetail(payload.detail),
    savedAt,
  };
}

function parseDiscoverRoleShortlistResponse(input: unknown): DiscoverRoleShortlistEntryResponse[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => parseDiscoverRoleShortlistEntry(entry))
    .filter((entry): entry is DiscoverRoleShortlistEntryResponse => entry !== null);
}

function parseDiscoverRecommended(input: unknown): DiscoverRolesResponse['recommended'] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => {
    const role = asRecord(item);
    const score = asNumber(role?.score);
    const market = role?.market ? parseOccupationInsightResponse(role.market) : null;
    return {
      slug: asString(role?.slug),
      title: asString(role?.title),
      domain: asString(role?.domain),
      score,
      scoreLabel: asString(role?.scoreLabel, `${score}%`),
      reason: asString(role?.reason),
      tags: parseStringArray(role?.tags),
      source: parseDiscoverSource(role?.source),
      market,
      detail: parseDiscoverRoleDetail(role?.detail),
      opportunityScore: asNumber(role?.opportunityScore, score),
    };
  });
}

function parseDiscoverSearch(input: unknown): DiscoverRolesResponse['search'] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => {
    const role = asRecord(item);
    const score = asOptionalNumber(role?.score);
    const market = role?.market ? parseOccupationInsightResponse(role.market) : null;
    return {
      slug: asString(role?.slug),
      title: asString(role?.title),
      domain: asString(role?.domain),
      tags: parseStringArray(role?.tags),
      ...(score !== undefined ? { score } : {}),
      ...(typeof role?.scoreLabel === 'string' ? { scoreLabel: role.scoreLabel } : {}),
      scoreStatus: role?.scoreStatus === 'ready' || role?.scoreStatus === 'deferred' ? role.scoreStatus : 'ready',
      market,
      detail: parseDiscoverRoleDetail(role?.detail),
      opportunityScore: asNullableNumber(role?.opportunityScore),
    };
  });
}

const DISCOVER_ENTRY_BARRIER_LEVELS = ['accessible', 'moderate', 'specialized', 'high'] as const;
const DISCOVER_TRANSITION_LANES = ['best_match', 'easier_entry', 'higher_ceiling'] as const;

function parseDiscoverRoleDetail(input: unknown): DiscoverRoleDetail | null {
  const payload = asRecord(input);
  if (!payload) return null;

  const whyFit = asRecord(payload.whyFit);
  const realityCheck = asRecord(payload.realityCheck);
  const entryBarrier = asRecord(payload.entryBarrier);
  if (!whyFit || !realityCheck || !entryBarrier) {
    return null;
  }

  const whySummary = asString(whyFit.summary).trim();
  const realitySummary = asString(realityCheck.summary).trim();
  const barrierLabel = asString(entryBarrier.label).trim();
  const barrierSummary = asString(entryBarrier.summary).trim();
  const barrierLevel = isOneOf(DISCOVER_ENTRY_BARRIER_LEVELS, entryBarrier.level)
    ? entryBarrier.level
    : null;
  if (!whySummary || !realitySummary || !barrierLabel || !barrierSummary || !barrierLevel) {
    return null;
  }

  return {
    whyFit: {
      summary: whySummary,
      bullets: parseStringArray(whyFit.bullets).slice(0, 4),
      topTraits: parseStringArray(whyFit.topTraits).slice(0, 4),
    },
    realityCheck: {
      summary: realitySummary,
      tasks: parseStringArray(realityCheck.tasks).slice(0, 4),
      workContext: parseStringArray(realityCheck.workContext).slice(0, 4),
      toolThemes: parseStringArray(realityCheck.toolThemes).slice(0, 4),
    },
    entryBarrier: {
      level: barrierLevel,
      label: barrierLabel,
      summary: barrierSummary,
      signals: parseStringArray(entryBarrier.signals).slice(0, 4),
    },
    transitionMap: parseDiscoverRoleTransitionMap(payload.transitionMap),
    bestAlternative: parseDiscoverRoleBestAlternative(payload.bestAlternative),
  };
}

function parseDiscoverRoleTransitionMap(input: unknown): DiscoverRoleTransitionPath[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const row = asRecord(item);
      const lane = isOneOf(DISCOVER_TRANSITION_LANES, row?.lane) ? row.lane : null;
      const label = asString(row?.label).trim();
      const summary = asString(row?.summary).trim();
      const role = parseDiscoverRoleDecisionRole(row?.role);
      if (!lane || !label || !summary || !role) {
        return null;
      }
      return {
        lane,
        label,
        summary,
        role,
      };
    })
    .filter((item): item is DiscoverRoleTransitionPath => item !== null)
    .slice(0, 3);
}

function parseDiscoverRoleBestAlternative(input: unknown): DiscoverRoleBestAlternative | null {
  const row = asRecord(input);
  if (!row) return null;
  const headline = asString(row.headline).trim();
  const summary = asString(row.summary).trim();
  const role = parseDiscoverRoleDecisionRole(row.role);
  if (!headline || !summary || !role) {
    return null;
  }

  return {
    headline,
    summary,
    reasons: parseStringArray(row.reasons).slice(0, 4),
    role,
  };
}

function parseDiscoverRoleDecisionRole(input: unknown): DiscoverRoleDecisionRole | null {
  const row = asRecord(input);
  const barrier = asRecord(row?.barrier);
  if (!row || !barrier) return null;

  const slug = asString(row.slug).trim();
  const title = asString(row.title).trim();
  const domain = asString(row.domain).trim();
  const fitScore = asNumber(row.fitScore);
  const fitLabel = asString(row.fitLabel).trim();
  const barrierLevel = isOneOf(DISCOVER_ENTRY_BARRIER_LEVELS, barrier.level)
    ? barrier.level
    : null;
  const barrierLabel = asString(barrier.label).trim();
  if (!slug || !title || !domain || !fitLabel || !barrierLevel || !barrierLabel) {
    return null;
  }

  return {
    slug,
    title,
    domain,
    fitScore,
    fitLabel,
    barrier: {
      level: barrierLevel,
      label: barrierLabel,
    },
  };
}

function parseDiscoverSource(input: unknown): DiscoverRolesResponse['recommended'][number]['source'] {
  const source = asRecord(input);
  return {
    provider: isOneOf(DISCOVER_SOURCE_PROVIDERS, source?.provider) ? source.provider : 'manual',
    code: asNullableString(source?.code),
    url: asNullableString(source?.url),
  };
}

export function parseMarketCareerContextResponse(input: unknown): MarketCareerContextResponse {
  const payload = asRecord(input);
  return {
    algorithmVersion: asString(payload?.algorithmVersion),
    generatedAt: asString(payload?.generatedAt),
    location: asString(payload?.location, 'US'),
    sourceNote: asString(payload?.sourceNote),
    marketCareerPaths: parseMarketCareerPaths(payload?.marketCareerPaths),
    negotiationPrep: parseNegotiationPrep(payload?.negotiationPrep),
  };
}

function parseMarketCareerPaths(input: unknown): MarketCareerPath[] {
  if (!Array.isArray(input)) return [];
  return input.map(parseMarketCareerPath).filter((path): path is MarketCareerPath => path !== null);
}

function parseMarketCareerPath(input: unknown): MarketCareerPath | null {
  const path = asRecord(input);
  const title = asString(path?.title);
  if (!title) return null;
  const market = path?.market ? parseOccupationInsightResponse(path.market) : null;
  const score = asNumber(path?.fitScore);
  return {
    slug: asString(path?.slug),
    title,
    domain: asString(path?.domain),
    fitScore: score,
    fitLabel: asString(path?.fitLabel, `${score}% fit`),
    opportunityScore: asNumber(path?.opportunityScore),
    rationale: asString(path?.rationale),
    developmentVector: asString(path?.developmentVector),
    exampleRoles: parseStringArray(path?.exampleRoles),
    tags: parseStringArray(path?.tags),
    salaryRangeLabel: asNullableString(path?.salaryRangeLabel),
    marketGradient: isOneOf(MARKET_CAREER_GRADIENTS, path?.marketGradient)
      ? path.marketGradient
      : 'limited_data',
    marketScoreLabel: market?.labels.marketScore ?? null,
    demandLabel: market?.outlook.demandLabel ?? null,
    sourceRoleTitle: asNullableString(path?.sourceRoleTitle),
    market,
  };
}

function parseNegotiationPrep(input: unknown): NegotiationPrepGuidance {
  const prep = asRecord(input);
  const market = prep?.market ? parseOccupationInsightResponse(prep.market) : null;
  const anchorStrategy = asRecord(prep?.anchorStrategy);
  return {
    title: asString(prep?.title, 'Negotiation Prep'),
    summary: asString(prep?.summary, 'Use market context to prepare your compensation conversation.'),
    sourceRoleTitle: asNullableString(prep?.sourceRoleTitle),
    salaryRangeLabel: asNullableString(prep?.salaryRangeLabel),
    salaryVisibilityLabel: asString(prep?.salaryVisibilityLabel, 'Range unavailable'),
    rangePositioningLabel: asString(prep?.rangePositioningLabel, 'Ask for the budgeted range before naming a number.'),
    anchorStrategy: {
      label: asString(anchorStrategy?.label, 'Range discovery'),
      target: asNullableString(anchorStrategy?.target),
      explanation: asString(anchorStrategy?.explanation, 'Use role scope and market context before naming a number.'),
      talkingPoint: asString(anchorStrategy?.talkingPoint, 'Could you share the budgeted range for this role?'),
    },
    guidance: parseStringArray(prep?.guidance),
    recruiterQuestions: parseStringArray(prep?.recruiterQuestions),
    salaryExpectationScripts: parseNegotiationScripts(prep?.salaryExpectationScripts),
    offerChecklist: parseStringArray(prep?.offerChecklist),
    redFlags: parseStringArray(prep?.redFlags),
    tradeoffLevers: parseStringArray(prep?.tradeoffLevers),
    nextSteps: parseStringArray(prep?.nextSteps),
    market,
  };
}

function parseNegotiationScripts(input: unknown): NegotiationPrepGuidance['salaryExpectationScripts'] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const script = asRecord(item);
      const label = asString(script?.label);
      const body = asString(script?.script);
      if (!label || !body) return null;
      return {
        label,
        script: body,
      };
    })
    .filter((item): item is NegotiationPrepGuidance['salaryExpectationScripts'][number] => item !== null);
}

function parseMarketContextSummary(input: unknown): FullNatalCareerAnalysisResponse['marketContext'] {
  const summary = asRecord(input);
  if (!summary) return null;
  return {
    algorithmVersion: asString(summary.algorithmVersion),
    generatedAt: asString(summary.generatedAt),
    location: asString(summary.location, 'US'),
    sourceNote: asString(summary.sourceNote),
  };
}

function parseFullNatalCareerAnalysisResponse(input: unknown): FullNatalCareerAnalysisResponse {
  const payload = asRecord(input);
  const base = input as FullNatalCareerAnalysisResponse;
  return {
    ...base,
    marketContext: parseMarketContextSummary(payload?.marketContext),
    marketCareerPaths: parseMarketCareerPaths(payload?.marketCareerPaths),
  };
}

function parseStringArray(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === 'string');
}

function asRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown, fallback = '') {
  return typeof input === 'string' ? input : fallback;
}

function asNumber(input: unknown, fallback = 0) {
  return typeof input === 'number' && Number.isFinite(input) ? input : fallback;
}

function asOptionalNumber(input: unknown) {
  return typeof input === 'number' && Number.isFinite(input) ? input : undefined;
}

function asNullableNumber(input: unknown) {
  return typeof input === 'number' && Number.isFinite(input) ? input : null;
}

function asNullableString(input: unknown) {
  return typeof input === 'string' ? input : null;
}

function asBoolean(input: unknown, fallback = false) {
  return typeof input === 'boolean' ? input : fallback;
}

function isOneOf<const TValues extends readonly string[]>(values: TValues, input: unknown): input is TValues[number] {
  return typeof input === 'string' && values.includes(input as TValues[number]);
}

export function createAstrologyApi(deps: AstrologyApiDeps) {
  const fetchBirthProfile = async () => {
    const response = await deps.authorizedFetch('/api/astrology/birth-profile');
    const payload = await deps.parseJsonBody(response);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch birth profile', payload);
    }
    return payload as BirthProfileResponse;
  };

  const upsertBirthProfile = async (input: OnboardingData) => {
    const response = await deps.authorizedFetch('/api/astrology/birth-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to save birth profile', payload);
    }
    return payload as BirthProfileResponse;
  };

  const fetchNatalChart = async (input?: OnboardingData) => {
    const request: AstrologyRequestInit = {
      method: 'POST',
      timeoutMs: NATAL_CHART_FETCH_TIMEOUT_MS,
    };

    if (input) {
      request.headers = { 'Content-Type': 'application/json' };
      request.body = JSON.stringify(input);
    }

    const response = await deps.authorizedFetch('/api/astrology/natal-chart', request);
    const payload = await deps.parseJsonBody(response);

    if (!response.ok) {
      throw new deps.ApiError(response.status, resolveApiErrorMessage(payload, 'Failed to load natal chart'), payload);
    }

    return payload as {
      chart?: unknown;
      meta?: unknown;
    };
  };

  const fetchCareerInsights = async (options?: { tier?: 'free' | 'premium'; regenerate?: boolean }) => {
    const tier = options?.tier ?? 'free';
    const regenerate = options?.regenerate ?? false;
    const response = await deps.authorizedFetch(
      `/api/astrology/career-insights?tier=${encodeURIComponent(tier)}&regenerate=${regenerate ? 'true' : 'false'}`
    );
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch career insights', payload);
    }
    return payload as CareerInsightsResponse;
  };

  const fetchMarketCareerContext = async () => {
    const response = await deps.authorizedFetch('/api/astrology/market-career-context');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch market career context'),
        payload
      );
    }
    return parseMarketCareerContextResponse(payload);
  };

  const fetchDailyTransit = async (options?: { includeAiSynergy?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.includeAiSynergy) {
      params.set('includeAiSynergy', 'true');
    }
    const query = params.toString();
    const response = await deps.authorizedFetch(`/api/astrology/daily-transit${query ? `?${query}` : ''}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch daily transit', payload);
    }
    return payload as DailyTransitResponse;
  };

  const fetchMorningBriefing = async (options?: { refresh?: boolean }) => {
    const params = new URLSearchParams({
      refresh: options?.refresh ? 'true' : 'false',
    });
    const response = await deps.authorizedFetch(`/api/astrology/morning-briefing?${params.toString()}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch morning briefing'),
        payload
      );
    }
    return payload as MorningBriefingResponse;
  };

  const fetchCareerVibePlan = async (options?: { refresh?: boolean }) => {
    const params = new URLSearchParams({
      refresh: options?.refresh ? 'true' : 'false',
    });
    const response = await deps.authorizedFetch(`/api/astrology/career-vibe-plan?${params.toString()}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch career vibe plan'),
        payload
      );
    }
    return payload as CareerVibePlanResponse;
  };

  const fetchFullNatalCareerAnalysis = async () => {
    const response = await deps.authorizedFetch('/api/astrology/full-natal-analysis', {
      timeoutMs: FULL_NATAL_ANALYSIS_FETCH_TIMEOUT_MS,
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch full natal analysis'),
        payload
      );
    }
    return parseFullNatalCareerAnalysisResponse(payload);
  };

  const fetchFullNatalCareerAnalysisProgress = async () => {
    const response = await deps.authorizedFetch('/api/astrology/full-natal-analysis/progress');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch full natal analysis progress'),
        payload
      );
    }
    return payload as OperationProgressResponse;
  };

  const fetchCachedFullNatalCareerAnalysis = async () => {
    const params = new URLSearchParams({
      cacheOnly: 'true',
    });
    const response = await deps.authorizedFetch(`/api/astrology/full-natal-analysis?${params.toString()}`, {
      timeoutMs: FULL_NATAL_ANALYSIS_FETCH_TIMEOUT_MS,
    });
    const payload = await deps.parseJsonBody(response);
    if (response.status === 404 && resolveApiErrorCode(payload) === 'full_natal_analysis_not_ready') {
      return null;
    }
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch full natal analysis'),
        payload
      );
    }
    return parseFullNatalCareerAnalysisResponse(payload);
  };

  const fetchAiSynergyHistory = async (options?: { days?: number; limit?: number }) => {
    const params = new URLSearchParams({
      days: String(options?.days ?? 30),
      limit: String(options?.limit ?? 30),
    });
    const response = await deps.authorizedFetch(`/api/astrology/ai-synergy/history?${params.toString()}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch AI synergy history'),
        payload
      );
    }
    return payload as AiSynergyHistoryResponse;
  };

  const fetchDiscoverRoles = async (options?: {
    query?: string;
    limit?: number;
    searchLimit?: number;
    refresh?: boolean;
    deferSearchScores?: boolean;
    scoreSlug?: string;
    rankingMode?: DiscoverRoleRankingMode;
  }) => {
    const query = (options?.query ?? '').trim();
    const params = new URLSearchParams({
      query,
      limit: String(options?.limit ?? 5),
      searchLimit: String(options?.searchLimit ?? 20),
      refresh: options?.refresh ? 'true' : 'false',
      deferSearchScores: options?.deferSearchScores ? 'true' : 'false',
      rankingMode: options?.rankingMode ?? 'fit',
    });
    const scoreSlug = (options?.scoreSlug ?? '').trim();
    if (scoreSlug) {
      params.set('scoreSlug', scoreSlug);
    }

    const response = await deps.authorizedFetch(`/api/astrology/discover-roles?${params.toString()}`);
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, resolveApiErrorMessage(payload, 'Failed to fetch discover roles'), payload);
    }
    return parseDiscoverRolesResponse(payload);
  };

  const fetchDiscoverRoleCurrentJob = async () => {
    const response = await deps.authorizedFetch('/api/astrology/discover-roles/current-job');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch discover role current job'),
        payload,
      );
    }
    return parseDiscoverRoleCurrentJob(asRecord(payload)?.currentJob);
  };

  const upsertDiscoverRoleCurrentJob = async (title: string) => {
    const response = await deps.authorizedFetch('/api/astrology/discover-roles/current-job', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to save discover role current job'),
        payload,
      );
    }
    return parseDiscoverRoleCurrentJob(asRecord(payload)?.currentJob);
  };

  const deleteDiscoverRoleCurrentJob = async () => {
    const response = await deps.authorizedFetch('/api/astrology/discover-roles/current-job', {
      method: 'DELETE',
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to clear discover role current job'),
        payload,
      );
    }
    return parseDiscoverRoleCurrentJob(asRecord(payload)?.currentJob);
  };

  const fetchDiscoverRoleShortlist = async () => {
    const response = await deps.authorizedFetch('/api/astrology/discover-roles/shortlist');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to fetch discover role shortlist'),
        payload
      );
    }
    return parseDiscoverRoleShortlistResponse(payload);
  };

  const upsertDiscoverRoleShortlistEntry = async (input: {
    slug: string;
    role: string;
    domain: string;
    scoreLabel: string | null;
    scoreValue: number | null;
    tags: string[];
    market: OccupationInsightResponse | null;
    detail: DiscoverRoleDetail | null;
    savedAt?: string;
  }) => {
    const slug = input.slug.trim();
    const response = await deps.authorizedFetch(`/api/astrology/discover-roles/shortlist/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: input.role,
        domain: input.domain,
        scoreLabel: input.scoreLabel,
        scoreValue: input.scoreValue,
        tags: input.tags,
        market: input.market,
        detail: input.detail,
        ...(input.savedAt ? { savedAt: input.savedAt } : {}),
      }),
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to save discover role shortlist entry'),
        payload
      );
    }
    const entry = parseDiscoverRoleShortlistEntry(payload);
    if (!entry) {
      throw new deps.ApiError(502, 'Invalid discover role shortlist response', payload);
    }
    return entry;
  };

  const deleteDiscoverRoleShortlistEntry = async (slug: string) => {
    const normalizedSlug = slug.trim();
    const response = await deps.authorizedFetch(
      `/api/astrology/discover-roles/shortlist/${encodeURIComponent(normalizedSlug)}`,
      { method: 'DELETE' }
    );
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(
        response.status,
        resolveApiErrorMessage(payload, 'Failed to remove discover role shortlist entry'),
        payload
      );
    }
    return {
      deleted: asBoolean(asRecord(payload)?.deleted),
      slug: asString(asRecord(payload)?.slug, normalizedSlug),
    };
  };

  return {
    fetchBirthProfile,
    upsertBirthProfile,
    fetchNatalChart,
    fetchCareerInsights,
    fetchMarketCareerContext,
    fetchDailyTransit,
    fetchMorningBriefing,
    fetchCareerVibePlan,
    fetchFullNatalCareerAnalysis,
    fetchFullNatalCareerAnalysisProgress,
    fetchCachedFullNatalCareerAnalysis,
    fetchAiSynergyHistory,
    fetchDiscoverRoles,
    fetchDiscoverRoleCurrentJob,
    upsertDiscoverRoleCurrentJob,
    deleteDiscoverRoleCurrentJob,
    fetchDiscoverRoleShortlist,
    upsertDiscoverRoleShortlistEntry,
    deleteDiscoverRoleShortlistEntry,
  };
}
