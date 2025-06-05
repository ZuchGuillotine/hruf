declare class EmbeddingService {
  private EMBEDDING_MODEL;
  private EMBEDDING_DIMENSIONS;
  private BATCH_SIZE;
  private SIMILARITY_THRESHOLD;
  private embeddingCache;
  constructor();
  /**
   * Initialize the embedding service
   * Verifies OpenAI connection and database setup
   * @returns Promise<boolean> indicating initialization success
   */
  initialize(testQuery?: string): Promise<boolean>;
  /**
   * Generate an embedding for a text string with caching
   */
  generateEmbedding(text: string): Promise<number[]>;
  /**
   * Generate a simple hash of text for cache keys
   */
  private hashText;
  /**
   * Create an embedding for a qualitative log and store it
   */
  createLogEmbedding(
    logId: number,
    content: string,
    logType: 'qualitative' | 'quantitative'
  ): Promise<void>;
  /**
   * Create an embedding for a summary and store it
   */
  createSummaryEmbedding(summaryId: number, content: string): Promise<void>;
  findSimilarContent(query: string, userId: number, limit?: number): Promise<any[]>;
  private getFallbackContent;
  /**
   * Create an embedding for a lab result summary
   */
  createLabEmbedding(labId: number, content: string): Promise<void>;
  /**
   * Find lab results similar to the query
   */
  findSimilarLabContent(userId: number, query: string, limit?: number): Promise<any[]>;
  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity;
  private enrichContentWithData;
}
declare const embeddingService: EmbeddingService;
export { embeddingService, EmbeddingService as initialize };
export default embeddingService;
//# sourceMappingURL=embeddingService.d.ts.map
