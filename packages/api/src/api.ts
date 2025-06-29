import { ApiClient, type ApiClientOptions } from './client';
import { ApiEndpoints } from './endpoints';
import { authManager, type AuthManager } from './utils/session';

/**
 * Configuration options for the main API instance
 */
export interface ApiConfig extends ApiClientOptions {
  authManager?: AuthManager;
}

/**
 * Main API class that provides access to all endpoints and handles authentication
 */
export class Api {
  public client: ApiClient;
  public endpoints: ApiEndpoints;
  private authManager: AuthManager;

  constructor(config: ApiConfig = {}) {
    // Extract auth manager from config
    const { authManager: customAuthManager, ...clientConfig } = config;
    this.authManager = customAuthManager || authManager;

    // Create API client
    this.client = new ApiClient(clientConfig);
    
    // Initialize endpoints
    this.endpoints = new ApiEndpoints(this.client);

    // Set up auth headers interceptor
    this.setupAuthInterceptor();
  }

  /**
   * Set up automatic auth header injection
   */
  private async setupAuthInterceptor(): Promise<void> {
    const authHeaders = await this.authManager.getAuthHeaders();
    if (Object.keys(authHeaders).length > 0) {
      this.client.setDefaultHeaders(authHeaders);
    }
  }

  /**
   * Update authentication headers
   */
  async updateAuthHeaders(): Promise<void> {
    await this.setupAuthInterceptor();
  }

  /**
   * Clear authentication and update headers
   */
  async clearAuth(): Promise<void> {
    await this.authManager.clearAuth();
    this.client.removeDefaultHeader('Authorization');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.authManager.isAuthenticated();
  }

  /**
   * Convenient access to individual endpoint groups
   */
  get auth() {
    return this.endpoints.auth;
  }

  get supplements() {
    return this.endpoints.supplements;
  }

  get chat() {
    return this.endpoints.chat;
  }

  get labs() {
    return this.endpoints.labs;
  }

  get user() {
    return this.endpoints.user;
  }

  get admin() {
    return this.endpoints.admin;
  }

  get summaries() {
    return this.endpoints.summaries;
  }
}

/**
 * Create a new API instance
 */
export function createApi(config?: ApiConfig): Api {
  return new Api(config);
}