/**
 * @hruf/shared-types
 * 
 * Shared TypeScript types and database schemas for HRUF web and mobile applications.
 * This package provides a centralized location for all database schemas, TypeScript types,
 * and Zod validation schemas that are used across multiple applications.
 */

// Export all database schemas and types
export * from './database/index.js';

// Export all shared application types (selective to avoid conflicts)
export type {
  Message,
  ResearchDocument,
  BlogPost,
  UserProfile,
  HealthProfile,
  SupplementInfo,
  LabResultInfo,
  ChartSeries,
  ApiResponse,
  UsageLimits,
  SubscriptionTier,
  User as AppUser,
  ExpressUser,
  BiomarkerDataPoint,
  Series,
  ChartApiResponse,
  TrendApiResponse,
  TrendPoint,
  TrendSeries,
  ChartConfig,
  ChartFilters,
  ChartDataRequest,
  ChartAggregation
} from './types/index.js';