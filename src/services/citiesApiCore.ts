export type CitySearchItem = {
  id: string;
  name: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  admin1: string | null;
};

export type CitySearchOptions = {
  count?: number;
  language?: string;
};

type CitySearchCacheEntry = {
  expiresAt: number;
  items: CitySearchItem[];
};

export type CitiesApiDeps = {
  apiBaseUrl: string;
  fetchFn: (input: string, init?: RequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
  now?: () => number;
  cacheTtlMs?: number;
};

function toNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function normalizeCityItem(input: unknown, index: number): CitySearchItem | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const name = typeof row.name === 'string' ? row.name : null;
  const label = typeof row.label === 'string' && row.label.length > 0 ? row.label : name;

  if (!name || !label) return null;

  const fallbackId = `${name}-${index}`;
  return {
    id: typeof row.id === 'string' ? row.id : fallbackId,
    name,
    label,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    country: toNullableString(row.country),
    admin1: toNullableString(row.admin1),
  };
}

function buildCitySearchCacheKey(query: string, count: number, language: string) {
  return `${query.toLowerCase()}|${count}|${language.toLowerCase()}`;
}

export function createCitiesApi(deps: CitiesApiDeps) {
  const citySearchCache = new Map<string, CitySearchCacheEntry>();
  const now = deps.now ?? Date.now;
  const cacheTtlMs = deps.cacheTtlMs ?? 5 * 60 * 1000;

  const searchCities = async (query: string, options: CitySearchOptions = {}) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [] as CitySearchItem[];
    }

    const count = Math.max(1, Math.min(20, options.count ?? 6));
    const language = (options.language ?? 'en').trim() || 'en';
    const nowMs = now();
    const cacheKey = buildCitySearchCacheKey(trimmed, count, language);
    const cached = citySearchCache.get(cacheKey);
    if (cached && cached.expiresAt > nowMs) {
      return cached.items.slice();
    }
    if (cached) {
      citySearchCache.delete(cacheKey);
    }

    const url = new URL(`${deps.apiBaseUrl}/api/cities/search`);
    url.searchParams.set('query', trimmed);
    url.searchParams.set('count', String(count));
    url.searchParams.set('language', language);

    const response = await deps.fetchFn(url.toString());
    const payload = await deps.parseJsonBody(response);

    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to search cities', payload);
    }

    const items =
      payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
        ? ((payload as Record<string, unknown>).items as unknown[])
        : [];

    const normalizedItems = items
      .map((entry, index) => normalizeCityItem(entry, index))
      .filter((entry): entry is CitySearchItem => entry !== null);

    citySearchCache.set(cacheKey, {
      expiresAt: nowMs + cacheTtlMs,
      items: normalizedItems,
    });

    return normalizedItems.slice();
  };

  return {
    searchCities,
  };
}
