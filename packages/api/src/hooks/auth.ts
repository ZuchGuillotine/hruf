import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import type { 
  User, 
  LoginData, 
  RegisterData, 
  GoogleAuthData,
  ApiError
} from '../types';
import type { AuthEndpoints } from '../endpoints/auth';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook for getting current user
 */
export function useUser(
  authEndpoints: AuthEndpoints,
  options?: Omit<UseQueryOptions<{ user: User } | null, ApiError, User | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<{ user: User } | null> => {
      try {
        return await authEndpoints.getCurrentUser();
      } catch (error) {
        // Return null for 401 errors (not authenticated)
        if ((error as ApiError).status === 401) {
          return null;
        }
        throw error;
      }
    },
    select: (data) => data?.user || null,
    staleTime: Infinity,
    retry: false,
    ...options
  });
}

/**
 * Hook for user registration
 */
export function useRegister(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<{ message: string; user: User }, ApiError, RegisterData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authEndpoints.register(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.user(), { user: response.user });
    },
    ...options
  });
}

/**
 * Hook for user login
 */
export function useLogin(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<{ message: string; user: User }, ApiError, LoginData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => authEndpoints.login(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.user(), { user: response.user });
    },
    ...options
  });
}

/**
 * Hook for Google OAuth login
 */
export function useGoogleLogin(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<{ message: string; user: User }, ApiError, GoogleAuthData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GoogleAuthData) => authEndpoints.googleLogin(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.user(), { user: response.user });
    },
    ...options
  });
}

/**
 * Hook for user logout
 */
export function useLogout(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<{ message: string }, ApiError, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authEndpoints.logout(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    ...options
  });
}

/**
 * Hook for post-payment registration
 */
export function useRegisterPostPayment(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<
    { message: string; user: User }, 
    ApiError, 
    {
      username: string;
      email: string;
      password: string;
      sessionId: string;
      subscriptionTier?: string;
      purchaseId?: string;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => authEndpoints.registerPostPayment(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.user(), { user: response.user });
    },
    ...options
  });
}

/**
 * Hook for sending 2FA email
 */
export function useSend2FA(
  authEndpoints: AuthEndpoints,
  options?: UseMutationOptions<{ message: string }, ApiError, { email: string }>
) {
  return useMutation({
    mutationFn: (data: { email: string }) => authEndpoints.send2FA(data),
    ...options
  });
}