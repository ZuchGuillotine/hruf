import type { Series } from '@/types/chart';
interface ChartData {
  series: Series[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}
export declare function useLabChartData():
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: ChartData;
      error: Error;
      isError: true;
      isPending: false;
      isLoading: false;
      isLoadingError: false;
      isRefetchError: true;
      isSuccess: false;
      isPlaceholderData: false;
      status: 'error';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    }
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: ChartData;
      error: null;
      isError: false;
      isPending: false;
      isLoading: false;
      isLoadingError: false;
      isRefetchError: false;
      isSuccess: true;
      isPlaceholderData: false;
      status: 'success';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    }
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: undefined;
      error: Error;
      isError: true;
      isPending: false;
      isLoading: false;
      isLoadingError: true;
      isRefetchError: false;
      isSuccess: false;
      isPlaceholderData: false;
      status: 'error';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    }
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: undefined;
      error: null;
      isError: false;
      isPending: true;
      isLoading: true;
      isLoadingError: false;
      isRefetchError: false;
      isSuccess: false;
      isPlaceholderData: false;
      status: 'pending';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    }
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: undefined;
      error: null;
      isError: false;
      isPending: true;
      isLoadingError: false;
      isRefetchError: false;
      isSuccess: false;
      isPlaceholderData: false;
      status: 'pending';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isLoading: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    }
  | {
      getSeriesByName: (name: string) => Series | undefined;
      data: ChartData;
      isError: false;
      error: null;
      isPending: false;
      isLoading: false;
      isLoadingError: false;
      isRefetchError: false;
      isSuccess: true;
      isPlaceholderData: true;
      status: 'success';
      dataUpdatedAt: number;
      errorUpdatedAt: number;
      failureCount: number;
      failureReason: Error | null;
      errorUpdateCount: number;
      isFetched: boolean;
      isFetchedAfterMount: boolean;
      isFetching: boolean;
      isInitialLoading: boolean;
      isPaused: boolean;
      isRefetching: boolean;
      isStale: boolean;
      refetch: (
        options?: import('@tanstack/query-core').RefetchOptions
      ) => Promise<import('@tanstack/query-core').QueryObserverResult<ChartData, Error>>;
      fetchStatus: import('@tanstack/query-core').FetchStatus;
      promise: Promise<ChartData>;
    };
export {};
//# sourceMappingURL=use-lab-chart-data.d.ts.map
