import type { z } from 'zod';

// Base API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  subscriptionTier: 'free' | 'starter' | 'pro';
  subscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  isAdmin?: boolean;
  aiInteractionsCount?: number;
  aiInteractionsReset?: Date | string | null;
  labUploadsCount?: number;
  labUploadsReset?: Date | string | null;
  isPro?: boolean;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  stripeSessionId?: string;
}

export interface GoogleAuthData {
  credential: string;
}

// Supplement Types
export interface Supplement {
  id: number;
  userId: number;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplementData {
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface UpdateSupplementData {
  name?: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
}

export interface SupplementSearchResult {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

// Supplement Log Types
export interface SupplementLog {
  id: number;
  userId: number;
  supplementId: number;
  takenAt: string;
  notes?: string;
  effects?: any;
  name?: string;
  dosage?: string;
  frequency?: string;
}

export interface CreateSupplementLogData {
  supplementId: number;
  takenAt: string;
  notes?: string;
  effects?: any;
}

export interface SupplementLogsResponse {
  supplements: SupplementLog[];
  qualitativeLogs: QualitativeLog[];
}

// Chat and LLM Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response?: string;
  error?: string;
  limitReached?: boolean;
  streaming?: boolean;
}

export interface ChatRequest {
  messages: Message[];
}

export interface QueryRequest {
  messages: Message[];
}

export interface SaveChatData {
  content: string;
  type?: string;
  tags?: string[];
}

// Qualitative Log Types
export interface QualitativeLog {
  id: number;
  userId: number;
  content: string;
  loggedAt: string;
  type: string;
  metadata?: any;
  summary?: string;
}

// Health Stats Types
export interface HealthStats {
  id?: number;
  userId: number;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dietaryRestrictions?: string;
  healthGoals?: string;
  medicalConditions?: string;
  currentMedications?: string;
  allergies?: string;
  sleepHours?: number;
  sleepMinutes?: number;
  averageSleep?: number;
  gender?: string;
  ethnicity?: string;
  lastUpdated?: string;
}

export interface UpdateHealthStatsData {
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dietaryRestrictions?: string;
  healthGoals?: string;
  medicalConditions?: string;
  currentMedications?: string;
  allergies?: string;
  sleepHours?: number;
  sleepMinutes?: number;
  gender?: string;
  ethnicity?: string;
}

// Lab Results Types
export interface LabResult {
  id: number;
  userId: number;
  filename: string;
  filePath: string;
  uploadedAt: string;
  processed: boolean;
  extractedText?: string;
  preprocessedText?: string;
  biomarkers?: any;
  processingMetadata?: any;
}

export interface BiomarkerDataPoint {
  name: string;
  value: number;
  unit: string;
  testDate: string;
  category: string;
  status: string | null;
}

export interface BiomarkerSeries {
  name: string;
  points: Array<{
    value: number;
    testDate: string;
    unit: string;
  }>;
  unit: string;
  category: string;
}

export interface LabChartData {
  series: BiomarkerSeries[];
  allBiomarkers: string[];
  categories: Record<string, string>;
}

// Admin Types
export interface SupplementReference {
  id: number;
  name: string;
  description?: string;
  category?: string;
  defaultDosage?: string;
  sideEffects?: string;
  interactions?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplementReferenceData {
  name: string;
  description?: string;
  category?: string;
  defaultDosage?: string;
  sideEffects?: string;
  interactions?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  publishedAt: string;
  updatedAt?: string;
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string;
  thumbnailUrl: string;
}

export interface ResearchDocument {
  id: number;
  title: string;
  slug: string;
  summary: string;
  excerpt?: string;
  content: string;
  authors: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
}

export interface CreateResearchDocumentData {
  title: string;
  summary: string;
  content: string;
  authors: string;
  imageUrls?: string[];
  tags?: string[];
}

// Summary Types
export interface LogSummary {
  id: number;
  userId: number;
  summaryType: 'daily' | 'weekly';
  content: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  metadata?: any;
}

// Streak Types
export interface SupplementStreak {
  currentStreak: number;
}

// Configuration Types
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}

// Error Types
export interface ApiError extends Error {
  status?: number;
  response?: any;
}

// Utility Types
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}