/**
 * Common types shared across web and mobile applications
 */

/**
 * Message interface for chat interactions
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Research document interface that matches the database schema
 */
export interface ResearchDocument {
  id: number;
  title: string;
  slug: string;
  summary: string;
  excerpt?: string; // Client-side convenience alias for summary
  content: string;
  authors: string; // Stored as text in DB, parsed to array if necessary
  imageUrls?: string[]; // Matches the DB column name
  thumbnailUrl?: string; // Client-side convenience alias for first imageUrl
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
}

/**
 * Blog post interface
 */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  publishedAt: string;
  slug: string;
  updatedAt?: string;
}

/**
 * Chart series data structure
 */
export interface ChartSeries {
  name: string;
  data: any[];
  color?: string;
}

/**
 * User profile information (sanitized for client use)
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  phoneNumber?: string | null;
  subscriptionTier?: string;
  isAdmin?: boolean | null;
  emailVerified?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Health statistics profile
 */
export interface HealthProfile {
  userId: number;
  weight?: string | null;
  height?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  dateOfBirth?: Date | null;
  averageSleep?: number | null; // in minutes
  profilePhotoUrl?: string | null;
  allergies?: string | null;
  lastUpdated: Date;
}

/**
 * Supplement information
 */
export interface SupplementInfo {
  id: number;
  userId?: number | null;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string | null;
  active?: boolean | null;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lab result file information
 */
export interface LabResultInfo {
  id: number;
  userId: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  notes?: string | null;
  metadata?: LabResultMetadata;
}

/**
 * Lab result metadata structure
 */
export interface LabResultMetadata {
  size: number;
  lastViewed?: string;
  tags?: string[];
  parsedText?: string;
  parseDate?: string;
  ocr?: {
    text: string;
    processedAt: string;
    confidence: number;
    engineVersion: string;
    parameters: Record<string, unknown>;
  };
  extractedText?: string;
  extractionMethod?: string;
  extractionDate?: string;
  summary?: string;
  summarizedAt?: string;
  preprocessedText?: {
    rawText: string;
    normalizedText: string;
    processingMetadata: {
      originalFormat: string;
      processingSteps: string[];
      confidence?: number;
      ocrEngine?: string;
      processingTimestamp: string;
      textLength: number;
      lineCount: number;
      hasHeaders: boolean;
      hasFooters: boolean;
      qualityMetrics?: {
        whitespaceRatio: number;
        specialCharRatio: number;
        numericRatio: number;
        potentialOcrErrors: number;
      };
    };
  };
  biomarkers?: {
    parsedBiomarkers: Array<{
      name: string;
      value: number;
      unit: string;
      referenceRange?: string;
      testDate?: string;
      category?: string;
    }>;
    parsingErrors: string[];
    extractedAt: string;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for various queries
 */
export interface FilterParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  userId?: number;
}

/**
 * Subscription tier information
 */
export interface SubscriptionTier {
  name: string;
  aiInteractionsLimit: number;
  labUploadsLimit: number;
  features: string[];
}

/**
 * Usage limits and tracking
 */
export interface UsageLimits {
  aiInteractionsCount: number;
  aiInteractionsLimit: number;
  aiInteractionsReset?: Date | null;
  labUploadsCount: number;
  labUploadsLimit: number;
  labUploadsReset?: Date | null;
}