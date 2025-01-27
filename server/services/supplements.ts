import { db } from "@db";
import { supplementReference } from "@db/schema";
import { Trie } from "../utils/trie";

class SupplementService {
  private trie: Trie;
  private initialized: boolean;

  constructor() {
    this.trie = new Trie();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log("Initializing supplement service...");
    const supplements = await db.select().from(supplementReference);
    console.log(`Loaded ${supplements.length} supplements from database`);

    this.trie.loadSupplements(supplements);
    this.initialized = true;
    console.log("Supplement service initialized successfully");
  }

  search(query: string, limit: number = 4) {
    if (!this.initialized) {
      console.warn("Supplement service not initialized!");
      return [];
    }

    console.log(`Searching for "${query}" with limit ${limit}`);
    const results = this.trie.search(query, limit);
    console.log(`Found ${results.length} results`);
    return results;
  }
}

export const supplementService = new SupplementService();