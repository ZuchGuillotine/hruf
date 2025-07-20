import { createMobileApi } from '@hruf/api';
import * as SecureStore from 'expo-secure-store';

// Create secure storage interface for token management
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Create mobile API instance with secure storage
export const api = createMobileApi({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  storage: secureStorage,
  tokenKeys: {
    accessToken: 'auth_token',
    refreshToken: 'refresh_token'
  }
});

// Re-export API types for convenience
export type { ApiError } from '@hruf/api';