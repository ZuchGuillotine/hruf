// Main API class and factory
export { Api, createApi, type ApiConfig } from './api';

// HTTP Client
export { ApiClient, createApiClient, type ApiClientOptions, type ApiResponse } from './client';

// Endpoints
export * from './endpoints';

// Hooks for TanStack Query integration
export * from './hooks';

// Types
export * from './types';

// Utilities
export * from './utils';

// Platform-specific API factories
export * from './factories';

// React providers
export * from './providers';

// Create a default API instance for convenience
import { createApi } from './api';
export const api = createApi();