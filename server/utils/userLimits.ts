import { db } from '../../db';
import { qualitativeLogs, queryChats, users } from '../../db/schema';
import { eq, and, count, sql, desc, gte } from 'drizzle-orm';
import logger from './logger';

/**
 * Limit status response for daily LLM usage
 */
interface LimitStatus {
  /**
   * Whether the user has reached their daily limit
   */
  hasReachedLimit: boolean;
  
  /**
   * The current count of LLM requests for the day
   */
  currentCount: number;
  
  /**
   * Whether the user is on a paid subscription (not on trial)
   */
  isPro: boolean;
  
  /**
   * Whether the user is on a free trial
   */
  isOnTrial: boolean;
}

// Rate limit of 10 requests per day for free users
const DAILY_FREE_LIMIT = 10;

/**
 * Check if a user has reached their daily LLM message limit
 * @param userId The user ID to check limits for
 * @returns Status of the user's limit usage
 */
export async function checkUserLLMLimit(userId: number): Promise<LimitStatus> {
  try {
    // First, check if the user is on a paid subscription
    const userResult = await db
      .select({
        isPro: users.isPro,
        subscriptionStatus: users.subscriptionStatus,
        trialEndsAt: users.trialEndsAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      // User not found - return as not at limit to fail gracefully
      logger.warn(`User not found for limit check: ${userId}`);
      return {
        hasReachedLimit: false,
        currentCount: 0,
        isPro: false,
        isOnTrial: true,
      };
    }

    const { isPro, subscriptionStatus, trialEndsAt } = userResult[0];
    
    // Ensure isPro is a boolean
    const isProSubscriber = !!isPro;
    
    // Determine if the user is on a trial based on subscription status and trial end date
    const isOnTrial = 
      !isProSubscriber && 
      (subscriptionStatus === 'trial' || 
       (trialEndsAt && new Date() < new Date(trialEndsAt)));

    // If the user is on a paid subscription, they have no limit
    if (isProSubscriber) {
      return {
        hasReachedLimit: false,
        currentCount: 0,
        isPro: true,
        isOnTrial: false,
      };
    }

    // Get the start of today (UTC)
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Count qualitative logs for today
    const qualitativeLogsCount = await db
      .select({ count: count() })
      .from(qualitativeLogs)
      .where(
        and(
          eq(qualitativeLogs.userId, userId),
          gte(qualitativeLogs.createdAt, startOfDay)
        )
      );

    // Count query chats for today
    const queryChatsCount = await db
      .select({ count: count() })
      .from(queryChats)
      .where(
        and(
          eq(queryChats.userId, userId),
          gte(queryChats.createdAt, startOfDay)
        )
      );

    // Total AI interactions for today
    const totalCount = 
      (qualitativeLogsCount[0]?.count || 0) + 
      (queryChatsCount[0]?.count || 0);

    // Check if the user has reached their daily limit
    const hasReachedLimit = !!isOnTrial && totalCount >= DAILY_FREE_LIMIT;

    return {
      hasReachedLimit,
      currentCount: totalCount,
      isPro: !!isPro,
      isOnTrial: !!isOnTrial,
    };
  } catch (error) {
    logger.error(`Error checking user LLM limit:`, {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // In case of error, return as not at limit to fail gracefully
    return {
      hasReachedLimit: false,
      currentCount: 0,
      isPro: false,
      isOnTrial: true,
    };
  }
}