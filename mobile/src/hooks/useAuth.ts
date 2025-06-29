import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import type { AppUser } from '@hruf/shared-types';
import { api } from '@/lib/api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const queryClient = useQueryClient();

  // Initialize auth state from secure storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const [token, userData] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_DATA_KEY),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData) as AppUser;
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return api.auth.login(email, password);
    },
    onSuccess: async ({ user, token }) => {
      try {
        await Promise.all([
          SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
          SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user)),
        ]);

        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });

        // Invalidate and refetch user-related queries
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch (error) {
        console.error('Error storing auth data:', error);
        throw new Error('Failed to store authentication data');
      }
    },
  });

  const register = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name 
    }: { 
      email: string; 
      password: string; 
      name: string; 
    }) => {
      return api.auth.register(email, password, name);
    },
    onSuccess: async ({ user, token }) => {
      try {
        await Promise.all([
          SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
          SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user)),
        ]);

        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });

        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch (error) {
        console.error('Error storing auth data:', error);
        throw new Error('Failed to store authentication data');
      }
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      // Call API logout if user is authenticated
      if (authState.isAuthenticated) {
        try {
          await api.auth.logout();
        } catch (error) {
          // Continue with local logout even if API call fails
          console.warn('API logout failed:', error);
        }
      }
    },
    onSuccess: async () => {
      try {
        await Promise.all([
          SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
          SecureStore.deleteItemAsync(USER_DATA_KEY),
        ]);

        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });

        // Clear all cached data
        queryClient.clear();
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
    },
  });

  return {
    ...authState,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
    isLoginLoading: login.isPending,
    isRegisterLoading: register.isPending,
    isLogoutLoading: logout.isPending,
    loginError: login.error,
    registerError: register.error,
  };
}