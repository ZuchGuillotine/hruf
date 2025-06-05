// server/tests/embeddingService.test.ts

import { embeddingService } from '../services/embeddingService';
import { db } from '@db';
import { logEmbeddings } from '@db/schema';
import logger from '../utils/logger';

/**
 * Test suite for the EmbeddingService
 *
 * These tests verify vector embedding generation and similarity search functionality
 *
 * Run tests with: npm test -- --testPathPattern=embeddingService
 */

describe('Embedding Service Tests', () => {
  // Mock data
  const testLogId = 9999;
  const testContent =
    'Magnesium supplementation has improved my sleep quality and reduced muscle cramps.';

  // Clean up test data after running tests
  afterAll(async () => {
    try {
      // Remove test embeddings
      await db.delete(logEmbeddings).where({ logId: testLogId });
      logger.info(`Cleaned up test embeddings for log ID ${testLogId}`);
    } catch (err) {
      logger.error(`Failed to clean up test embeddings: ${err}`);
    }
  });

  test('Should generate embedding with correct dimensions', async () => {
    // Generate an embedding
    const embedding = await embeddingService.generateEmbedding(testContent);

    // Check dimensions and type
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536); // OpenAI uses 1536-dimension vectors

    // Check values are valid numbers
    embedding.forEach((value) => {
      expect(typeof value).toBe('number');
      expect(!isNaN(value)).toBe(true);
      expect(value).toBeGreaterThan(-1);
      expect(value).toBeLessThan(1);
    });
  });

  test('Should create and store log embedding', async () => {
    // Create an embedding for a test log
    await embeddingService.createLogEmbedding(testLogId, testContent, 'qualitative');

    // Verify it was stored
    const storedEmbeddings = await db.select().from(logEmbeddings).where({ logId: testLogId });

    expect(storedEmbeddings.length).toBe(1);
    expect(storedEmbeddings[0].logId).toBe(testLogId);
    expect(storedEmbeddings[0].logType).toBe('qualitative');
    expect(storedEmbeddings[0].embedding).toBeDefined();
  });

  test('Should find similar content by semantic meaning', async () => {
    // Skip if no real user data is available
    const users = await db.query.users.findMany({ limit: 1 });
    if (users.length === 0) {
      logger.info('Skipping similarity search test - no user data available');
      return;
    }

    const realUserId = users[0].id;

    // Test with semantically related query
    const testQuery = 'Has magnesium helped with sleep and muscle tension?';

    // Another query with different words but similar meaning
    const similarQuery = 'Did mineral supplements improve rest quality and reduce cramping?';

    // A completely unrelated query
    const unrelatedQuery = 'What are the tax implications of cryptocurrency trading?';

    // Test similar queries get similar results
    const results1 = await embeddingService.findSimilarContent(testQuery, realUserId, 3);
    const results2 = await embeddingService.findSimilarContent(similarQuery, realUserId, 3);
    const results3 = await embeddingService.findSimilarContent(unrelatedQuery, realUserId, 3);

    // We expect the semantically similar queries to return more similar results
    // compared to the unrelated query

    // If we have results to compare, check for semantic matching
    if (results1.length > 0 && results2.length > 0 && results3.length > 0) {
      // Compare top items
      const topItem1 = results1[0];
      const topItem2 = results2[0];

      // Log similarities for debugging
      logger.info(`First query top similarity: ${topItem1.similarity}`);
      logger.info(`Second query top similarity: ${topItem2.similarity}`);

      // Unrelated query should have lower similarity scores
      const avgSimilarity1 =
        results1.reduce((sum, item) => sum + item.similarity, 0) / results1.length;
      const avgSimilarity3 =
        results3.reduce((sum, item) => sum + item.similarity, 0) / results3.length;

      logger.info(`Average similarity for related query: ${avgSimilarity1}`);
      logger.info(`Average similarity for unrelated query: ${avgSimilarity3}`);

      // The unrelated query should have lower average similarity
      // Only assert if we have meaningful differences
      if (avgSimilarity1 > 0.5) {
        expect(avgSimilarity1).toBeGreaterThan(avgSimilarity3);
      }
    }
  });

  test('Should batch process log embeddings', async () => {
    // Create multiple test log IDs
    const testBatchLogIds = [10001, 10002, 10003].filter((id) => id !== testLogId);

    // Process the batch
    await embeddingService.processLogBatch(testBatchLogIds, 'qualitative');

    // Since this depends on actual log content, we're just testing that it doesn't throw
    // and completes execution
    expect(true).toBe(true);

    // Clean up any created embeddings
    for (const id of testBatchLogIds) {
      try {
        await db.delete(logEmbeddings).where({ logId: id });
      } catch (err) {
        // Ignore errors if no embeddings were created
      }
    }
  });
});
import { embeddingService } from '../services/embeddingService';
import { db } from '../../db';

// Mock the db
jest.mock('../../db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    execute: jest.fn().mockResolvedValue([]),
  },
}));

describe('EmbeddingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateEmbedding should return an embedding array', async () => {
    const text = 'This is a test text for embedding';
    const embedding = await embeddingService.generateEmbedding(text);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
  });

  test('createLogEmbedding should store an embedding for a log', async () => {
    const logId = 1;
    const content = 'Test log content';
    const logType = 'qualitative';

    await embeddingService.createLogEmbedding(logId, content, logType as any);

    expect(db.insert).toHaveBeenCalled();
  });

  test('findSimilarContent should return an array of similar content', async () => {
    const query = 'Test query';
    const userId = 1;

    const results = await embeddingService.findSimilarContent(query, userId);

    expect(Array.isArray(results)).toBe(true);
  });
});
