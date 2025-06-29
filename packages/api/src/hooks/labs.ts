import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import { useCallback } from 'react';
import type { 
  LabResult,
  LabChartData,
  BiomarkerSeries,
  ApiError
} from '../types';
import type { LabsEndpoints } from '../endpoints/labs';

// Query Keys
export const labKeys = {
  all: ['labs'] as const,
  results: () => [...labKeys.all, 'results'] as const,
  chartData: () => [...labKeys.all, 'chartData'] as const,
};

/**
 * Hook for getting lab results
 */
export function useLabResults(
  labsEndpoints: LabsEndpoints,
  options?: Omit<UseQueryOptions<LabResult[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: labKeys.results(),
    queryFn: () => labsEndpoints.getLabResults(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for uploading lab results
 */
export function useUploadLabResult(
  labsEndpoints: LabsEndpoints,
  options?: UseMutationOptions<{ message: string }, ApiError, File | File[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File | File[]) => labsEndpoints.uploadLabResult(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      queryClient.invalidateQueries({ queryKey: labKeys.chartData() });
    },
    ...options
  });
}

/**
 * Hook for deleting lab results
 */
export function useDeleteLabResult(
  labsEndpoints: LabsEndpoints,
  options?: UseMutationOptions<{ message: string }, ApiError, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => labsEndpoints.deleteLabResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      queryClient.invalidateQueries({ queryKey: labKeys.chartData() });
    },
    ...options
  });
}

/**
 * Hook for getting lab chart data with automatic pagination handling
 */
export function useLabChartData(
  labsEndpoints: LabsEndpoints,
  options?: Omit<UseQueryOptions<LabChartData, ApiError>, 'queryKey' | 'queryFn'>
) {
  const query = useQuery({
    queryKey: labKeys.chartData(),
    queryFn: () => labsEndpoints.getAllLabChartData(),
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...options
  });

  const getSeriesByName = useCallback((name: string): BiomarkerSeries | undefined => {
    return query.data?.series.find(s => s.name === name);
  }, [query.data?.series]);

  return {
    ...query,
    getSeriesByName
  };
}