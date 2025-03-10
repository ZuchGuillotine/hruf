
// server/tests/setup.ts

import { db } from '@db';
import logger from '../utils/logger';

// Provides global test setup and teardown
beforeAll(async () => {
  logger.info('Setting up test environment');
  
  // Verify database connection
  try {
    await db.query.users.findFirst();
    logger.info('Database connection verified');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw new Error('Unable to connect to database for testing');
  }
});

afterAll(async () => {
  logger.info('Tearing down test environment');
  
  // Add any cleanup tasks here
  // We're not closing the database connection since it might be needed by other tests
});

// Mock functions for testing
export const createMockUser = async (overrides = {}) => {
  return {
    id: 999,
    username: 'testuser',
    email: 'test@example.com',
    isVerified: true,
    isPro: false,
    ...overrides
  };
};

// Helper to estimate token count
export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4); // Rough estimation: ~4 characters per token for English
};
