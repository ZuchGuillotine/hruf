/**
 * Session management utilities for handling authentication state
 * Works with cookie-based sessions (web) and can be extended for token-based auth (mobile)
 */

export interface SessionConfig {
  cookieName?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Session manager for handling authentication state
 */
export class SessionManager {
  private config: Required<SessionConfig>;

  constructor(config: SessionConfig = {}) {
    this.config = {
      cookieName: config.cookieName || 'stacktracker.sid',
      domain: config.domain || '',
      secure: config.secure ?? true,
      sameSite: config.sameSite || 'lax'
    };
  }

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Get session ID from cookie (web only)
   */
  getSessionId(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.config.cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Check if user has an active session
   */
  hasActiveSession(): boolean {
    return this.getSessionId() !== null;
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    if (!this.isBrowser()) {
      return;
    }

    // Clear the session cookie
    document.cookie = `${this.config.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Also clear with domain if specified
    if (this.config.domain) {
      document.cookie = `${this.config.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${this.config.domain};`;
    }
  }

  /**
   * Get session configuration
   */
  getConfig(): Required<SessionConfig> {
    return { ...this.config };
  }

  /**
   * Update session configuration
   */
  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default session manager instance
 */
export const sessionManager = new SessionManager();

/**
 * Storage interface that works with both localStorage and AsyncStorage
 */
interface AsyncStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * Token-based authentication manager for React Native
 */
export class TokenManager {
  private tokenKey: string;
  private refreshTokenKey: string;
  private storage: AsyncStorage | null = null;

  constructor(tokenKey = 'auth_token', refreshTokenKey = 'refresh_token') {
    this.tokenKey = tokenKey;
    this.refreshTokenKey = refreshTokenKey;
    
    // Try to initialize storage (web)
    if (typeof localStorage !== 'undefined') {
      this.storage = localStorage;
    }
  }

  /**
   * Set storage implementation (for React Native AsyncStorage)
   */
  setStorage(storage: AsyncStorage): void {
    this.storage = storage;
  }

  /**
   * Get access token
   */
  async getToken(): Promise<string | null> {
    if (!this.storage) return null;
    
    try {
      const result = this.storage.getItem(this.tokenKey);
      return await Promise.resolve(result);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Set access token
   */
  async setToken(token: string): Promise<void> {
    if (!this.storage) return;
    
    try {
      const result = this.storage.setItem(this.tokenKey, token);
      await Promise.resolve(result);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    if (!this.storage) return null;
    
    try {
      const result = this.storage.getItem(this.refreshTokenKey);
      return await Promise.resolve(result);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Set refresh token
   */
  async setRefreshToken(token: string): Promise<void> {
    if (!this.storage) return;
    
    try {
      const result = this.storage.setItem(this.refreshTokenKey, token);
      await Promise.resolve(result);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    if (!this.storage) return;
    
    try {
      const promises = [
        Promise.resolve(this.storage.removeItem(this.tokenKey)),
        Promise.resolve(this.storage.removeItem(this.refreshTokenKey))
      ];
      
      const results = await Promise.allSettled(promises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error clearing token ${index}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if user has valid tokens
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token.length > 0;
  }
}

/**
 * Default token manager instance
 */
export const tokenManager = new TokenManager();

/**
 * Auth manager that combines session and token management
 */
export class AuthManager {
  constructor(
    private sessionManager: SessionManager,
    private tokenManager: TokenManager
  ) {}

  /**
   * Check if user is authenticated (session or token)
   */
  async isAuthenticated(): Promise<boolean> {
    // Check session first (web)
    if (this.sessionManager.hasActiveSession()) {
      return true;
    }

    // Check token (mobile)
    return await this.tokenManager.hasValidToken();
  }

  /**
   * Clear all authentication data
   */
  async clearAuth(): Promise<void> {
    this.sessionManager.clearSession();
    await this.tokenManager.clearTokens();
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.tokenManager.getToken();
    
    if (token) {
      return {
        Authorization: `Bearer ${token}`
      };
    }

    return {};
  }
}

/**
 * Default auth manager instance
 */
export const authManager = new AuthManager(sessionManager, tokenManager);