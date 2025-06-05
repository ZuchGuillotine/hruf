/**
 * Initializes all services required for the hybrid context approach
 */
declare class ServiceInitializer {
  /**
   * Initialize all services in the correct order
   */
  initializeServices(): Promise<void>;
  /**
   * Initialize PGVector related services
   */
  private initializePGVector;
  /**
   * Initialize summarization services
   */
  private initializeSummarization;
  /**
   * Initialize lab results services
   */
  private initializeLabServices;
  /**
   * Start scheduled tasks for summarization
   */
  private startScheduledTasks;
  /**
   * Function to gracefully shut down services
   * Called when the application is shutting down
   */
  shutdownServices(): Promise<void>;
}
export declare const serviceInitializer: ServiceInitializer;
export {};
//# sourceMappingURL=serviceInitializer.d.ts.map
