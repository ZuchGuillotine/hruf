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
  isPaidTier: boolean;
  /**
   * Whether the user is on a free trial
   */
  isOnTrial: boolean;
}
/**
 * Check if a user has reached their daily LLM message limit
 * @param userId The user ID to check limits for
 * @returns Status of the user's limit usage
 */
export declare function checkUserLLMLimit(userId: number): Promise<LimitStatus>;
export {};
//# sourceMappingURL=userLimits.d.ts.map
