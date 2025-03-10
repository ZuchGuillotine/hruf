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

// Mock the OpenAI client
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation(({ stream }) => {
              if (stream) {
                // Mock streaming response
                const mockGenerator = async function* () {
                  yield { choices: [{ delta: { content: 'This ' } }] };
                  yield { choices: [{ delta: { content: 'is ' } }] };
                  yield { choices: [{ delta: { content: 'a ' } }] };
                  yield { choices: [{ delta: { content: 'mock ' } }] };
                  yield { choices: [{ delta: { content: 'response' } }] };
                };
                return mockGenerator();
              } else {
                // Mock non-streaming response
                return Promise.resolve({
                  choices: [
                    {
                      message: {
                        content: 'This is a mock OpenAI response',
                      },
                    },
                  ],
                });
              }
            }),
          },
        },
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: Array(1536).fill(0.1) }]
          })
        }
      };
    }),
  };
});