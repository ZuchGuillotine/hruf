declare class SupplementService {
  private trie;
  private initialized;
  private retryCount;
  private maxRetries;
  private cacheTimeout;
  private readonly CACHE_DURATION;
  private readonly PAGE_SIZE;
  constructor();
  initialize(): Promise<void>;
  private scheduleCacheRefresh;
  private loadRemainingSupplements;
  private loadSupplements;
  search(
    query: string,
    limit?: number
  ): Promise<
    {
      id: number;
      name: string;
      category: string;
    }[]
  >;
}
export declare const supplementService: SupplementService;
export {};
//# sourceMappingURL=supplements.d.ts.map
