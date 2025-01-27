class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: any;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
  }
}

export class Trie {
  private root: TrieNode;
  private supplements: Map<string, any>;

  constructor() {
    this.root = new TrieNode();
    this.supplements = new Map();
  }

  insert(word: string, data: any = null) {
    let current = this.root;
    const normalizedWord = word.toLowerCase();

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

  search(prefix: string, limit: number = 4): Array<any> {
    const results: Array<any> = [];
    let current = this.root;
    const normalizedPrefix = prefix.toLowerCase();

    // Debug logging
    console.log(`Searching trie for prefix: "${normalizedPrefix}"`);

    // Traverse to the last node of the prefix
    for (const char of normalizedPrefix) {
      console.log(`Checking character: ${char}`);
      if (!current.children.has(char)) {
        console.log(`Character ${char} not found in trie`);
        return results;
      }
      current = current.children.get(char)!;
    }

    // Use DFS to find all words with the prefix
    this._findAllWords(current, normalizedPrefix, results, limit);
    console.log(`Found ${results.length} matches:`, results);
    return results;
  }

  private _findAllWords(node: TrieNode, prefix: string, results: Array<any>, limit: number) {
    if (results.length >= limit) return;

    if (node.isEndOfWord && node.data) {
      console.log(`Adding word to results: ${prefix}`);
      results.push(node.data);
    }

    for (const [char, childNode] of node.children.entries()) {
      this._findAllWords(childNode, prefix + char, results, limit);
    }
  }

  // Load supplements into the trie
  loadSupplements(supplements: Array<any>) {
    console.log(`Loading ${supplements.length} supplements into trie`);
    for (const supplement of supplements) {
      console.log(`Adding supplement: ${supplement.name}`);
      this.insert(supplement.name, supplement);

      // Also index alternative names if they exist
      if (supplement.alternativeNames) {
        for (const altName of supplement.alternativeNames) {
          console.log(`Adding alternative name: ${altName}`);
          this.insert(altName, supplement);
        }
      }
    }
    console.log('Finished loading supplements into trie');
  }
}