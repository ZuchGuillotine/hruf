
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
      
      // Load supplements in background
      this.loadSupplementsInBackground();
      
      console.log("Supplement service initialized (loading data in background)");
    } catch (error) {
      console.error("Error initializing supplement service:", error);
      // Don't throw error - allow service to work with reduced capabilities
    }
  }

  private async loadSupplementsInBackground() {
    try {
      console.log("Loading supplements in background...");
      
      // Load most frequently accessed supplements first
      const commonSupplements = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .limit(this.PAGE_SIZE);

      this.loadSupplements(commonSupplements);
      this.scheduleCacheRefresh();
      
      console.log("Common supplements loaded, loading remaining supplements...");
      
      // Load remaining supplements
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
    let offset = this.PAGE_SIZE;
    
    while (true) {
      const supplements = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .offset(offset)
        .limit(this.PAGE_SIZE);

      if (supplements.length === 0) break;
      
      this.loadSupplements(supplements);
      offset += this.PAGE_SIZE;
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
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
        // Start initialization but don't wait for it
        this.initialize();
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

      // Try trie search first (may be empty if still loading)
      const trieResults = this.trie.search(query, limit);
      
      if (trieResults.length >= limit) {
        return trieResults;
      }

      // Always fall back to database search to ensure results
      const dbResults = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit);

      // Combine results, preferring trie results but ensuring we have data
      const combinedResults = [...trieResults];
      const remainingSlots = limit - combinedResults.length;
      
      if (remainingSlots > 0) {
        const additionalResults = dbResults
          .filter(dbResult => !combinedResults.some(trieResult => trieResult.id === dbResult.id))
          .slice(0, remainingSlots);
        combinedResults.push(...additionalResults);
      }

      return combinedResults;
    } catch (error) {
      console.error("Error in supplement search:", error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();
