import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient for React Query
 * Configured with sensible defaults for mobile app
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: how long inactive data stays in memory
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)

      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch behavior
      refetchOnMount: true,
      refetchOnWindowFocus: false, // Mobile apps don't have window focus
      refetchOnReconnect: true,

      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
