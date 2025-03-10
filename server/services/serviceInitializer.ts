
// server/services/serviceInitializer.ts

import { embeddingService } from './embeddingService';
import { advancedSummaryService } from './advancedSummaryService';
import { summaryTaskManager } from '../cron/summaryManager';
import logger from '../utils/logger';

/**
 * Initializes all services required for the hybrid context approach
 */
class ServiceInitializer {
  /**
   * Initialize all services in the correct order
   */
  async initializeServices(): Promise<void> {
    try {
      logger.info('Starting service initialization...');
      
      // Initialize PGVector services first
      await this.initializePGVector();
      
      // Initialize summarization services
      await this.initializeSummarization();
      
      // Start scheduled tasks if in production mode
      if (process.env.NODE_ENV === 'production') {
        this.startScheduledTasks();
      } else {
        logger.info('Scheduled tasks not started in development mode');
      }
      
      logger.info('Service initialization completed successfully');
    } catch (error) {
      logger.error('Service initialization failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Even if initialization fails, we'll continue running the app
      // This allows the app to function with reduced capabilities
    }
  }
  
  /**
   * Initialize PGVector related services
   */
  private async initializePGVector(): Promise<void> {
    try {
      logger.info('Initializing PGVector services...');
      
      // Verify PGVector availability by checking if extension is installed
      // We'll do a simple query to ensure the extension is working
      /* 
      This step is handled by our migration, but we'll leave a placeholder
      for any additional initialization that might be needed in the future
      */
      
      logger.info('PGVector services initialized successfully');
    } catch (error) {
      logger.error('PGVector initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize summarization services
   */
  private async initializeSummarization(): Promise<void> {
    try {
      logger.info('Initializing summarization services...');
      
      // Verify OpenAI API access for summarization
      try {
        // Perform a simple test to ensure OpenAI connectivity
        const testEmbedding = await embeddingService.generateEmbedding('Test embedding generation');
        logger.info('OpenAI embedding generation verified successfully');
      } catch (error) {
        logger.error('OpenAI embedding test failed:', error);
        throw new Error('OpenAI API connectivity check failed. Please verify your API key.');
      }
      
      logger.info('Summarization services initialized successfully');
    } catch (error) {
      logger.error('Summarization service initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Start scheduled tasks for summarization
   */
  private startScheduledTasks(): void {
    try {
      logger.info('Starting scheduled tasks...');
      
      // Start daily summary task to run at 1 AM
      summaryTaskManager.startDailySummaryTask(1);
      
      // Start weekly summary task to run on Sunday at 2 AM
      summaryTaskManager.startWeeklySummaryTask(0, 2);
      
      logger.info('Scheduled tasks started successfully');
    } catch (error) {
      logger.error('Failed to start scheduled tasks:', error);
      // We'll continue even if tasks fail to start
    }
  }
  
  /**
   * Function to gracefully shut down services
   * Called when the application is shutting down
   */
  async shutdownServices(): Promise<void> {
    try {
      logger.info('Shutting down services...');
      
      // Stop all scheduled tasks
      summaryTaskManager.stopAllTasks();
      
      logger.info('Services shut down successfully');
    } catch (error) {
      logger.error('Error shutting down services:', error);
      // Continue shutdown process even if errors occur
    }
  }
}

// Export singleton instance
export const serviceInitializer = new ServiceInitializer();
