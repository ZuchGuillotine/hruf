import path from 'path';
import fs from 'fs';
import embeddingService from './embeddingService';
import { advancedSummaryService } from './advancedSummaryService';
import { summaryTaskManager } from '../cron/summaryManager';
import { labSummaryService } from './labSummaryService';
import { supplementService } from './supplements';
import logger from '../utils/logger';

/**
 * Initializes all services required for the hybrid context approach
 */
class ServiceInitializer {
  /**
   * Initialize all services in the correct order (non-blocking)
   */
  async initializeServices(): Promise<void> {
    // Skip all expensive operations during deployment mode
    const isDeploymentMode = process.env.REPLIT_DEPLOYMENT === 'true' || 
                             process.env.REPLIT_DEPLOYMENT === '1' ||
                             process.env.RAILWAY_ENVIRONMENT === 'production' ||
                             process.env.VERCEL === '1' ||
                             process.env.NETLIFY === 'true';
    
    logger.info('ServiceInitializer deployment check:', {
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
      isDeploymentMode,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (isDeploymentMode) {
      logger.info('DEPLOYMENT MODE DETECTED IN SERVICE INITIALIZER - SKIPPING ALL SERVICE INITIALIZATION');
      return;
    }

    logger.info('Starting background service initialization...');

    // Initialize services with individual error handling to prevent one failure from stopping others
    const initPromises = [
      this.initializePGVector().catch(error => {
        logger.error('PGVector initialization failed (continuing):', error);
      }),
      this.initializeSummarization().catch(error => {
        logger.error('Summarization initialization failed (continuing):', error);
      }),
      this.initializeLabServices().catch(error => {
        logger.error('Lab services initialization failed (continuing):', error);
      }),
      this.initializeSupplementService().catch(error => {
        logger.error('Supplement service initialization failed (continuing):', error);
      })
    ];

    // Wait for all services to attempt initialization
    await Promise.allSettled(initPromises);

    // Start scheduled tasks if in production mode (but not deployment mode)
    try {
      const isDeploymentMode = process.env.REPLIT_DEPLOYMENT === 'true' || 
                               process.env.RAILWAY_ENVIRONMENT === 'production' ||
                               process.env.VERCEL === '1' ||
                               process.env.NETLIFY === 'true';
      
      if (process.env.NODE_ENV === 'production' && !isDeploymentMode) {
        this.startScheduledTasks();
      } else {
        logger.info('Scheduled tasks not started in development/deployment mode');
      }
    } catch (error) {
      logger.error('Failed to start scheduled tasks (continuing):', error);
    }

    logger.info('Background service initialization completed');
  }

  /**
   * Initialize PGVector related services
   */
  private async initializePGVector(): Promise<void> {
    try {
      logger.info('Initializing PGVector services...');

      // Verify PGVector availability and initialize embedding service
      const initialized = await embeddingService.initialize();

      if (!initialized) {
        throw new Error('Failed to initialize embedding service');
      }

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
   * Initialize lab results services
   */
  private async initializeLabServices(): Promise<void> {
    try {
      logger.info('Initializing lab results services...');

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          logger.info('Created uploads directory at:', uploadsDir);
        }

        // Verify directory permissions
        fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
        logger.info('Uploads directory verified with correct permissions');

        // Pre-load required modules for lab processing to avoid initialization issues
        logger.info('Preloading PDF processing modules...');
        try {
          // Dynamically import pdf-parse to ensure it's loaded correctly
          import('pdf-parse').then(() => {
            logger.info('PDF processing module loaded successfully');
          }).catch(err => {
            logger.warn('PDF processing module preload warning (non-fatal):', err);
          });
        } catch (moduleError) {
          logger.warn('Module preloading warning (non-fatal):', moduleError);
        }
      } catch (error) {
        logger.error('Failed to setup uploads directory:', error);
        throw error; // This is critical enough to fail startup
      }

      logger.info('Lab results services initialized successfully');
    } catch (error) {
      logger.error('Lab services initialization failed:', error);
      // Continue even if lab services fail to initialize
    }
  }

  /**
   * Initialize supplement services
   */
  private async initializeSupplementService(): Promise<void> {
    try {
      logger.info('Initializing supplement services...');

      // Initialize supplement service (non-blocking)
      supplementService.initialize(); // Don't await - let it run in background

      logger.info('Supplement services initialized successfully');
    } catch (error) {
      logger.error('Supplement service initialization failed:', error);
      // Continue even if supplement service fails to initialize
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

      // Start lab processing task to run daily at 3 AM
      summaryTaskManager.startLabProcessingTask(3);

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