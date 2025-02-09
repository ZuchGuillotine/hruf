import { db } from "@db";
import { supplementReference } from "@db/schema";
import { sql } from "drizzle-orm";
import { Trie } from "../utils/trie";

/**
 * SupplementService
 * 
 * This service manages supplement reference data and provides search functionality.
 * It uses a hybrid approach combining SQL database queries and an in-memory Trie
 * data structure for efficient prefix-based searching and fuzzy matching.
 * 
 * The service maintains a synchronized state between the database and the Trie,
 * ensuring fast lookups while maintaining data persistence.
 */
class SupplementService {
  private trie: Trie;               // In-memory search optimization structure
  private initialized: boolean;      // Tracks if the service has loaded its data

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
  }

  /**
   * Initializes the service by loading supplement reference data from the database
   * into the Trie data structure. If no data exists, it runs the initial seeding.
   * 
   * @throws Error if initialization fails
   */
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

  /**
   * Loads supplement data into the Trie data structure for fast searching
   * @param supplements Array of supplement reference data to load
   */
  private loadSupplements(supplements: any[]) {
    console.log(`Loading ${supplements.length} supplements into service`);
    this.trie.loadSupplements(supplements);
  }

  /**
   * Searches for supplements using a hybrid approach:
   * 1. First tries a direct database search using ILIKE
   * 2. Falls back to Trie-based search if no database results
   * 
   * The Trie search provides fuzzy matching capabilities for better
   * user experience when exact matches aren't found.
   * 
   * @param query Search term from user input
   * @param limit Maximum number of results to return
   * @returns Array of matching supplement references
   */
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

// Singleton instance of the supplement service
export const supplementService = new SupplementService();