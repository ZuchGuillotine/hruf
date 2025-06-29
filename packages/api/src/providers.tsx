import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiContext } from './hooks/convenience';
import type { Api } from './api';
import { createQueryClient } from './utils/queryClient';

/**
 * Props for the ApiProvider component
 */
export interface ApiProviderProps {
  children: ReactNode;
  api: Api;
  queryClient?: QueryClient;
}

/**
 * Provider component that makes the API instance available to all child components
 */
export function ApiProvider({ children, api, queryClient }: ApiProviderProps) {
  const client = queryClient || createQueryClient();

  return (
    <QueryClientProvider client={client}>
      <ApiContext.Provider value={api}>
        {children}
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Props for the HrufApiProvider component
 */
export interface HrufApiProviderProps {
  children: ReactNode;
  api: Api;
  queryClient?: QueryClient;
}

/**
 * Main provider component for HRUF applications
 * Combines QueryClient and Api providers for convenience
 */
export function HrufApiProvider({ children, api, queryClient }: HrufApiProviderProps) {
  return (
    <ApiProvider api={api} queryClient={queryClient}>
      {children}
    </ApiProvider>
  );
}