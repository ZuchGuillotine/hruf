/**
 * LLM Summary Service
 * This service handles the periodic summarization of user chat logs using OpenAI's GPT model.
 * It processes qualitative feedback and generates concise summaries for better context in future interactions.
 */
/**
 * Generates a summary of chat logs for a specific time period
 * @param userId - The ID of the user whose chats need summarization
 * @param startDate - Beginning of the period to summarize
 * @param endDate - End of the period to summarize
 * @returns Promise containing the generated summary
 */
export declare function generateChatSummary(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<any>;
/**
 * Summarizes old chats for a given user.
 * @param userId The ID of the user.
 */
export declare function summarizeOldChats(userId: number): Promise<void>;
//# sourceMappingURL=llmSummaryService.d.ts.map
