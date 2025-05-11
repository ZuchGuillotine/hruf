
import { useQuery } from '@tanstack/react-query';
import type { ChartApiResponse, BiomarkerDataPoint, Series } from '@/types/chart';
import { queryClient, getQueryFn } from '@/lib/queryClient';

export interface UseLabChartDataOptions {
  /** Page number for pagination (1-based) */
  page?: number;
  /** Number of items per page (max 100) */
  pageSize?: number;
}

export interface UseLabChartDataResult {
  /** Flattened array of data points */
  data?: BiomarkerDataPoint[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch trigger */
  refetch: () => Promise<void>;
  /**
   * Returns a grouped series for the given biomarker name,
   * or undefined if that biomarker is not on the current page.
   */
  getSeriesByName: (name: string) => Series | undefined;
}

/**
 * React Query hook to fetch paginated lab chart data.
 * Caches results per page and pageSize.
 */
export function useLabChartData(
  { page = 1, pageSize = 50 }: UseLabChartDataOptions = {}
): UseLabChartDataResult {
  const queryKey = ['labChartData', page, pageSize];
  
  const { data: response, isLoading, isError, error, refetch } = useQuery<ChartApiResponse, Error>({
    queryKey,
    queryFn: getQueryFn(),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    keepPreviousData: true
  });

  const dataPoints = response?.data;

  const getSeriesByName = (name: string): Series | undefined => {
    if (!dataPoints) return undefined;
    const filtered = dataPoints.filter((dp) => dp.name === name);
    if (filtered.length === 0) return undefined;
    
    const unit = filtered[0].unit;
    const points = filtered
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .map((dp) => ({ testDate: dp.testDate, value: dp.value }));
      
    return { name, unit, points };
  };

  return {
    data: dataPoints,
    isLoading,
    isError,
    error: error || null,
    refetch: async () => { await refetch(); },
    getSeriesByName,
  };
}
