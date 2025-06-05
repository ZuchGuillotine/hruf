export declare function queryWithAI(
  messages: Array<{
    role: string;
    content: string;
  }>,
  userId: string | null
): AsyncGenerator<
  | {
      error: string;
      limitReached: boolean;
      streaming: boolean;
      response?: undefined;
    }
  | {
      response: any;
      streaming: boolean;
      error?: undefined;
      limitReached?: undefined;
    }
  | {
      error: string;
      streaming: boolean;
      limitReached?: undefined;
      response?: undefined;
    },
  void,
  unknown
>;
//# sourceMappingURL=openaiQueryService.d.ts.map
