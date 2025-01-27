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

    const supplements = await db.select().from(supplementReference);
    this.trie.loadSupplements(supplements);
    this.initialized = true;
  }

  search(query: string, limit: number = 4) {
    return this.trie.search(query, limit);
  }
}

export const supplementService = new SupplementService();
