import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import type { 
  User,
  HealthStats,
  UpdateHealthStatsData,
  ApiError
} from '../types';
import type { UserEndpoints } from '../endpoints/user';
import { authKeys } from './auth';

// Query Keys
export const userKeys = {
  all: ['user'] as const,
  healthStats: () => [...userKeys.all, 'healthStats'] as const,
};

/**
 * Hook for getting user's health stats
 */
export function useHealthStats(
  userEndpoints: UserEndpoints,
  options?: Omit<UseQueryOptions<HealthStats, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.healthStats(),
    queryFn: () => userEndpoints.getHealthStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for updating user's health stats
 */
export function useUpdateHealthStats(
  userEndpoints: UserEndpoints,
  options?: UseMutationOptions<HealthStats, ApiError, UpdateHealthStatsData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateHealthStatsData) => userEndpoints.updateHealthStats(data),
    onSuccess: (updatedStats) => {
      queryClient.setQueryData(userKeys.healthStats(), updatedStats);
    },
    ...options
  });
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile(
  userEndpoints: UserEndpoints,
  options?: UseMutationOptions<{ message: string; user: User }, ApiError, Partial<User>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => userEndpoints.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.user(), { user: response.user });
    },
    ...options
  });
}