
// server/services/embeddingService.ts

import { OpenAI } from "openai";
import logger from "../utils/logger";
import { db } from "../../db";
import { logEmbeddings, summaryEmbeddings, logSummaries } from "../../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { LRUCache } from "lru-cache";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-testing'
});

/**
 * Service for generating and managing embeddings for vector search
 */
class EmbeddingService {
  // Constants
  private EMBEDDING_MODEL = "text-embedding-ada-002";
  private EMBEDDING_DIMENSIONS = 1536;
  private BATCH_SIZE = 5; // Number of items to process in a batch
  private SIMILARITY_THRESHOLD = 0.75; // Cosine similarity threshold
  
  // LRU Cache for embeddings
  private embeddingCache: LRUCache<string, number[]>;
  
  constructor() {
    // Initialize cache with TTL of 1 day and max size of 500 entries
    this.embeddingCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      allowStale: false
    });
    
    logger.info('Embedding service initialized with LRU cache');
  }

  /**
   * Initialize the embedding service
   * Verifies OpenAI connection and database setup
   * @returns Promise<boolean> indicating initialization success
   */
  async initialize(testQuery?: string): Promise<boolean> {
    try {
      logger.info('Initializing EmbeddingService...');
      
      // Verify OpenAI connectivity with a test embedding
      const testText = testQuery || "Test embedding service initialization";
      const testEmbedding = await this.generateEmbedding(testText);
      
      if (!testEmbedding || testEmbedding.length !== this.EMBEDDING_DIMENSIONS) {
        logger.error('Test embedding generation failed: incorrect dimensions');
        return false;
      }
      
      logger.info('EmbeddingService initialized successfully');
      return true;
    } catch (error) {
      logger.error('EmbeddingService initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate an embedding for a text string with caching
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Create a cache key - use a hash of the text to avoid key size issues
      const cacheKey = this.hashText(text);
      
      // Check cache first
      const cachedEmbedding = this.embeddingCache.get(cacheKey);
      if (cachedEmbedding) {
        logger.debug('Cache hit for embedding', {
          textLength: text.length,
          textPreview: text.substring(0, 50) + '...'
        });
        return cachedEmbedding;
      }
      
      // Not in cache, generate embedding
      logger.debug('Cache miss, generating embedding', {
        textLength: text.length
      });
      
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text
      });
      
      const embedding = response.data[0].embedding;
      
      // Store in cache
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      logger.error('Error generating embedding:', {
        error: error instanceof Error ? error.message : String(error),
        text: text.substring(0, 100) + '...'
      });
      throw error;
    }
  }
  
  /**
   * Generate a simple hash of text for cache keys
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'emb_' + Math.abs(hash).toString(36);
  }

  /**
   * Create an embedding for a qualitative log and store it
   */
  async createLogEmbedding(logId: number, content: string, logType: 'qualitative' | 'quantitative'): Promise<void> {
    try {
      // Check if embedding already exists
      const existingEmbedding = await db
        .select()
        .from(logEmbeddings)
        .where(
          and(
            eq(logEmbeddings.logId, logId),
            eq(logEmbeddings.logType, logType)
          )
        )
        .limit(1);
        
      if (existingEmbedding.length > 0) {
        logger.debug(`Embedding already exists for ${logType} log ${logId}`);
        return;
      }
      
      const embedding = await this.generateEmbedding(content);
      
      await db.insert(logEmbeddings).values({
        logId,
        logType,
        embedding
      });
      
      logger.info(`Created embedding for ${logType} log ${logId}`);
    } catch (error) {
      logger.error(`Failed to create embedding for ${logType} log ${logId}:`, error);
      throw error;
    }
  }

  /**
   * Create an embedding for a summary and store it
   */
  async createSummaryEmbedding(summaryId: number, content: string): Promise<void> {
    try {
      // Check if embedding already exists
      const existingEmbedding = await db
        .select()
        .from(summaryEmbeddings)
        .where(eq(summaryEmbeddings.summaryId, summaryId))
        .limit(1);
        
      if (existingEmbedding.length > 0) {
        logger.debug(`Embedding already exists for summary ${summaryId}`);
        return;
      }
      
      const embedding = await this.generateEmbedding(content);
      
      await db.insert(summaryEmbeddings).values({
        summaryId,
        embedding
      });
      
      logger.info(`Created embedding for summary ${summaryId}`);
    } catch (error) {
      logger.error(`Failed to create embedding for summary ${summaryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Find similar summaries and logs for a query
   * @param query User query text
   * @param userId User ID
   * @param limit Maximum number of results to return
   * @returns Array of relevant summaries and logs
   */
  async findSimilarContent(query: string, userId: number, limit: number = 5): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      // Query for similar summaries
      const similarSummaries = await db.execute(sql`
        SELECT 
          s.id, 
          s.content, 
          s.summary_type,
          s.start_date,
          s.end_date, 
          1 - (se.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM 
          summary_embeddings se
        JOIN 
          log_summaries s ON se.summary_id = s.id
        WHERE 
          s.user_id = ${userId}
        ORDER BY 
          se.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `);

      // Query for similar logs
      const similarLogs = await db.execute(sql`
        SELECT 
          le.log_id, 
          le.log_type,
          1 - (le.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM 
          log_embeddings le
        JOIN 
          qualitative_logs ql ON le.log_id = ql.id AND le.log_type = 'qualitative'
        WHERE 
          ql.user_id = ${userId}
        ORDER BY 
          le.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `);

      // Combine and sort results by similarity
      const combinedResults = [
        ...similarSummaries,
        ...similarLogs
      ].sort((a, b) => b.similarity - a.similarity)
       .filter(item => item.similarity > this.SIMILARITY_THRESHOLD)
       .slice(0, limit);

      return combinedResults;
    } catch (error) {
      logger.error('Error finding similar content:', error);
      return [];
    }
  }

  /**
   * Process a batch of logs to create embeddings
   * Used for backfilling embeddings for existing content
   */
  async processLogBatch(logIds: number[], logType: 'qualitative' | 'quantitative'): Promise<void> {
    try {
      for (const logId of logIds) {
        // Check if embedding already exists
        const existingEmbedding = await db
          .select()
          .from(logEmbeddings)
          .where(eq(logEmbeddings.logId, logId))
          .limit(1);

        if (existingEmbedding.length > 0) {
          continue; // Skip if embedding already exists
        }

        let content = '';
        if (logType === 'qualitative') {
          const [log] = await db.execute(sql`
            SELECT content FROM qualitative_logs WHERE id = ${logId}
          `);
          content = log?.content || '';
        } else {
          // For quantitative logs, extract relevant information
          const [log] = await db.execute(sql`
            SELECT 
              s.name, 
              sl.taken_at, 
              sl.notes,
              sl.effects
            FROM 
              supplement_logs sl
            JOIN
              supplements s ON sl.supplement_id = s.id
            WHERE 
              sl.id = ${logId}
          `);

          if (log) {
            content = `Supplement: ${log.name}, Date: ${new Date(log.taken_at).toISOString()}, Notes: ${log.notes || 'None'}, Effects: ${JSON.stringify(log.effects) || 'None'}`;
          }
        }

        if (content) {
          await this.createLogEmbedding(logId, content, logType);
        }
      }
    } catch (error) {
      logger.error(`Failed to process log batch:`, error);
      throw error;
    }
  }

  /**
   * Process a batch of summaries to create embeddings
   */
  async processSummaryBatch(summaryIds: number[]): Promise<void> {
    try {
      for (const summaryId of summaryIds) {
        // Check if embedding already exists
        const existingEmbedding = await db
          .select()
          .from(summaryEmbeddings)
          .where(eq(summaryEmbeddings.summaryId, summaryId))
          .limit(1);

        if (existingEmbedding.length > 0) {
          continue; // Skip if embedding already exists
        }

        const [summary] = await db
          .select()
          .from(logSummaries)
          .where(eq(logSummaries.id, summaryId))
          .limit(1);

        if (summary) {
          await this.createSummaryEmbedding(summaryId, summary.content);
        }
      }
    } catch (error) {
      logger.error(`Failed to process summary batch:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const embeddingService = new EmbeddingService();
export default {
  initialize: async () => embeddingService.initialize(),
};
