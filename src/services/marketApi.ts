import { ApiError, authorizedFetch } from './authSession';
import { parseJsonBody } from './httpJson';
import { createMarketApi } from './marketApiCore';

export * from './marketApiCore';

const marketApi = createMarketApi({
  authorizedFetch,
  parseJsonBody,
  ApiError,
});

export const fetchOccupationInsight = marketApi.fetchOccupationInsight;
