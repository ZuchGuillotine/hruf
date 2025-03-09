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
        // Log detailed debugging info 
        console.log('Creating OpenAI streaming request with these parameters:', {
          model: "gpt-4o-mini",
          messageCount: messages.length,
          firstMessage: messages[0]?.role,
          lastMessage: messages[messages.length-1]?.role,
          stream: true,
          timeout: 60000
        });
        
        const startTime = Date.now();
        
        // Create the stream with explicit abort controller for reliable timeout handling
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 55000); // 55s timeout
        
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
          signal: abortController.signal
        });
        
        // Clear timeout if successful
        clearTimeout(timeoutId);
        
        console.log(`OpenAI stream created in ${Date.now() - startTime}ms`);
        
        // For streaming, we'll collect the full response in the controller
        return { stream };
      } catch (streamErr) {
        console.error('Error creating OpenAI stream:', {
          error: streamErr instanceof Error ? streamErr.message : 'Unknown error',
          stack: streamErr instanceof Error ? streamErr.stack : undefined,
          type: typeof streamErr,
          detail: JSON.stringify(streamErr),
          apiKey: openai.apiKey ? 'API key exists' : 'API key missing'
        });
        
        // Check if it's an API key issue
        if (streamErr instanceof Error && streamErr.message.includes('auth')) {
          console.error('Possible API key issue detected with OpenAI');
        }
        
        // Check if it's a timeout issue
        if (streamErr instanceof Error && streamErr.message.includes('timeout')) {
          console.error('Request timeout detected when connecting to OpenAI');
        }
        
        // Log environment variables (without exposing the actual key)
        console.error('Environment check:', {
          hasOpenAIKey: !!process.env.OPENAI_QUERY_KEY,
          keyLength: process.env.OPENAI_QUERY_KEY ? process.env.OPENAI_QUERY_KEY.length : 0,
          nodeEnv: process.env.NODE_ENV
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