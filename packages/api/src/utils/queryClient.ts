import { QueryClient } from '@tanstack/react-query';

/**
 * Default query client configuration that works well for both web and mobile
 */
export const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 401, 403, or 404 errors
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: (failureCount: number, error: any) => {
        // Don't retry mutations on client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 1 time for server errors
        return failureCount < 1;
      },
    },
  },
};

/**
 * Create a new QueryClient instance with sensible defaults for the HRUF app
 */
export function createQueryClient(config?: Partial<typeof defaultQueryClientConfig>): QueryClient {
  const mergedConfig = {
    ...defaultQueryClientConfig,
    ...config,
    defaultOptions: {
      ...defaultQueryClientConfig.defaultOptions,
      ...config?.defaultOptions,
      queries: {
        ...defaultQueryClientConfig.defaultOptions.queries,
        ...config?.defaultOptions?.queries,
      },
      mutations: {
        ...defaultQueryClientConfig.defaultOptions.mutations,
        ...config?.defaultOptions?.mutations,
      },
    },
  };

  return new QueryClient(mergedConfig);
}

/**
 * Default query client instance
 */
export const queryClient = createQueryClient();