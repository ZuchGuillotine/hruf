import { SelectSupplementReference } from "@db/schema";

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: SelectSupplementReference | null;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
  }
}

function levenshteinDistance(str1: string, str2: string): number {
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

function normalizeVitaminName(input: string): string {
  if (!input) return '';

  // Remove spaces and convert to lowercase
  let normalized = input.toLowerCase().replace(/\s+/g, '');

  // Common vitamin spelling patterns
  normalized = normalized
    .replace(/vit+a*min/g, 'vitamin')  // Handle repeated letters
    .replace(/vitamiin/g, 'vitamin')
    .replace(/vitmin/g, 'vitamin')
    .replace(/vitamen/g, 'vitamin')
    .replace(/vitemin/g, 'vitamin');

  return normalized;
}

export class Trie {
  private root: TrieNode;
  private supplements: Map<string, SelectSupplementReference>;
  private baseMaxDistance: number = 2;

  constructor() {
    this.root = new TrieNode();
    this.supplements = new Map();
  }

  private getMaxDistance(wordLength: number): number {
    // Scale max distance based on word length
    if (wordLength <= 4) return this.baseMaxDistance;
    if (wordLength <= 8) return this.baseMaxDistance + 1;
    return this.baseMaxDistance + 2;
  }

  insert(word: string, data: SelectSupplementReference) {
    if (!word || !data) {
      console.warn('Attempted to insert invalid data into Trie:', { word, data });
      return;
    }

    let current = this.root;
    const normalizedWord = normalizeVitaminName(word);

    for (const char of normalizedWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.data = data;
    this.supplements.set(normalizedWord, data);
  }

  search(prefix: string, limit: number = 4): SelectSupplementReference[] {
    const results: SelectSupplementReference[] = [];
    if (!prefix) {
      console.log('Empty search prefix provided');
      return results;
    }

    const normalizedPrefix = normalizeVitaminName(prefix);
    console.log(`Searching trie for normalized prefix: "${normalizedPrefix}"`);

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
      console.log('No exact matches found, trying fuzzy search');
      const fuzzyResults = this._fuzzySearch(normalizedPrefix, limit - results.length);
      results.push(...fuzzyResults);
    }

    console.log(`Found ${results.length} matches in Trie:`, results);
    return results;
  }

  private _fuzzySearch(query: string, limit: number): SelectSupplementReference[] {
    const results: SelectSupplementReference[] = [];
    const matches = new Map<string, { distance: number; data: SelectSupplementReference }>();
    const maxDistance = this.getMaxDistance(query.length);

    // Compare with all stored supplements
    this.supplements.forEach((data, word) => {
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

  private _findAllWords(
    node: TrieNode, 
    prefix: string, 
    results: SelectSupplementReference[], 
    limit: number
  ) {
    if (results.length >= limit) return;

    if (node.isEndOfWord && node.data) {
      console.log(`Adding word to results: ${prefix}`);
      results.push(node.data);
    }

    node.children.forEach((childNode, char) => {
      this._findAllWords(childNode, prefix + char, results, limit);
    });
  }

  loadSupplements(supplements: SelectSupplementReference[]) {
    if (!Array.isArray(supplements)) {
      console.error('Invalid supplements data provided to loadSupplements');
      return;
    }

    console.log(`Loading ${supplements.length} supplements into trie`);

    for (const supplement of supplements) {
      if (supplement && supplement.name) {
        console.log(`Adding supplement: ${supplement.name}`);
        this.insert(supplement.name, supplement);
      } else {
        console.warn('Invalid supplement data:', supplement);
      }
    }

    console.log('Finished loading supplements into trie');
  }
}