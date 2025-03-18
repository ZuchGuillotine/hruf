import OpenAI from "openai";
import { constructQueryContext } from "./llmContextService_query";
import { db } from "../../db";
import { qualitativeLogs } from "../../db/schema";
import { Message } from "@/lib/types";

import { MODELS } from "../openai";

// Initialize OpenAI with the separate API key for queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_QUERY_KEY || process.env.OPENAI_API_KEY,
});

export async function* queryWithAI(messages: Array<{ role: string; content: string }>, userId: string | null) {
  try {
    // Get the last user message which contains the query
    const userQuery = messages[messages.length - 1].content;

    // Build context using the context service
    const context = await constructQueryContext(userId, userQuery);
    
    // Debug log the context
    const { debugContext } = await import('../utils/contextDebugger');
    await debugContext(userId?.toString() || 'anonymous', context, 'query');

    // Log processing details for debugging
    console.log('Processing query with OpenAI:', {
      userId,
      userIdType: typeof userId,
      userIdValue: userId,
      messageCount: context.messages.length,
      isAuthenticated: !!userId,
      model: MODELS.QUERY_CHAT,
      timestamp: new Date().toISOString()
    });

    // Call OpenAI API with chat completion
    // IMPORTANT: This service must always use the QUERY_CHAT model (o3-mini)
    console.log('Using query chat model:', {
      model: MODELS.QUERY_CHAT,
      modelName: "o3-mini",
      isAuthenticated: !!userId,
      timestamp: new Date().toISOString()
    });
    
    const stream = await openai.chat.completions.create({
      model: MODELS.QUERY_CHAT,
      messages: context.messages,
      max_completion_tokens: 1000,
      stream: true
    });

    let fullResponse = "";

    // Process each chunk from the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";

      if (content) {
        console.log('Processing stream chunk:', {
          contentLength: content.length,
          preview: content.substring(0, 30),
          timestamp: new Date().toISOString()
        });

        fullResponse += content;
        yield { response: content, streaming: true };
      }
    }

    // If user is authenticated, save the complete interaction
    if (userId) {
      await saveInteraction(userId, messages[messages.length - 1].content, fullResponse);
    }

    // Log successful completion
    console.log('OpenAI query completed successfully:', {
      userId,
      responseLength: fullResponse.length,
      timestamp: new Date().toISOString()
    });

    // Send final chunk
    yield { response: "", streaming: false };

  } catch (error) {
    console.error("OpenAI query error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Save the query interaction to the qualitative logs
async function saveInteraction(userId: string, query: string, response: string) {
  try {
    await db
      .insert(qualitativeLogs)
      .values({
        userId: parseInt(userId),
        content: `Query: ${query}\n\nResponse: ${response}`,
        type: 'query',
        tags: ['ai_query'],
        metadata: {
          savedAt: new Date().toISOString(),
          queryType: 'supplement_info'
        }
      });
  } catch (error) {
    console.error("Failed to save query interaction:", error);
  }
}