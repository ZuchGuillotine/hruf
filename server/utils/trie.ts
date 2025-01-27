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

    // Traverse to the last node of the prefix
    for (const char of normalizedPrefix) {
      if (!current.children.has(char)) {
        return results;
      }
      current = current.children.get(char)!;
    }

    // Use DFS to find all words with the prefix
    this._findAllWords(current, normalizedPrefix, results, limit);
    return results;
  }

  private _findAllWords(node: TrieNode, prefix: string, results: Array<any>, limit: number) {
    if (results.length >= limit) return;

    if (node.isEndOfWord) {
      results.push({
        name: prefix,
        ...node.data
      });
    }

    // Use Array.from to handle the MapIterator
    const entries = Array.from(node.children.entries());
    for (const [char, childNode] of entries) {
      this._findAllWords(childNode, prefix + char, results, limit);
    }
  }

  // Load supplements into the trie
  loadSupplements(supplements: Array<any>) {
    for (const supplement of supplements) {
      this.insert(supplement.name, supplement);

      // Also index alternative names if they exist
      if (supplement.alternativeNames) {
        for (const altName of supplement.alternativeNames) {
          this.insert(altName, supplement);
        }
      }
    }
  }
}