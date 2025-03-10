
// server/tests/serviceInitializer.test.ts

import { serviceInitializer } from '../services/serviceInitializer';
import { embeddingService } from '../services/embeddingService';
import { summaryTaskManager } from '../cron/summaryManager';
import logger from '../utils/logger';

/**
 * Test suite for the ServiceInitializer
 * 
 * These tests verify proper initialization and shutdown of services
 * 
 * Run tests with: npm test -- --testPathPattern=serviceInitializer
 */

// Mock services
jest.mock('../services/embeddingService', () => ({
  embeddingService: {
    generateEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.1))
  }
}));

jest.mock('../cron/summaryManager', () => ({
  summaryTaskManager: {
    startDailySummaryTask: jest.fn(),
    startWeeklySummaryTask: jest.fn(),
    stopAllTasks: jest.fn()
  }
}));

describe('Service Initializer Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should initialize PGVector services', async () => {
    // Call the method
    await serviceInitializer.initializePGVector();
    
    // Verify it called embeddingService
    expect(embeddingService.generateEmbedding).toHaveBeenCalledTimes(1);
    
    // Should have called with test string
    const testArg = embeddingService.generateEmbedding.mock.calls[0][0];
    expect(typeof testArg).toBe('string');
    expect(testArg.length).toBeGreaterThan(0);
  });
  
  test('Should start scheduled tasks in production', async () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    
    // Set to production
    process.env.NODE_ENV = 'production';
    
    // Call the method
    await serviceInitializer.startScheduledTasks();
    
    // Verify it called summaryTaskManager
    expect(summaryTaskManager.startDailySummaryTask).toHaveBeenCalledTimes(1);
    expect(summaryTaskManager.startWeeklySummaryTask).toHaveBeenCalledTimes(1);
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
  
  test('Should not start scheduled tasks in development', async () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    
    // Set to development
    process.env.NODE_ENV = 'development';
    
    // Call the method
    await serviceInitializer.startScheduledTasks();
    
    // Verify it did NOT call summaryTaskManager
    expect(summaryTaskManager.startDailySummaryTask).not.toHaveBeenCalled();
    expect(summaryTaskManager.startWeeklySummaryTask).not.toHaveBeenCalled();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
  
  test('Should initialize all services', async () => {
    // Mock the individual initialization methods
    serviceInitializer.initializePGVector = jest.fn().mockResolvedValue(undefined);
    serviceInitializer.initializeSummarization = jest.fn().mockResolvedValue(undefined);
    serviceInitializer.startScheduledTasks = jest.fn().mockResolvedValue(undefined);
    
    // Call the main initialization method
    await serviceInitializer.initializeServices();
    
    // Verify all services were initialized
    expect(serviceInitializer.initializePGVector).toHaveBeenCalledTimes(1);
    expect(serviceInitializer.initializeSummarization).toHaveBeenCalledTimes(1);
    expect(serviceInitializer.startScheduledTasks).toHaveBeenCalledTimes(1);
  });
  
  test('Should properly shut down services', async () => {
    // Call the shutdown method
    await serviceInitializer.shutdownServices();
    
    // Verify it called summaryTaskManager.stopAllTasks
    expect(summaryTaskManager.stopAllTasks).toHaveBeenCalledTimes(1);
  });
});
