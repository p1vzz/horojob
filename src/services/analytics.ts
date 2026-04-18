import { createAnalyticsService, type AnalyticsProperties } from './analyticsCore';
import { SHOULD_EXPOSE_TECHNICAL_SURFACES } from '../config/appEnvironment';

export type { AnalyticsProperties } from './analyticsCore';
export * from './analyticsCore';

const analyticsService = createAnalyticsService({
  isDev: SHOULD_EXPOSE_TECHNICAL_SURFACES,
  logger: (scope, name, properties) => {
    // Keep a lightweight in-client logger until analytics SDK is wired.
    console.log(scope, name, properties);
  },
});

export function trackAnalyticsEvent(name: string, properties?: AnalyticsProperties) {
  analyticsService.trackAnalyticsEvent(name, properties);
}
