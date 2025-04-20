// server/utils/userLimits.ts

import { db } from '../../db';
import { qualitativeLogs, users } from '../../db/schema';
import { eq, gte, and, sql } from 'drizzle-orm';

/**
 * Daily request limit for users on the free trial
 */
export const FREE_TRIAL_DAILY_LIMIT = 10;

/**
 * Check if a user has reached their daily limit for LLM requests
 * This applies to both qualitative and query chats
 * 
 * @param userId User ID to check
 * @returns {Promise<{ hasReachedLimit: boolean, currentCount: number, isPro: boolean, isOnTrial: boolean }>} Limit status
 */
export async function checkUserLLMLimit(userId: number): Promise<{ 
  hasReachedLimit: boolean;
  currentCount: number; 
  isPro: boolean;
  isOnTrial: boolean;
}> {
  try {
    // First check if the user is on Pro plan or free trial
    const [userInfo] = await db
      .select({
        isPro: users.isPro,
        trialEndsAt: users.trialEndsAt
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!userInfo) {
      throw new Error(`User not found: ${userId}`);
    }

    // Pro users have unlimited access
    if (userInfo.isPro) {
      return {
        hasReachedLimit: false,
        currentCount: 0,
        isPro: true,
        isOnTrial: false
      };
    }

    // Check if user is on trial
    const now = new Date();
    const isOnTrial = userInfo.trialEndsAt ? now < userInfo.trialEndsAt : false;

    // If not on trial and not Pro, they've reached their limit
    if (!isOnTrial) {
      return {
        hasReachedLimit: true,
        currentCount: 0,
        isPro: false,
        isOnTrial: false
      };
    }

    // Check today's count for both qualitative and query chats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count all LLM requests for today (both qualitative and query chats)
    const [dailyCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qualitativeLogs)
      .where(
        and(
          eq(qualitativeLogs.userId, userId),
          gte(qualitativeLogs.createdAt, today),
          sql`type IN ('chat', 'query')`
        )
      );

    // Check if the user has reached their daily limit
    const currentCount = dailyCount.count;
    const hasReachedLimit = currentCount >= FREE_TRIAL_DAILY_LIMIT;

    return {
      hasReachedLimit,
      currentCount,
      isPro: false,
      isOnTrial: true
    };
  } catch (error) {
    console.error('Error checking user LLM limit:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Default to not limiting if there's an error
    return {
      hasReachedLimit: false,
      currentCount: 0,
      isPro: false,
      isOnTrial: true
    };
  }
}