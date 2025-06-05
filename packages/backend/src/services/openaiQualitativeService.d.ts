export declare function qualitativeChatWithAI(
  userId: string | number | undefined,
  userQuery: string
): AsyncGenerator<
  | {
      error: string;
      limitReached: boolean;
      streaming: boolean;
      response?: undefined;
    }
  | {
      error: any;
      streaming: boolean;
      limitReached?: undefined;
      response?: undefined;
    }
  | {
      response: any;
      streaming: boolean;
      error?: undefined;
      limitReached?: undefined;
    },
  void,
  unknown
>;
//# sourceMappingURL=openaiQualitativeService.d.ts.map
