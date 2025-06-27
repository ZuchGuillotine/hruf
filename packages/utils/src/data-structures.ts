/**
 * Platform-agnostic data structures and algorithms
 * Removed database-specific dependencies for cross-platform compatibility
 */

/**
 * Generic interface for searchable items in the Trie
 */
export interface TrieSearchable {
  name: string;
  [key: string]: any; // Allow additional properties
}

/**
 * TrieNode class represents a node in the Trie data structure
 * Used for efficient prefix-based searching
 */
class TrieNode {
  children: Map<string, TrieNode>;     // Maps characters to child nodes
  isEndOfWord: boolean;                // Marks if this node represents a complete word
  data: TrieSearchable | null;         // Stores data at complete words

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
  }
}

/**
 * Calculates the Levenshtein distance between two strings
 * Used for fuzzy matching when exact matches aren't found
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Number representing the edit distance between strings
 * 
 * @example
 * ```ts
 * levenshteinDistance("kitten", "sitting") // Returns: 3
 * levenshteinDistance("hello", "hello") // Returns: 0
 * ```
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,  // substitution
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1       // insertion
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Trie data structure implementation for efficient prefix-based searching
 * Provides both exact prefix matching and fuzzy matching capabilities
 * 
 * @example
 * ```ts
 * const trie = new Trie<{ name: string; id: number }>();
 * trie.insert("vitamin", { name: "Vitamin D", id: 1 });
 * trie.search("vit") // Returns: [{ name: "Vitamin D", id: 1 }]
 * ```
 */
export class Trie<T extends TrieSearchable> {
  private root: TrieNode;
  private items: Map<string, T>;
  private baseMaxDistance: number = 2;  // Base Levenshtein distance for fuzzy matching

  constructor() {
    this.root = new TrieNode();
    this.items = new Map();
  }

  /**
   * Determines maximum allowed edit distance based on word length
   * Longer words allow for more variations in spelling
   */
  private getMaxDistance(wordLength: number): number {
    if (wordLength <= 4) return this.baseMaxDistance;
    if (wordLength <= 8) return this.baseMaxDistance + 1;
    return this.baseMaxDistance + 2;
  }

  /**
   * Normalizes text for consistent searching
   * Can be overridden for domain-specific normalization
   */
  protected normalizeText(text: string): string {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Inserts an item into the Trie
   * @param word - Item name/text to search by
   * @param data - Complete item data
   * 
   * @example
   * ```ts
   * trie.insert("vitamin d", { name: "Vitamin D3", id: 1 });
   * ```
   */
  insert(word: string, data: T) {
    if (!word || !data) {
      console.warn('Attempted to insert invalid data into Trie:', { word, data });
      return;
    }

    let current = this.root;
    const normalizedWord = this.normalizeText(word);

    for (const char of normalizedWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.data = data;
    this.items.set(normalizedWord, data);
  }

  /**
   * Searches for items by prefix with fuzzy matching fallback
   * @param prefix - Search prefix
   * @param limit - Maximum number of results to return
   * @returns Array of matching items
   * 
   * @example
   * ```ts
   * trie.search("vit", 5) // Returns up to 5 items starting with "vit"
   * ```
   */
  search(prefix: string, limit: number = 4): T[] {
    const results: T[] = [];
    if (!prefix) {
      return results;
    }

    const normalizedPrefix = this.normalizeText(prefix);

    // First try exact prefix match
    let current = this.root;
    let exactMatch = true;

    for (const char of normalizedPrefix) {
      if (!current.children.has(char)) {
        exactMatch = false;
        break;
      }
      current = current.children.get(char)!;
    }

    if (exactMatch) {
      this._findAllWords(current, normalizedPrefix, results, limit);
    }

    // If no exact matches or not enough results, try fuzzy matching
    if (results.length < limit) {
      const fuzzyResults = this._fuzzySearch(normalizedPrefix, limit - results.length);
      results.push(...fuzzyResults);
    }

    return results;
  }

  /**
   * Performs fuzzy matching using Levenshtein distance
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Array of fuzzy-matched items
   */
  private _fuzzySearch(query: string, limit: number): T[] {
    const results: T[] = [];
    const matches = new Map<string, { distance: number; data: T }>();
    const maxDistance = this.getMaxDistance(query.length);

    // Compare with all stored items
    this.items.forEach((data, word) => {
      const distance = levenshteinDistance(query, word);
      if (distance <= maxDistance) {
        matches.set(word, { distance, data });
      }
    });

    // Sort matches by distance and take the top results
    const sortedMatches = Array.from(matches.entries())
      .sort((a, b) => a[1].distance - b[1].distance)
      .slice(0, limit);

    for (const [_, { data }] of sortedMatches) {
      if (data) results.push(data);
    }

    return results;
  }

  /**
   * Recursively finds all words in the Trie starting from a given node
   * Used for collecting all matches for a prefix
   */
  private _findAllWords(
    node: TrieNode, 
    prefix: string, 
    results: T[], 
    limit: number
  ) {
    if (results.length >= limit) return;

    if (node.isEndOfWord && node.data) {
      results.push(node.data as T);
    }

    node.children.forEach((childNode, char) => {
      this._findAllWords(childNode, prefix + char, results, limit);
    });
  }

  /**
   * Bulk loads items into the Trie
   * @param items - Array of items to load
   * 
   * @example
   * ```ts
   * trie.loadItems([
   *   { name: "Vitamin D", id: 1 },
   *   { name: "Vitamin B12", id: 2 }
   * ]);
   * ```
   */
  loadItems(items: T[]) {
    if (!Array.isArray(items)) {
      console.error('Invalid items data provided to loadItems');
      return;
    }

    for (const item of items) {
      if (item && item.name) {
        this.insert(item.name, item);
      } else {
        console.warn('Invalid item data:', item);
      }
    }
  }

  /**
   * Gets all items stored in the Trie
   * @returns Array of all stored items
   */
  getAllItems(): T[] {
    return Array.from(this.items.values());
  }

  /**
   * Clears all data from the Trie
   */
  clear() {
    this.root = new TrieNode();
    this.items.clear();
  }

  /**
   * Gets the total number of items in the Trie
   * @returns Number of items stored
   */
  size(): number {
    return this.items.size;
  }
}

/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Useful for caching expensive computations or API responses
 * 
 * @example
 * ```ts
 * const cache = new LRUCache<string, number>(3);
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.get("a"); // Returns: 1
 * ```
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache
   * @param key - The key to retrieve
   * @returns The value or undefined if not found
   */
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  /**
   * Sets a value in the cache
   * @param key - The key to set
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache
   * @param key - The key to check
   * @returns true if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Removes a key from the cache
   * @param key - The key to remove
   * @returns true if the key was removed
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current size of the cache
   * @returns Number of items in cache
   */
  size(): number {
    return this.cache.size;
  }
}