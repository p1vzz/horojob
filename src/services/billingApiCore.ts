import type { AuthUser } from '../utils/authSessionStorage';

export type BillingSubscriptionStatus = 'active' | 'grace' | 'billing_issue' | 'expired' | 'none';

export type BillingSubscriptionSnapshot = {
  provider: 'revenuecat';
  tier: 'free' | 'premium';
  entitlementId: string | null;
  status: BillingSubscriptionStatus;
  expiresAt: string | null;
  willRenew: boolean | null;
  productId: string | null;
  updatedAt: string;
};

export type BillingSyncResponse = {
  user: AuthUser;
  subscription: BillingSubscriptionSnapshot;
};

export type BillingApiDeps = {
  authorizedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  parseJsonBody: (response: Response) => Promise<unknown>;
  ApiError: new (status: number, message: string, payload: unknown) => Error;
};

export function createBillingApi(deps: BillingApiDeps) {
  const fetchBillingSubscription = async () => {
    const response = await deps.authorizedFetch('/api/billing/subscription');
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to fetch subscription', payload);
    }
    return payload as BillingSyncResponse;
  };

  const syncRevenueCatSubscription = async () => {
    const response = await deps.authorizedFetch('/api/billing/revenuecat/sync', {
      method: 'POST',
    });
    const payload = await deps.parseJsonBody(response);
    if (!response.ok) {
      throw new deps.ApiError(response.status, 'Failed to sync RevenueCat subscription', payload);
    }
    return payload as BillingSyncResponse;
  };

  return {
    fetchBillingSubscription,
    syncRevenueCatSubscription,
  };
}
