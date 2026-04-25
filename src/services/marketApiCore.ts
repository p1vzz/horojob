type MarketRequestInit = RequestInit & {
  timeoutMs?: number;
};

export const MARKET_OCCUPATION_INSIGHT_TIMEOUT_MS = 10_000;

export type MarketSourceProvider = 'careeronestop' | 'onet';

export type MarketSource = {
  provider: MarketSourceProvider;
  label: string;
  url: string | null;
  retrievedAt: string;
  attributionText: string;
  logoRequired: boolean;
};

export type MarketSalaryRange = {
  currency: 'USD';
  period: 'annual' | 'hourly';
  min: number | null;
  max: number | null;
  median: number | null;
  year: string | null;
  confidence: 'high' | 'medium' | 'low';
  basis: 'posted_salary' | 'market_estimate';
};

export type MarketSkillCategory = 'skill' | 'knowledge' | 'tool' | 'technology' | 'ability' | 'unknown';

export type OccupationInsightResponse = {
  query: {
    keyword: string;
    location: string;
  };
  occupation: {
    onetCode: string | null;
    socCode: string | null;
    title: string;
    description: string | null;
    matchConfidence: 'high' | 'medium' | 'low';
  };
  salary: MarketSalaryRange | null;
  outlook: {
    growthLabel: string | null;
    projectedOpenings: number | null;
    projectionYears: string | null;
    demandLabel: 'high' | 'moderate' | 'low' | 'unknown';
  };
  skills: Array<{
    name: string;
    category: MarketSkillCategory;
    sourceProvider: MarketSourceProvider;
  }>;
  labels: {
    marketScore: 'strong market' | 'steady market' | 'niche market' | 'limited data';
    salaryVisibility: 'posted' | 'not_disclosed' | 'market_estimate' | 'unavailable';
  };
  sources: MarketSource[];
};

export type OccupationInsightRequest = {
  keyword: string;
  location?: string;
  refresh?: boolean;
};

export type MarketApiDeps = {
  authorizedFetch: (path: string, init?: MarketRequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

const SOURCE_PROVIDERS = ['careeronestop', 'onet'] as const;
const SALARY_PERIODS = ['annual', 'hourly'] as const;
const SALARY_CONFIDENCE = ['high', 'medium', 'low'] as const;
const SALARY_BASIS = ['posted_salary', 'market_estimate'] as const;
const SKILL_CATEGORIES = ['skill', 'knowledge', 'tool', 'technology', 'ability', 'unknown'] as const;
const MATCH_CONFIDENCE = ['high', 'medium', 'low'] as const;
const DEMAND_LABELS = ['high', 'moderate', 'low', 'unknown'] as const;
const MARKET_SCORES = ['strong market', 'steady market', 'niche market', 'limited data'] as const;
const SALARY_VISIBILITY = ['posted', 'not_disclosed', 'market_estimate', 'unavailable'] as const;

export function createMarketApi(deps: MarketApiDeps) {
  const fetchOccupationInsight = async (input: OccupationInsightRequest) => {
    const query = new URLSearchParams({
      keyword: input.keyword,
      location: input.location ?? 'US',
    });
    if (input.refresh) query.set('refresh', 'true');

    const response = await deps.authorizedFetch(`/api/market/occupation-insight?${query.toString()}`, {
      timeoutMs: MARKET_OCCUPATION_INSIGHT_TIMEOUT_MS,
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch market occupation insight', payload);
    }
    return parseOccupationInsightResponse(payload);
  };

  return {
    fetchOccupationInsight,
  };
}

export function parseOccupationInsightResponse(input: unknown): OccupationInsightResponse {
  const payload = asRecord(input);
  const query = asRecord(payload?.query);
  const occupation = asRecord(payload?.occupation);
  const outlook = asRecord(payload?.outlook);
  const labels = asRecord(payload?.labels);

  return {
    query: {
      keyword: asString(query?.keyword),
      location: asString(query?.location, 'US'),
    },
    occupation: {
      onetCode: asNullableString(occupation?.onetCode),
      socCode: asNullableString(occupation?.socCode),
      title: asString(occupation?.title, 'Occupation unavailable'),
      description: asNullableString(occupation?.description),
      matchConfidence: isOneOf(MATCH_CONFIDENCE, occupation?.matchConfidence)
        ? occupation.matchConfidence
        : 'low',
    },
    salary: parseSalary(payload?.salary),
    outlook: {
      growthLabel: asNullableString(outlook?.growthLabel),
      projectedOpenings: asNullableNumber(outlook?.projectedOpenings),
      projectionYears: asNullableString(outlook?.projectionYears),
      demandLabel: isOneOf(DEMAND_LABELS, outlook?.demandLabel) ? outlook.demandLabel : 'unknown',
    },
    skills: parseSkills(payload?.skills),
    labels: {
      marketScore: isOneOf(MARKET_SCORES, labels?.marketScore) ? labels.marketScore : 'limited data',
      salaryVisibility: isOneOf(SALARY_VISIBILITY, labels?.salaryVisibility)
        ? labels.salaryVisibility
        : 'unavailable',
    },
    sources: parseSources(payload?.sources),
  };
}

function parseSalary(input: unknown): MarketSalaryRange | null {
  const salary = asRecord(input);
  if (!salary) return null;

  return {
    currency: 'USD',
    period: isOneOf(SALARY_PERIODS, salary.period) ? salary.period : 'annual',
    min: asNullableNumber(salary.min),
    max: asNullableNumber(salary.max),
    median: asNullableNumber(salary.median),
    year: asNullableString(salary.year),
    confidence: isOneOf(SALARY_CONFIDENCE, salary.confidence) ? salary.confidence : 'low',
    basis: isOneOf(SALARY_BASIS, salary.basis) ? salary.basis : 'market_estimate',
  };
}

function parseSkills(input: unknown): OccupationInsightResponse['skills'] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const skill = asRecord(item);
      const name = asString(skill?.name);
      if (!name) return null;
      return {
        name,
        category: isOneOf(SKILL_CATEGORIES, skill?.category) ? skill.category : 'unknown',
        sourceProvider: isOneOf(SOURCE_PROVIDERS, skill?.sourceProvider) ? skill.sourceProvider : 'careeronestop',
      };
    })
    .filter((skill): skill is OccupationInsightResponse['skills'][number] => skill !== null);
}

function parseSources(input: unknown): MarketSource[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const source = asRecord(item);
      const label = asString(source?.label);
      if (!label) return null;
      return {
        provider: isOneOf(SOURCE_PROVIDERS, source?.provider) ? source.provider : 'careeronestop',
        label,
        url: asNullableString(source?.url),
        retrievedAt: asString(source?.retrievedAt),
        attributionText: asString(source?.attributionText),
        logoRequired: asBoolean(source?.logoRequired),
      };
    })
    .filter((source): source is MarketSource => source !== null);
}

function asRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  return input as Record<string, unknown>;
}

function asString(input: unknown, fallback = '') {
  return typeof input === 'string' ? input : fallback;
}

function asNullableString(input: unknown) {
  return typeof input === 'string' ? input : null;
}

function asNullableNumber(input: unknown) {
  return typeof input === 'number' && Number.isFinite(input) ? input : null;
}

function asBoolean(input: unknown, fallback = false) {
  return typeof input === 'boolean' ? input : fallback;
}

function isOneOf<const TValues extends readonly string[]>(values: TValues, input: unknown): input is TValues[number] {
  return typeof input === 'string' && values.includes(input);
}
