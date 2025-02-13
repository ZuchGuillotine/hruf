import { supplementReference } from "@db/rds-schema";
import { rdsDb } from "@db/rds";
import { sql } from "drizzle-orm";
import { Trie } from "../utils/trie";

class SupplementService {
  private trie: Trie;
  private initialized: boolean;
  private retryCount: number;
  private maxRetries: number;

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    try {
      console.log("Initializing supplement service...");

      while (this.retryCount < this.maxRetries) {
        try {
          // Use the rdsDb instance that's already configured with IAM auth
          const supplements = await rdsDb
            .select()
            .from(supplementReference)
            .execute(); // Use execute() to ensure proper query execution

          console.log(`Retrieved ${supplements.length} supplements from database`);

          this.trie = new Trie();

          if (supplements.length === 0) {
            console.warn("No supplements found in database. Running seed...");
            const seedModule = require("../../db/migrations/supplements");
            await seedModule.seedSupplements();

            const seededSupplements = await rdsDb
              .select()
              .from(supplementReference)
              .execute();

            console.log(`After seeding: ${seededSupplements.length} supplements loaded`);
            this.loadSupplements(seededSupplements);
          } else {
            this.loadSupplements(supplements);
          }

          this.initialized = true;
          console.log("Supplement service initialized successfully");
          return;
        } catch (error) {
          this.retryCount++;
          console.error('Error in supplement service initialization attempt:', {
            attempt: this.retryCount,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });

          if (this.retryCount < this.maxRetries) {
            console.log(`Retry attempt ${this.retryCount} of ${this.maxRetries}`);
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.retryCount) * 1000));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error initializing supplement service:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        retryCount: this.retryCount
      });
      throw new Error(`Failed to initialize supplement service: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const dbResults = await rdsDb
        .select()
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit)
        .execute();

      console.log('Database search results:', dbResults);

      if (dbResults.length === 0) {
        const trieResults = this.trie.search(query, limit);
        console.log('Trie search results:', trieResults);
        return trieResults || [];
      }

      return dbResults;
    } catch (error) {
      console.error("Error in supplement search:", {
        error: error instanceof Error ? error.message : error,
        query,
        timestamp: new Date().toISOString()
      });
      return [];
    }
  }
}

export const supplementService = new SupplementService();