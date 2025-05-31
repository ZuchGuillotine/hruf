
import { supplementReference } from "@db/schema";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { Trie } from "../utils/trie";

class SupplementService {
  private trie: Trie;
  private initialized: boolean;
  private retryCount: number;
  private maxRetries: number;
  private cacheTimeout: NodeJS.Timeout | null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private readonly PAGE_SIZE = 1000;

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cacheTimeout = null;
  }

  async initialize() {
    try {
      console.log("Starting supplement service initialization...");
      
      // Initialize empty trie first for immediate availability
      this.trie = new Trie();
      this.initialized = true;
      
      console.log("Supplement service initialized (background loading will start after app is ready)");
      
    } catch (error) {
      console.error("Error initializing supplement service:", error);
      // Don't throw error - allow service to work with reduced capabilities
    }
  }

  /**
   * Start background loading of supplements - should be called after app is fully loaded
   */
  startBackgroundLoading() {
    console.log("Starting background supplement loading...");
    setImmediate(() => {
      this.loadSupplementsInBackground().catch(error => {
        console.error("Background supplement loading failed (non-fatal):", error);
      });
    });
  }

  private async loadSupplementsInBackground() {
    try {
      console.log("Loading supplements in background...");
      
      // Load common supplements first in smaller batch
      const commonSupplements = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .limit(100); // Smaller initial batch

      this.loadSupplements(commonSupplements);
      console.log(`Loaded ${commonSupplements.length} common supplements`);
      
      // Schedule cache refresh
      this.scheduleCacheRefresh();
      
      // Load remaining supplements with longer delays
      await this.loadRemainingSupplements();
      
      console.log("All supplements loaded successfully");
    } catch (error) {
      console.error("Error loading supplements in background (non-fatal):", error);
    }
  }

  private scheduleCacheRefresh() {
    if (this.cacheTimeout) {
      clearTimeout(this.cacheTimeout);
    }
    this.cacheTimeout = setTimeout(() => this.initialize(), this.CACHE_DURATION);
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

  async search(query: string, limit: number = 4) {
    try {
      if (!this.initialized) {
        console.warn("Supplement service not initialized, initializing now...");
        await this.initialize();
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

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
