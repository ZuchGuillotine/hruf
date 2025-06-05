type Message = {
  role: 'user' | 'assistant';
  content: string;
};
export interface ChatResponse {
  response?: string;
  error?: string;
  limitReached?: boolean;
  streaming?: boolean;
}
export declare function useLLM(): {
  chat: import('@tanstack/react-query').UseMutateAsyncFunction<
    {
      response: string;
    },
    Error,
    {
      messages: Message[];
      onStream?: (chunk: string, data?: ChatResponse) => void;
    },
    unknown
  >;
  isLoading: boolean;
  limitReached: boolean;
  resetLimitReached: () => void;
};
export {};
//# sourceMappingURL=use-llm.d.ts.map
