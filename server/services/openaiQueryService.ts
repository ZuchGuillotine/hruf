import OpenAI from "openai";
import { constructQueryContext } from "./llmContextService_query";
import { db } from "../../db";
import { qualitativeLogs } from "../../db/schema";
import { Message } from "@/lib/types";

// Initialize OpenAI with the separate API key for queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_QUERY_KEY,
});

export async function queryWithAI(messages: Array<{ role: string; content: string }>, userId: string | null) {
  try {
    // Log processing details for debugging
    console.log('Processing query with OpenAI:', {
      userId,
      userIdType: typeof userId,
      userIdValue: userId,
      messageCount: messages.length,
      isAuthenticated: !!userId,
      timestamp: new Date().toISOString()
    });

    // Call OpenAI API with chat completion
    const completion = await openai.chat.completions.create({
      model: "o3-mini-2025-01-31", // Updated to use new model
      messages: messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000,
      stream: false // Keep non-streaming for query service
    });

    const response = completion.choices[0].message.content;

    // If user is authenticated, save the interaction to qualitative logs
    if (userId) {
      await saveInteraction(userId, messages[messages.length - 1].content, response || "");
    }

    // Log successful completion
    console.log('OpenAI query completed successfully:', {
      userId,
      responseLength: response?.length || 0,
      timestamp: new Date().toISOString()
    });

    return {
      response,
      usage: completion.usage,
      model: completion.model,
    };
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