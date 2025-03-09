import OpenAI from "openai";
import { constructQueryContext } from "./llmContextService_query";
import { db } from "../../db";
import { qualitativeLogs, queryChats } from "../../db/schema";
import { Message } from "@/lib/types";

// Initialize OpenAI with the separate API key for queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_QUERY_KEY,
});

export async function queryWithAI(messages: Array<{ role: string; content: string }>, userId: string | null, stream = false) {
  try {
    // Log processing details for debugging
    console.log('Processing query with OpenAI:', {
      userId,
      userIdType: typeof userId,
      userIdValue: userId,
      messageCount: messages.length,
      isAuthenticated: !!userId,
      isStreaming: stream,
      timestamp: new Date().toISOString()
    });

    if (stream) {
      try {
        // For streaming, return the stream directly with a timeout
        console.log('Creating OpenAI streaming request');
        const startTime = Date.now();
        
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
          timeout: 60000, // Increased to 60 second timeout for the request
        });
        
        console.log(`OpenAI stream created in ${Date.now() - startTime}ms`);
        
        // For streaming, we'll collect the full response in the controller
        return { stream };
      } catch (streamErr) {
        console.error('Error creating OpenAI stream:', {
          error: streamErr instanceof Error ? streamErr.message : 'Unknown error',
          stack: streamErr instanceof Error ? streamErr.stack : undefined,
          type: typeof streamErr,
          detail: JSON.stringify(streamErr)
        });
        throw streamErr;
      }
    } else {
      // Non-streaming response - original implementation
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;

      // If user is authenticated, save the interaction to qualitative logs
      if (userId) {
        await saveInteraction(userId, messages[messages.length - 1].content, response);
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
    }
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
export async function saveInteraction(userId: string, query: string, response: string) {
  try {
    await db
      .insert(qualitativeLogs)
      .values({
        userId,
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