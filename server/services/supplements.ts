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

      // Use db instead of rdsDb
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
        this.trie.loadSupplements(seededSupplements);
      } else {
        this.trie.loadSupplements(supplements);
      }

      this.initialized = true;
      console.log("Supplement service initialized successfully");
    } catch (error) {
      console.error("Error initializing supplement service:", error);
      throw new Error(`Failed to initialize supplement service: ${error.message}`);
    }
  }

  async search(query: string, limit: number = 4) {
    try {
      if (!this.initialized) {
        console.warn("Supplement service not initialized, initializing now...");
        await this.initialize();
      }

      console.log(`Searching for "${query}" with limit ${limit}`);

      // Combine Trie and PostgreSQL search results
      const trieResults = this.trie.search(query, limit);

      // PostgreSQL fuzzy search using trigram similarity
      const fuzzyResults = await db.execute<any>(sql`
        SELECT *, similarity(name, ${query}) as score 
        FROM supplement_reference 
        WHERE name % ${query} 
        ORDER BY score DESC 
        LIMIT ${limit}
      `);

      // Merge and deduplicate results
      const combined = [...trieResults, ...(fuzzyResults || [])];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      const sorted = unique.slice(0, limit);

      console.log(`Found ${sorted.length} results`);
      return sorted;
    } catch (error) {
      console.error("Error in supplement search:", error);
      return [];
    }
  }
}

export const supplementService = new SupplementService();