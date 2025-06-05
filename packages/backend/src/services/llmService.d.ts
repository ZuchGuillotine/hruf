/**
 * Chat with AI for user feedback on supplements - uses the qualitative model
 * @param messages Array of message objects with role and content
 * @param userId User ID for context and rate limiting
 * @returns Async generator that yields response chunks
 */
export declare function chatWithAI(
  messages: Array<{
    role: string;
    content: string;
  }>,
  userId: number
): Promise<
  AsyncGenerator<
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
  >
>;
/**
 * Process a single message from a user for qualitative feedback
 * This function builds context and initiates a streaming chat with the AI
 * @param userId User ID as string
 * @param message User's message content
 * @returns Async generator for streaming response
 */
export declare function qualitativeChatWithAI(
  userId: string,
  message: string
): Promise<
  AsyncGenerator<
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
  >
>;
//# sourceMappingURL=llmService.d.ts.map
