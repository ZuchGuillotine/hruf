
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
      
      console.log("Supplement service initialized (will load data in background)");
      
      // Start background loading without awaiting
      setImmediate(() => {
        this.loadSupplementsInBackground().catch(error => {
          console.error("Background supplement loading failed (non-fatal):", error);
        });
      });
      
    } catch (error) {
      console.error("Error initializing supplement service:", error);
      // Don't throw error - allow service to work with reduced capabilities
    }
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

  private async loadRemainingSupplements() {
    let offset = 100; // Start after the initial common supplements
    const BATCH_SIZE = 50; // Smaller batches for background loading
    
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

      if (supplements.length === 0) break;
      
      this.loadSupplements(supplements);
      offset += BATCH_SIZE;
      
      // Longer delay to be gentle on system resources
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  private loadSupplements(supplements: any[]) {
    console.log(`Loading ${supplements.length} supplements into service`);
    this.trie.loadSupplements(supplements);
  }

  async search(query: string, limit: number = 4) {
    try {
      if (!this.initialized) {
        console.warn("Supplement service not initialized, starting initialization...");
        this.initialize(); // Don't await
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

      // Try trie search first (may be empty if still loading)
      const trieResults = this.trie.search(query, limit);
      
      // Always use database search as primary when trie is empty/loading
      const dbResults = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit);

      // If trie has results, prefer them but fill gaps with DB results
      if (trieResults.length > 0) {
        const combinedResults = [...trieResults];
        const remainingSlots = limit - combinedResults.length;
        
        if (remainingSlots > 0) {
          const additionalResults = dbResults
            .filter(dbResult => !combinedResults.some(trieResult => trieResult.id === dbResult.id))
            .slice(0, remainingSlots);
          combinedResults.push(...additionalResults);
        }
        
        return combinedResults;
      }

      // Return database results when trie is empty/loading
      return dbResults;
    } catch (error) {
      console.error("Error in supplement search:", error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();
