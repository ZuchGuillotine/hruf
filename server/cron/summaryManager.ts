// server/cron/summaryManager.ts

import { advancedSummaryService } from '../services/advancedSummaryService';
import logger from '../utils/logger';

/**
 * Class for managing scheduled summary tasks
 */
class SummaryTaskManager {
  private dailyInterval: NodeJS.Timeout | null = null;
  private weeklyInterval: NodeJS.Timeout | null = null;

  /**
   * Start the daily summary task
   * Runs at the specified hour each day (default: 1 AM)
   */
  startDailySummaryTask(hour: number = 1): void {
    if (this.dailyInterval) {
      clearInterval(this.dailyInterval);
    }

    logger.info(`Starting daily summary task to run at ${hour}:00 AM daily`);

    // Calculate time until first run
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(hour, 0, 0, 0);

    // If it's already past the scheduled time, set for tomorrow
    if (now.getTime() > nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilFirstRun = nextRun.getTime() - now.getTime();
    logger.info(`Daily summary task will first run in ${Math.round(timeUntilFirstRun / (60 * 1000))} minutes`);

    // Set timeout for first run
    setTimeout(() => {
      // Run task
      this.runDailySummaryTask();

      // Set up interval to run daily
      this.dailyInterval = setInterval(() => {
        this.runDailySummaryTask();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilFirstRun);
  }

  /**
   * Start the weekly summary task
   * Runs on the specified day of week at the specified hour (default: Sunday 2 AM)
   */
  startWeeklySummaryTask(dayOfWeek: number = 0, hour: number = 2): void {
    if (this.weeklyInterval) {
      clearInterval(this.weeklyInterval);
    }

    logger.info(`Starting weekly summary task to run on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} at ${hour}:00 AM`);

    // Calculate time until first run
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(hour, 0, 0, 0);

    // Adjust to next occurrence of the target day of week
    const daysUntilTarget = (7 + dayOfWeek - now.getDay()) % 7;
    nextRun.setDate(nextRun.getDate() + daysUntilTarget);

    // If it's the target day but already past the time, move to next week
    if (daysUntilTarget === 0 && now.getTime() > nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 7);
    }

    const timeUntilFirstRun = nextRun.getTime() - now.getTime();
    logger.info(`Weekly summary task will first run in ${Math.round(timeUntilFirstRun / (60 * 60 * 1000))} hours`);

    // Set timeout for first run
    setTimeout(() => {
      // Run task
      this.runWeeklySummaryTask();

      // Set up interval to run weekly
      this.weeklyInterval = setInterval(() => {
        this.runWeeklySummaryTask();
      }, 7 * 24 * 60 * 60 * 1000); // 7 days
    }, timeUntilFirstRun);
  }

  /**
   * Run the daily summary task (yesterday's data)
   */
  async runDailySummaryTask(): Promise<void> {
    try {
      logger.info('Running daily summary task');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await advancedSummaryService.processDailySummaries(yesterday);
      logger.info('Daily summary task completed successfully');
    } catch (error) {
      logger.error('Error running daily summary task:', error);
    }
  }

  /**
   * Run the weekly summary task (last week's data)
   */
  async runWeeklySummaryTask(): Promise<void> {
    try {
      logger.info('Running weekly summary task');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await advancedSummaryService.processWeeklySummaries(yesterday);
      logger.info('Weekly summary task completed successfully');
    } catch (error) {
      logger.error('Error running weekly summary task:', error);
    }
  }

  /**
   * Run a real-time summary update for a specific user
   * This is useful for generating summaries on demand when needed
   * Generates summaries for both today and yesterday to ensure sufficient data
   */
  async runRealtimeSummary(userId: number): Promise<void> {
    try {
      logger.info(`Running real-time summary for user ${userId}`);

      // Today's date
      const today = new Date();
      
      // Also look at recent days to ensure we have sufficient data
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Generate summary for today's data
      const todaySummaryId = await advancedSummaryService.generateDailySummary(userId, today);
      
      // Also generate or ensure yesterday's summary exists
      const yesterdaySummaryId = await advancedSummaryService.generateDailySummary(userId, yesterday);
      
      logger.info(`Real-time summary completed for user ${userId}:`, {
        todaySummaryId,
        yesterdaySummaryId
      });
      
      return;
    } catch (error) {
      logger.error(`Error running real-time summary for user ${userId}:`, error);
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks(): void {
    if (this.dailyInterval) {
      clearInterval(this.dailyInterval);
      this.dailyInterval = null;
    }

    if (this.weeklyInterval) {
      clearInterval(this.weeklyInterval);
      this.weeklyInterval = null;
    }

    logger.info('All summary tasks stopped');
  }
}

// Export singleton instance
export const summaryTaskManager = new SummaryTaskManager();