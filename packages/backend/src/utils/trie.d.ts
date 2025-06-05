import { SelectSupplementReference } from '@db/schema';
/**
 * Trie data structure implementation for efficient supplement name searching
 * Provides both exact prefix matching and fuzzy matching capabilities
 */
export declare class Trie {
  private root;
  private supplements;
  private baseMaxDistance;
  constructor();
  /**
   * Determines maximum allowed edit distance based on word length
   * Longer words allow for more variations in spelling
   */
  private getMaxDistance;
  /**
   * Inserts a supplement into the Trie
   * @param word Supplement name
   * @param data Complete supplement reference data
   */
  insert(word: string, data: SelectSupplementReference): void;
  /**
   * Searches for supplements by prefix with fuzzy matching fallback
   * @param prefix Search prefix
   * @param limit Maximum number of results to return
   * @returns Array of matching supplement references
   */
  search(prefix: string, limit?: number): SelectSupplementReference[];
  /**
   * Performs fuzzy matching using Levenshtein distance
   * @param query Search query
   * @param limit Maximum number of results
   * @returns Array of fuzzy-matched supplements
   */
  private _fuzzySearch;
  /**
   * Recursively finds all words in the Trie starting from a given node
   * Used for collecting all matches for a prefix
   */
  private _findAllWords;
  /**
   * Bulk loads supplements into the Trie
   * @param supplements Array of supplement references to load
   */
  loadSupplements(supplements: SelectSupplementReference[]): void;
}
//# sourceMappingURL=trie.d.ts.map
