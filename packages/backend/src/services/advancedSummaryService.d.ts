/**
 * Improved summary service that consolidates logs using OpenAI
 */
declare class AdvancedSummaryService {
  private SUMMARY_MODEL;
  private MAX_TOKEN_LIMIT;
  private MAX_LOGS_PER_REQUEST;
  private DAILY_SUMMARY_PROMPT;
  private SUPPLEMENT_SUMMARY_PROMPT;
  /**
   * Generates summary for a single day's logs
   * @param userId User ID
   * @param date Date to summarize
   * @returns The created summary ID
   */
  generateDailySummary(userId: number, date: Date): Promise<number | null>;
  /**
   * Generate weekly summary from daily summaries
   * @param userId User ID
   * @param startDate Start date of the week
   * @param endDate End date of the week
   * @returns The created summary ID
   */
  generateWeeklySummary(userId: number, startDate: Date, endDate: Date): Promise<number | null>;
  /**
   * Extracts significant changes mentioned in a summary
   */
  private extractSignificantChanges;
  /**
   * Process daily summaries for all users for a specific date
   * @param date Date to process
   */
  processDailySummaries(date?: Date): Promise<void>;
  /**
   * Process weekly summaries for all users
   * @param endDate End date of the week (typically Sunday)
   */
  processWeeklySummaries(endDate?: Date): Promise<void>;
  /**
   * Generate summary for a specific log entry
   * @param logId ID of the log
   * @param logType Type of log (qualitative or quantitative)
   */
  generateLogSummary(
    logId: number,
    logType: 'qualitative' | 'quantitative'
  ): Promise<string | null>;
  /**
   * Retrieves the most relevant summaries for a user query
   * @param userId User ID
   * @param query User query text
   * @param limit Maximum number of summaries to return
   * @returns Array of relevant summaries
   */
  getRelevantSummaries(userId: number, query: string, limit?: number): Promise<any[]>;
  /**
   * Generate a summary of supplement patterns and changes
   * @param userId User ID
   * @param days Number of days to analyze
   * @returns The created summary ID
   */
  generateSupplementPatternSummary(userId: number, days?: number): Promise<number | null>;
}
export declare const advancedSummaryService: AdvancedSummaryService;
export {};
//# sourceMappingURL=advancedSummaryService.d.ts.map
