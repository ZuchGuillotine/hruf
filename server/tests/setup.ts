import { sql } from '@vercel/postgres';
import { db } from '../../db';
import logger from '../utils/logger';

// Silence logs during tests
logger.level = 'silent';

beforeAll(async () => {
  // Set up test database if needed
  try {
    // Any test database setup can go here
    console.log('Test setup complete');
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up test database
  try {
    // Any test database cleanup can go here
    console.log('Test cleanup complete');
  } catch (error) {
    console.error('Error in test cleanup:', error);
  }
});

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation(({ stream }: { stream: boolean }) => {
              if (stream) {
                const mockStream = {
                  controller: {
                    enqueue: jest.fn(),
                    close: jest.fn(),
                  },
                  [Symbol.asyncIterator]: function* () {
                    yield {
                      choices: [
                        {
                          delta: { content: 'This ' },
                          index: 0,
                        },
                      ],
                    };
                    yield {
                      choices: [
                        {
                          delta: { content: 'is a ' },
                          index: 0,
                        },
                      ],
                    };
                    yield {
                      choices: [
                        {
                          delta: { content: 'test.' },
                          index: 0,
                        },
                      ],
                    };
                  },
                };
                return mockStream;
              }
              return Promise.resolve({
                choices: [{ message: { content: 'This is a test response' } }],
              });
            }),
          },
        },
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              {
                embedding: new Array(1536).fill(0.1),
              },
            ],
          }),
        },
      };
    }),
  };
});
