/**
 * Convenience hooks that automatically handle endpoint injection
 * These make it easier to use the API in React components without manually passing endpoints
 */

import { createContext, useContext } from 'react';
import type { Api } from '../api';
import * as AuthHooks from './auth';
import * as SupplementHooks from './supplements';
import * as ChatHooks from './chat';
import * as LabHooks from './labs';
import * as UserHooks from './user';
import * as SummaryHooks from './summaries';

/**
 * Context for providing API instance to hooks
 */
export const ApiContext = createContext<Api | null>(null);

/**
 * Hook to get the API instance from context
 */
export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return api;
}

// Auth Hooks with automatic endpoint injection
export function useCurrentUser(options?: Parameters<typeof AuthHooks.useUser>[1]) {
  const api = useApi();
  return AuthHooks.useUser(api.auth, options);
}

export function useRegister(options?: Parameters<typeof AuthHooks.useRegister>[1]) {
  const api = useApi();
  return AuthHooks.useRegister(api.auth, options);
}

export function useLogin(options?: Parameters<typeof AuthHooks.useLogin>[1]) {
  const api = useApi();
  return AuthHooks.useLogin(api.auth, options);
}

export function useGoogleLogin(options?: Parameters<typeof AuthHooks.useGoogleLogin>[1]) {
  const api = useApi();
  return AuthHooks.useGoogleLogin(api.auth, options);
}

export function useLogout(options?: Parameters<typeof AuthHooks.useLogout>[1]) {
  const api = useApi();
  return AuthHooks.useLogout(api.auth, options);
}

// Supplement Hooks
export function useSupplements(userId?: number, options?: Parameters<typeof SupplementHooks.useSupplements>[2]) {
  const api = useApi();
  return SupplementHooks.useSupplements(api.supplements, userId, options);
}

export function useCreateSupplement(options?: Parameters<typeof SupplementHooks.useCreateSupplement>[1]) {
  const api = useApi();
  return SupplementHooks.useCreateSupplement(api.supplements, options);
}

export function useUpdateSupplement(options?: Parameters<typeof SupplementHooks.useUpdateSupplement>[1]) {
  const api = useApi();
  return SupplementHooks.useUpdateSupplement(api.supplements, options);
}

export function useDeleteSupplement(options?: Parameters<typeof SupplementHooks.useDeleteSupplement>[1]) {
  const api = useApi();
  return SupplementHooks.useDeleteSupplement(api.supplements, options);
}

export function useSupplementSearch(query: string, options?: Parameters<typeof SupplementHooks.useSupplementSearch>[2]) {
  const api = useApi();
  return SupplementHooks.useSupplementSearch(api.supplements, query, options);
}

export function useSupplementLogs(date: string, options?: Parameters<typeof SupplementHooks.useSupplementLogs>[2]) {
  const api = useApi();
  return SupplementHooks.useSupplementLogs(api.supplements, date, options);
}

export function useSaveSupplementLogs(options?: Parameters<typeof SupplementHooks.useSaveSupplementLogs>[1]) {
  const api = useApi();
  return SupplementHooks.useSaveSupplementLogs(api.supplements, options);
}

export function useSupplementStreak(options?: Parameters<typeof SupplementHooks.useSupplementStreak>[1]) {
  const api = useApi();
  return SupplementHooks.useSupplementStreak(api.supplements, options);
}

// Chat Hooks
export function useChatHistory(options?: Parameters<typeof ChatHooks.useChatHistory>[1]) {
  const api = useApi();
  return ChatHooks.useChatHistory(api.chat, options);
}

export function useSupplementQuery(options?: Parameters<typeof ChatHooks.useSupplementQuery>[1]) {
  const api = useApi();
  return ChatHooks.useSupplementQuery(api.chat, options);
}

export function useSaveChat(options?: Parameters<typeof ChatHooks.useSaveChat>[1]) {
  const api = useApi();
  return ChatHooks.useSaveChat(api.chat, options);
}

export function useStreamingChat() {
  const api = useApi();
  return ChatHooks.useStreamingChat(api.chat);
}

// Lab Hooks
export function useLabResults(options?: Parameters<typeof LabHooks.useLabResults>[1]) {
  const api = useApi();
  return LabHooks.useLabResults(api.labs, options);
}

export function useUploadLabResult(options?: Parameters<typeof LabHooks.useUploadLabResult>[1]) {
  const api = useApi();
  return LabHooks.useUploadLabResult(api.labs, options);
}

export function useDeleteLabResult(options?: Parameters<typeof LabHooks.useDeleteLabResult>[1]) {
  const api = useApi();
  return LabHooks.useDeleteLabResult(api.labs, options);
}

export function useLabChartData(options?: Parameters<typeof LabHooks.useLabChartData>[1]) {
  const api = useApi();
  return LabHooks.useLabChartData(api.labs, options);
}

// User Hooks
export function useHealthStats(options?: Parameters<typeof UserHooks.useHealthStats>[1]) {
  const api = useApi();
  return UserHooks.useHealthStats(api.user, options);
}

export function useUpdateHealthStats(options?: Parameters<typeof UserHooks.useUpdateHealthStats>[1]) {
  const api = useApi();
  return UserHooks.useUpdateHealthStats(api.user, options);
}

export function useUpdateProfile(options?: Parameters<typeof UserHooks.useUpdateProfile>[1]) {
  const api = useApi();
  return UserHooks.useUpdateProfile(api.user, options);
}

// Summary Hooks
export function useSummaries(
  filters?: Parameters<typeof SummaryHooks.useSummaries>[1],
  options?: Parameters<typeof SummaryHooks.useSummaries>[2]
) {
  const api = useApi();
  return SummaryHooks.useSummaries(api.summaries, filters, options);
}

export function useLatestDailySummary(options?: Parameters<typeof SummaryHooks.useLatestDailySummary>[1]) {
  const api = useApi();
  return SummaryHooks.useLatestDailySummary(api.summaries, options);
}

export function useLatestWeeklySummary(options?: Parameters<typeof SummaryHooks.useLatestWeeklySummary>[1]) {
  const api = useApi();
  return SummaryHooks.useLatestWeeklySummary(api.summaries, options);
}

export function useTriggerSummary(options?: Parameters<typeof SummaryHooks.useTriggerSummary>[1]) {
  const api = useApi();
  return SummaryHooks.useTriggerSummary(api.summaries, options);
}