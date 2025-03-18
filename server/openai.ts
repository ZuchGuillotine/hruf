
// server/openai.ts

import { OpenAI } from "openai";
import logger from "./utils/logger";

// Ensure API key is present in non-test environment
if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
  throw new Error("OPENAI_API_KEY must be set");
}

// Initialize OpenAI client with direct import to avoid constructor error
import OpenAI from "openai";
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-testing'
});

/**
 * System prompt that defines the AI assistant's behavior and capabilities
 */
export const SYSTEM_PROMPT = `You are a friendly and insightful assistant designed to help users reflect on their supplement regimen and share qualitative feedback about their experiences. Your role is to engage the user with thoughtful follow-up questions and encourage detailed responses about how specific supplements are affecting their mood, energy, and overall well-being.`;

export const QUERY_SYSTEM_PROMPT = `You are a knowledgeable assistant specializing in supplement information and health optimization. Your role is to provide accurate, evidence-based information about supplements, their effects, interactions, and general health advice while maintaining a helpful and professional tone.`;

// Model configuration
// These models are used by different parts of the application:
// - QUALITATIVE_CHAT is used in llmService.ts for personalized supplement feedback
// - QUERY_CHAT is used in openaiQueryService.ts for general supplement information
export const MODELS = {
  QUALITATIVE_CHAT: "gpt-4o-mini", // For qualitative feedback chat (user dashboard)
  QUERY_CHAT: "o3-mini-2025-01-31" // For general supplement queries (ask page)
};

/**
 * Main function to interact with OpenAI's chat API
 * @param messages - Array of message objects containing role and content
 * @param modelOverride - Optional parameter to override the default model
 * @returns AsyncGenerator yielding streaming chunks of the AI's response
 */
export async function* chatWithAI(
  messages: Array<{ role: string; content: string }>, 
  modelOverride?: string
) {
  try {
    // Calculate token usage for logging purposes
    const estimatedTokenCount = messages.reduce((total, msg) => {
      // Rough estimation: ~4 characters per token
      return total + Math.ceil(msg.content.length / 4);
    }, 0);
    
    const model = modelOverride || MODELS.QUALITATIVE_CHAT;
    
    logger.info('Starting chatWithAI:', {
      messageCount: messages.length,
      model: model,
      estimatedTokenCount,
      lastMessage: messages[messages.length - 1]?.content.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }))
      ],
      max_completion_tokens: 500,
      stream: true
    });

    logger.info('Stream created, starting to process chunks');

    let fullResponse = "";

    // Process each chunk from the stream
    for await (const chunk of stream) {
      try {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          logger.info('Processing chunk:', {
            chunkLength: content.length,
            preview: content.substring(0, 30),
            timestamp: new Date().toISOString()
          });

          fullResponse += content;
          yield { response: content, streaming: true };
        }
      } catch (chunkError) {
        logger.error('Error processing chunk:', chunkError);
        // Continue processing next chunks instead of breaking the stream
      }
    }

    logger.info('Stream completed:', {
      totalLength: fullResponse.length,
      timestamp: new Date().toISOString()
    });

    // Send final confirmation
    yield { response: "", streaming: false };
  } catch (error) {
    logger.error("OpenAI API Error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      model: modelOverride || MODELS.QUALITATIVE_CHAT,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });
    
    // Check if it's an API error related to the model
    if (error instanceof Error && 
        (error.message.includes("model") || error.message.includes("4o-mini"))) {
      logger.error("Model error detected. This may be due to an invalid model name or API restrictions.");
    }
    
    // Yield error information to client instead of throwing
    yield { 
      error: error instanceof Error ? error.message : "Streaming error", 
      streaming: false,
      details: error instanceof Error ? error.stack : undefined
    };
    
    // Ensure we properly end the streaming
    return;
  }
}

/**
 * Calculate token usage for monitoring and optimization
 * @param text String to analyze for token count
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Conservative estimation of tokens
  // This is a rough approximation - about 4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Log token usage for analytics and monitoring
 * @param userId User ID
 * @param context Complete context string
 * @param response Complete response string
 */
export function logTokenUsage(userId: string | number, context: string, response: string): void {
  const contextTokens = estimateTokenCount(context);
  const responseTokens = estimateTokenCount(response);
  const totalTokens = contextTokens + responseTokens;
  
  logger.info('LLM Token Usage:', {
    userId,
    contextTokens,
    responseTokens,
    totalTokens,
    timestamp: new Date().toISOString()
  });
}
