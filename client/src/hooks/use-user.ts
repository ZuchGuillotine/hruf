import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/neon-schema";

type RequestResult = {
  ok: true;
  user?: SelectUser;
  message?: string;
  requiresVerification?: boolean;
  redirectUrl?: string;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: Partial<InsertUser> | { credential?: string }
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && data.code === 'TRIAL_EXPIRED') {
        return { 
          ok: false, 
          message: "Your trial has expired. Please upgrade to continue.",
          code: 'TRIAL_EXPIRED'
        };
      }
      return { 
        ok: false, 
        message: data.error || data.message || "Authentication failed",
        code: response.status === 401 ? 'AUTH_FAILED' : 'SERVER_ERROR'
      };
    }

    return { ok: true, ...data };
  } catch (e: any) {
    return { ok: false, message: "Connection error occurred", code: 'CONNECTION_ERROR' };
  }
}

async function fetchUser(): Promise<SelectUser | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<SelectUser | null>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: (userData: Partial<InsertUser>) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (credential: string) => handleRequest('/api/auth/google', 'POST', { credential }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: Partial<InsertUser>) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    googleLogin: googleLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}