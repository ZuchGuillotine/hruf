import { db } from "@db";
import { supplementReference } from "@db/schema";
import { sql } from "drizzle-orm";
import { Trie } from "../utils/trie";

class SupplementService {
  private trie: Trie;
  private initialized: boolean;

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log("Initializing supplement service...");

      const supplements = await db.select().from(supplementReference);
      console.log(`Retrieved ${supplements.length} supplements from database`);

      this.trie = new Trie(); // Reset trie

      if (supplements.length === 0) {
        console.warn("No supplements found in database. Running seed...");
        const seedModule = require("../../db/migrations/supplements");
        await seedModule.seedSupplements();

        // Fetch supplements again after seeding
        const seededSupplements = await db.select().from(supplementReference);
        console.log(`After seeding: ${seededSupplements.length} supplements loaded`);
        this.loadSupplements(seededSupplements);
      } else {
        this.loadSupplements(supplements);
      }

      this.initialized = true;
      console.log("Supplement service initialized successfully");
    } catch (error) {
      console.error("Error initializing supplement service:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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

      // Simple database search using ILIKE
      const dbResults = await db
        .select()
        .from(supplementReference)
        .where(sql`LOWER(name) LIKE LOWER(${`%${query}%`})`)
        .limit(limit);

      console.log('Database search results:', dbResults);

      if (dbResults.length === 0) {
        // Try Trie search as fallback
        const trieResults = this.trie.search(query, limit);
        console.log('Trie search results:', trieResults);
        return trieResults || [];
      }

      return dbResults;
    } catch (error) {
      console.error("Error in supplement search:", error instanceof Error ? error.message : error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();