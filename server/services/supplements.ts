import { rdsDb } from "@db/rds";
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
    if (this.initialized) return;

    console.log("Initializing supplement service...");
    const supplements = await rdsDb.select().from(supplementReference);
    console.log(`Loaded ${supplements.length} supplements from database`);

    this.trie.loadSupplements(supplements);
    this.initialized = true;
    console.log("Supplement service initialized successfully");
  }

  async search(query: string, limit: number = 4) {
    if (!this.initialized) {
      console.warn("Supplement service not initialized!");
      return [];
    }

    console.log(`Searching for "${query}" with limit ${limit}`);
    
    // Combine Trie and PostgreSQL search results
    const trieResults = this.trie.search(query, limit);
    
    // PostgreSQL fuzzy search using trigram similarity
    const dbResults = await rdsDb.execute(sql`
      SELECT *, similarity(name, ${query}) as score 
      FROM supplement_reference 
      WHERE name % ${query} 
      ORDER BY score DESC 
      LIMIT ${limit}
    `);

    // Merge and deduplicate results
    const combined = [...trieResults, ...dbResults];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    const sorted = unique.slice(0, limit);

    console.log(`Found ${sorted.length} results`);
    return sorted;
  }
}

export const supplementService = new SupplementService();