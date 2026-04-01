import { API_BASE_URL } from '../config/api';
import { ApiError } from './authSession';
import { parseJsonBody } from './httpJson';
import { createCitiesApi } from './citiesApiCore';

export * from './citiesApiCore';

const citiesApi = createCitiesApi({
  apiBaseUrl: API_BASE_URL,
  fetchFn: fetch,
  parseJsonBody,
  ApiError,
});

export const searchCities = citiesApi.searchCities;
