import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import type { 
  LogSummary,
  ApiError
} from '../types';
import type { SummariesEndpoints } from '../endpoints/summaries';

// Query Keys
export const summaryKeys = {
  all: ['summaries'] as const,
  lists: () => [...summaryKeys.all, 'list'] as const,
  list: (filters?: {
    type?: 'daily' | 'weekly';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => [...summaryKeys.lists(), filters] as const,
  latest: (type: 'daily' | 'weekly') => [...summaryKeys.all, 'latest', type] as const,
};

/**
 * Hook for getting summaries with optional filters
 */
export function useSummaries(
  summariesEndpoints: SummariesEndpoints,
  filters?: {
    type?: 'daily' | 'weekly';
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
  options?: Omit<UseQueryOptions<LogSummary[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: summaryKeys.list(filters),
    queryFn: () => summariesEndpoints.getSummaries(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for getting latest daily summary
 */
export function useLatestDailySummary(
  summariesEndpoints: SummariesEndpoints,
  options?: Omit<UseQueryOptions<LogSummary | null, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: summaryKeys.latest('daily'),
    queryFn: () => summariesEndpoints.getLatestDailySummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for getting latest weekly summary
 */
export function useLatestWeeklySummary(
  summariesEndpoints: SummariesEndpoints,
  options?: Omit<UseQueryOptions<LogSummary | null, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: summaryKeys.latest('weekly'),
    queryFn: () => summariesEndpoints.getLatestWeeklySummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for triggering summary generation
 */
export function useTriggerSummary(
  summariesEndpoints: SummariesEndpoints,
  options?: UseMutationOptions<
    LogSummary, 
    ApiError, 
    {
      type: 'daily' | 'weekly';
      startDate: string;
      endDate: string;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => summariesEndpoints.triggerSummary(data),
    onSuccess: (summary) => {
      // Invalidate all summary queries
      queryClient.invalidateQueries({ queryKey: summaryKeys.all });
      
      // Update the latest summary cache
      queryClient.setQueryData(summaryKeys.latest(summary.summaryType), summary);
    },
    ...options
  });
}