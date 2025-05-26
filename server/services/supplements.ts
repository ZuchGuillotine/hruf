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
      console.log("Initializing supplement service...");
      
      // Load most frequently accessed supplements first
      const commonSupplements = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .limit(this.PAGE_SIZE);

      this.trie = new Trie();
      this.loadSupplements(commonSupplements);
      
      this.initialized = true;
      this.scheduleCacheRefresh();
      
      // Load remaining supplements in background
      this.loadRemainingSupplements();
      
      console.log("Supplement service initialized with common supplements");
    } catch (error) {
      console.error("Error initializing supplement service:", error);
      throw error;
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
        console.warn("Supplement service not initialized, initializing now...");
        await this.initialize();
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

      // Try trie search first - this is very fast as it's in-memory
      const trieResults = this.trie.search(query, limit);
      
      if (trieResults.length >= limit) {
        return trieResults;  // Return immediately if we have enough results from fast trie search
      }

      // Only fall back to slower database search if we need more results
      const dbResults = await db
        .select({
          id: supplementReference.id,
          name: supplementReference.name,
          category: supplementReference.category
        })
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit - trieResults.length);

      return [...trieResults, ...dbResults];
    } catch (error) {
      console.error("Error in supplement search:", error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();
