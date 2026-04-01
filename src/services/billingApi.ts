import { ApiError, authorizedFetch } from './authSession';
import { parseJsonBody } from './httpJson';
import { createBillingApi } from './billingApiCore';

export * from './billingApiCore';

const billingApi = createBillingApi({
  authorizedFetch,
  parseJsonBody,
  ApiError,
});

export const fetchBillingSubscription = billingApi.fetchBillingSubscription;
export const syncRevenueCatSubscription = billingApi.syncRevenueCatSubscription;
