export interface QueryResult {
  response: string;
  error?: string;
  limitReached?: boolean;
  streaming?: boolean;
}
export declare function useQuery(): {
  sendQuery: (query: string, onStream?: (chunk: string) => void) => Promise<void>;
  resetChat: () => void;
  loadHistory: () => Promise<any>;
  messages: Message[];
  result: QueryResult | null;
  isLoading: boolean;
  error: string | null;
  limitReached: boolean;
  resetLimitReached: () => void;
};
//# sourceMappingURL=use-query.d.ts.map
