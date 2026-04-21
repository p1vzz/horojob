import type { OnboardingData } from '../utils/onboardingStorage';

export type BirthProfileResponse = {
  profile: OnboardingData & {
    updatedAt?: string;
  };
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

export type DiscoverRolesResponse = {
  algorithmVersion: string;
  cached: boolean;
  generatedAt: string;
  query: string;
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
  }>;
  search: Array<{
    slug: string;
    title: string;
    domain: string;
    tags: string[];
    score?: number;
    scoreLabel?: string;
    scoreStatus?: 'ready' | 'deferred';
  }>;
  meta: {
    catalogSize: number;
    signals: string[];
  };
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

  const fetchDailyTransit = async () => {
    const response = await deps.authorizedFetch('/api/astrology/daily-transit');
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
    return payload as FullNatalCareerAnalysisResponse;
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
    return payload as FullNatalCareerAnalysisResponse;
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
  }) => {
    const query = (options?.query ?? '').trim();
    const params = new URLSearchParams({
      query,
      limit: String(options?.limit ?? 5),
      searchLimit: String(options?.searchLimit ?? 20),
      refresh: options?.refresh ? 'true' : 'false',
      deferSearchScores: options?.deferSearchScores ? 'true' : 'false',
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
    return payload as DiscoverRolesResponse;
  };

  return {
    fetchBirthProfile,
    upsertBirthProfile,
    fetchNatalChart,
    fetchCareerInsights,
    fetchDailyTransit,
    fetchMorningBriefing,
    fetchCareerVibePlan,
    fetchFullNatalCareerAnalysis,
    fetchFullNatalCareerAnalysisProgress,
    fetchCachedFullNatalCareerAnalysis,
    fetchAiSynergyHistory,
    fetchDiscoverRoles,
  };
}
