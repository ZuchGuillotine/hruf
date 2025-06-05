
import { supplementReference } from "@db/schema";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { Trie } from "../utils/trie";

class SupplementService {
  private trie: Trie;
  private initialized: boolean;
  private loading: boolean;
  private loadingPromise: Promise<void> | null;
  private retryCount: number;
  private maxRetries: number;
  private cacheTimeout: NodeJS.Timeout | null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private readonly PAGE_SIZE = 1000;

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
    this.loading = false;
    this.loadingPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cacheTimeout = null;
  }

  async initialize() {
    // Minimal initialization - just mark as ready for lazy loading
    this.initialized = true;
    console.log("Supplement service initialized for lazy loading");
  }

  /**
   * Lazy load supplements only when first needed
   */
  private async ensureLoaded(): Promise<void> {
    if (this.loading) {
      // If already loading, wait for it to complete
      return this.loadingPromise || Promise.resolve();
    }

    if (this.trie && this.trie.search('vitamin', 1).length > 0) {
      // Already loaded
      return;
    }

    this.loading = true;
    this.loadingPromise = this.loadSupplementsInBackground();
    
    try {
      await this.loadingPromise;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Start background loading of supplements - should be called after app is fully loaded
   */
  startBackgroundLoading() {
    // This is now optional - loading will happen on first use
    console.log("Background supplement loading available on-demand");
  }

  private async loadSupplementsInBackground() {
    try {
      console.log("Background loading: Starting to load supplements into trie...");
      
      let offset = 0;
      const BATCH_SIZE = 100; // Process in batches to avoid memory spikes
      let totalLoaded = 0;
      
      while (true) {
        const supplements = await db
          .select({
            id: supplementReference.id,
            name: supplementReference.name,
            category: supplementReference.category
          })
          .from(supplementReference)
          .offset(offset)
          .limit(BATCH_SIZE);

        if (supplements.length === 0) {
          console.log(`Background loading completed. Total supplements loaded: ${totalLoaded}`);
          break;
        }
        
        this.loadSupplements(supplements);
        totalLoaded += supplements.length;
        offset += BATCH_SIZE;
        
        console.log(`Background loading: Processed ${totalLoaded} supplements so far...`);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error during background supplement loading:", error);
    }
  }

  private loadSupplements(supplements: any[]) {
    console.log(`Loading ${supplements.length} supplements into service`);
    this.trie.loadSupplements(supplements);
  }

  private async loadRemainingSupplements() {
    try {
      let offset = 100; // Start after the initial batch
      const BATCH_SIZE = 100;
      
      while (true) {
        const supplements = await db
          .select({
            id: supplementReference.id,
            name: supplementReference.name,
            category: supplementReference.category
          })
          .from(supplementReference)
          .offset(offset)
          .limit(BATCH_SIZE);

        if (supplements.length === 0) {
          console.log('All supplements loaded successfully');
          break;
        }
        
        this.loadSupplements(supplements);
        offset += BATCH_SIZE;
        
        console.log(`Background loading: Processed ${offset} supplements so far...`);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error loading remaining supplements:", error);
    }
  }

  private scheduleCacheRefresh() {
    if (this.cacheTimeout) {
      clearTimeout(this.cacheTimeout);
    }
    this.cacheTimeout = setTimeout(() => this.initialize(), this.CACHE_DURATION);
  }

  async search(query: string, limit: number = 4) {
    try {
      if (!this.initialized) {
        console.warn("Supplement service not initialized, initializing now...");
        await this.initialize();
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

      // Lazy load supplements on first search
      await this.ensureLoaded();

      // Try trie search first
      const trieResults = this.trie.search(query, limit);
      
      // If trie has sufficient results, return them
      if (trieResults.length >= limit) {
        console.log(`Trie search returned ${trieResults.length} results`);
        return trieResults;
      }

      // Fall back to database search for incomplete results or when trie is still loading
      console.log(`Trie returned ${trieResults.length} results, falling back to database search`);
      const dbResults = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit - trieResults.length);

      // Combine trie and database results, avoiding duplicates
      const combinedResults = [...trieResults];
      const additionalResults = dbResults
        .filter(dbResult => !trieResults.some(trieResult => trieResult.id === dbResult.id))
        .slice(0, limit - trieResults.length);
      
      combinedResults.push(...additionalResults);
      
      return combinedResults;
    } catch (error) {
      console.error("Error in supplement search:", error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();
