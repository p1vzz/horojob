export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsCoreDeps = {
  isDev: boolean;
  logger: (scope: string, name: string, properties: AnalyticsProperties) => void;
};

export function createAnalyticsService(deps: AnalyticsCoreDeps) {
  const trackAnalyticsEvent = (name: string, properties?: AnalyticsProperties) => {
    if (deps.isDev) {
      deps.logger('[analytics:event]', name, properties ?? {});
    }
  };

  return {
    trackAnalyticsEvent,
  };
}
