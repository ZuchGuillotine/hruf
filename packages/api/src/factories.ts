import { Api, type ApiConfig } from './api';
import { TokenManager, SessionManager, AuthManager } from './utils/session';

/**
 * Configuration for web applications (browser)
 */
export interface WebApiConfig extends Omit<ApiConfig, 'authManager'> {
  sessionConfig?: {
    cookieName?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
}

/**
 * Configuration for mobile applications (React Native)
 */
export interface MobileApiConfig extends Omit<ApiConfig, 'authManager'> {
  storage?: {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
  };
  tokenKeys?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

/**
 * Create API instance optimized for web applications
 */
export function createWebApi(config: WebApiConfig = {}): Api {
  const { sessionConfig, ...apiConfig } = config;
  
  // Create session manager for web
  const sessionManager = new SessionManager(sessionConfig);
  const tokenManager = new TokenManager();
  const authManager = new AuthManager(sessionManager, tokenManager);

  return new Api({
    credentials: 'include', // Important for cookies
    ...apiConfig,
    authManager
  });
}

/**
 * Create API instance optimized for mobile applications (React Native)
 */
export function createMobileApi(config: MobileApiConfig = {}): Api {
  const { storage, tokenKeys, ...apiConfig } = config;
  
  // Create token manager for mobile
  const tokenManager = new TokenManager(
    tokenKeys?.accessToken || 'auth_token',
    tokenKeys?.refreshToken || 'refresh_token'
  );
  
  // Set storage if provided (AsyncStorage in React Native)
  if (storage) {
    tokenManager.setStorage(storage);
  }
  
  // Create minimal session manager (won't be used in mobile)
  const sessionManager = new SessionManager();
  const authManager = new AuthManager(sessionManager, tokenManager);

  return new Api({
    credentials: 'omit', // Don't send cookies in mobile
    ...apiConfig,
    authManager
  });
}

/**
 * Helper to detect if running in React Native environment
 */
export function isReactNative(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative'
  );
}

/**
 * Create API instance with automatic platform detection
 */
export function createPlatformApi(config: {
  web?: WebApiConfig;
  mobile?: MobileApiConfig;
  common?: Partial<ApiConfig>;
} = {}): Api {
  const commonConfig = config.common || {};
  
  if (isReactNative()) {
    return createMobileApi({
      ...commonConfig,
      ...config.mobile
    });
  } else {
    return createWebApi({
      ...commonConfig,
      ...config.web
    });
  }
}

/**
 * Default API instances for convenience
 */
export const webApi = createWebApi();
export const mobileApi = createMobileApi();