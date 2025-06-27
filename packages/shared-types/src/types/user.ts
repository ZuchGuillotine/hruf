import type { InferSelectModel } from 'drizzle-orm';
import type { 
  users, 
  healthStats, 
  supplements, 
  labResults, 
  biomarkerResults, 
  qualitativeLogs, 
  queryChatLogs 
} from '../database/schema.js';

/**
 * User type with sensitive fields omitted for client use
 */
export type User = Omit<InferSelectModel<typeof users>, 'password' | 'verificationToken' | 'verificationTokenExpiry'> & {
    password?: string | null;
    emailVerified?: boolean | null;
    name?: string | null;
    phoneNumber?: string | null;
    trialEndsAt?: Date | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
};

/**
 * Health statistics type
 */
export type HealthStats = InferSelectModel<typeof healthStats>;

/**
 * Supplement type
 */
export type Supplement = InferSelectModel<typeof supplements>;

/**
 * Lab result type
 */
export type LabResult = InferSelectModel<typeof labResults>;

/**
 * Biomarker result type
 */
export type BiomarkerResult = InferSelectModel<typeof biomarkerResults>;

/**
 * Qualitative log type
 */
export type QualitativeLog = InferSelectModel<typeof qualitativeLogs>;

/**
 * Query chat log type
 */
export type QueryChatLog = InferSelectModel<typeof queryChatLogs>;

/**
 * Express.js user type extension for authentication
 * This is used server-side but can be useful for typing authentication responses
 */
export interface ExpressUser {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  phoneNumber?: string | null;
  subscriptionTier?: string;
  isAdmin?: boolean | null;
  trialEndsAt?: Date | null;
}