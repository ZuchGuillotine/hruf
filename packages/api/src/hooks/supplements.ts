import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import type { 
  Supplement, 
  CreateSupplementData, 
  UpdateSupplementData,
  SupplementSearchResult,
  SupplementLog,
  CreateSupplementLogData,
  SupplementLogsResponse,
  SupplementStreak,
  ApiError
} from '../types';
import type { SupplementsEndpoints } from '../endpoints/supplements';

// Query Keys
export const supplementKeys = {
  all: ['supplements'] as const,
  lists: () => [...supplementKeys.all, 'list'] as const,
  list: (userId?: number) => [...supplementKeys.lists(), userId] as const,
  search: (query: string) => [...supplementKeys.all, 'search', query] as const,
  logs: () => [...supplementKeys.all, 'logs'] as const,
  logsForDate: (date: string) => [...supplementKeys.logs(), date] as const,
  streak: () => [...supplementKeys.all, 'streak'] as const,
};

/**
 * Hook for getting user's supplements
 */
export function useSupplements(
  supplementsEndpoints: SupplementsEndpoints,
  userId?: number,
  options?: Omit<UseQueryOptions<Supplement[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: supplementKeys.list(userId),
    queryFn: () => supplementsEndpoints.getSupplements(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for creating a supplement
 */
export function useCreateSupplement(
  supplementsEndpoints: SupplementsEndpoints,
  options?: UseMutationOptions<Supplement, ApiError, CreateSupplementData>
) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: (data: CreateSupplementData) => supplementsEndpoints.createSupplement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplementKeys.logsForDate(today) });
    },
    ...options
  });
}

/**
 * Hook for updating a supplement
 */
export function useUpdateSupplement(
  supplementsEndpoints: SupplementsEndpoints,
  options?: UseMutationOptions<Supplement, ApiError, { id: number; data: UpdateSupplementData }>
) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: ({ id, data }) => supplementsEndpoints.updateSupplement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplementKeys.logsForDate(today) });
    },
    ...options
  });
}

/**
 * Hook for deleting a supplement
 */
export function useDeleteSupplement(
  supplementsEndpoints: SupplementsEndpoints,
  options?: UseMutationOptions<{ message: string }, ApiError, number>
) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: (id: number) => supplementsEndpoints.deleteSupplement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplementKeys.logsForDate(today) });
    },
    ...options
  });
}

/**
 * Hook for searching supplements
 */
export function useSupplementSearch(
  supplementsEndpoints: SupplementsEndpoints,
  query: string,
  options?: Omit<UseQueryOptions<SupplementSearchResult[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: supplementKeys.search(query),
    queryFn: () => supplementsEndpoints.searchSupplements(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options
  });
}

/**
 * Hook for getting supplement logs for a specific date
 */
export function useSupplementLogs(
  supplementsEndpoints: SupplementsEndpoints,
  date: string,
  options?: Omit<UseQueryOptions<SupplementLogsResponse, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: supplementKeys.logsForDate(date),
    queryFn: () => supplementsEndpoints.getSupplementLogs(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for saving supplement logs
 */
export function useSaveSupplementLogs(
  supplementsEndpoints: SupplementsEndpoints,
  options?: UseMutationOptions<SupplementLog[], ApiError, CreateSupplementLogData[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logs: CreateSupplementLogData[]) => supplementsEndpoints.saveSupplementLogs(logs),
    onSuccess: (_, variables) => {
      // Invalidate logs for all dates that were updated
      const dates = new Set(variables.map(log => 
        new Date(log.takenAt).toISOString().split('T')[0]
      ));
      
      dates.forEach(date => {
        queryClient.invalidateQueries({ queryKey: supplementKeys.logsForDate(date) });
      });
      
      queryClient.invalidateQueries({ queryKey: supplementKeys.streak() });
    },
    ...options
  });
}

/**
 * Hook for getting supplement streak
 */
export function useSupplementStreak(
  supplementsEndpoints: SupplementsEndpoints,
  options?: Omit<UseQueryOptions<SupplementStreak, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: supplementKeys.streak(),
    queryFn: () => supplementsEndpoints.getSupplementStreak(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}