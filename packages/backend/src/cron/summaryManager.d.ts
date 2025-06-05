/**
 * Class for managing scheduled summary tasks
 */
declare class SummaryTaskManager {
  private dailyInterval;
  private weeklyInterval;
  private labProcessingTask;
  /**
   * Start the daily summary task
   * Runs at the specified hour each day (default: 1 AM)
   */
  startDailySummaryTask(hour?: number): void;
  /**
   * Start the weekly summary task
   * Runs on the specified day of week at the specified hour (default: Sunday 2 AM)
   */
  startWeeklySummaryTask(dayOfWeek?: number, hour?: number): void;
  /**
   * Run the daily summary task (yesterday's data)
   */
  runDailySummaryTask(): Promise<void>;
  /**
   * Run the weekly summary task (last week's data)
   */
  runWeeklySummaryTask(): Promise<void>;
  /**
   * Run a real-time summary update for a specific user
   * This is useful for generating summaries on demand when needed
   * Generates summaries for both today and yesterday to ensure sufficient data
   */
  runRealtimeSummary(userId: number): Promise<void>;
  /**
   * Stop all scheduled tasks
   */
  /**
   * Start lab results processing task
   * @param hour Hour of the day to run the task (0-23)
   */
  /**
   * Start lab results processing task
   * @param hour Hour of the day to run the task (0-23)
   */
  startLabProcessingTask(hour?: number): void;
  /**
   * Process all lab results that haven't been summarized yet
   */
  processUnprocessedLabResults(): Promise<void>;
  stopAllTasks(): void;
}
export declare const summaryTaskManager: SummaryTaskManager;
export {};
//# sourceMappingURL=summaryManager.d.ts.map
