import OpenAI from "openai";
import { constructQueryContext } from "./llmContextService_query";
import { db } from "../../db";
import { qualitativeLogs, queryChats } from "../../db/schema";
import { Message } from "@/lib/types";

// Initialize OpenAI with the separate API key for queries
const openai = new OpenAI({
  apiKey: process.env.OPENAI_QUERY_KEY,
});

export async function queryWithAI(messages: Array<{ role: string; content: string }>, userId: number | null, res?: any) {
  try {
    // Log processing details for debugging
    console.log('Processing query with OpenAI:', {
      userId,
      userIdType: typeof userId,
      messageCount: messages.length,
      isAuthenticated: !!userId,
      timestamp: new Date().toISOString(),
      isStreaming: !!res
    });

    // If a response object is provided, use streaming
    if (res) {
      try {
        // Set appropriate headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Send initial ping to establish connection
        res.write(': ping\n\n');

        // Flush headers to ensure client connection is established
        if (res.flush) {
          res.flush();
        }

        console.log('SSE headers sent, creating OpenAI stream with params:', {
          model: "o3-mini-2025-01-31",
          messageCount: messages.length,
          streaming: true,
          timestamp: new Date().toISOString()
        });

        // Call OpenAI API with streaming enabled
        const stream = await openai.chat.completions.create({
          model: "o3-mini-2025-01-31", // Updated model
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        });

        let fullResponse = '';

        try {
          // Stream each chunk to the client
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
              // Force flush the response to ensure chunks are sent immediately
              if (res.flush) {
                res.flush();
              }
            }
          }

          // If user is authenticated, save the interaction to qualitative logs
          if (userId) {
            await saveInteraction(userId, messages[messages.length - 1].content, fullResponse);
          }

          // End the stream
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (streamError) {
          console.error("Error during streaming:", {
            error: streamError instanceof Error ? streamError.message : 'Unknown error',
            stack: streamError instanceof Error ? streamError.stack : undefined,
            name: streamError instanceof Error ? streamError.name : 'Unknown',
            code: (streamError as any)?.code, // Capture network error codes
            statusCode: (streamError as any)?.statusCode, // Capture HTTP status if available
            type: (streamError as any)?.type, // OpenAI error type
            timestamp: new Date().toISOString(),
            userId: userId,
            messageCount: messages.length,
            modelUsed: "o3-mini-2025-01-31"
          });

          // Try to send a detailed error to the client
          try {
            const errorMessage = streamError instanceof Error 
              ? `${streamError.name}: ${streamError.message}`
              : "Unknown streaming error";

            // Make sure we have headers set
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              // Add CORS headers
              const origin = (res as any).req?.get('Origin') || '*';
              res.setHeader('Access-Control-Allow-Origin', origin);
              res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            // Send an error that the client can understand
            res.write(`data: ${JSON.stringify({ 
              error: "An error occurred during streaming",
              details: errorMessage,
              recoverable: true
            })}\n\n`);

            // End the stream with a proper DONE marker
            res.write('data: [DONE]\n\n');

            // Explicitly end the response
            res.end();
          } catch (endError) {
            console.error("Error sending error message to client:", {
              error: endError instanceof Error ? endError.message : 'Unknown error',
              originalError: streamError instanceof Error ? streamError.message : 'Unknown error',
              headersSent: res.headersSent,
              timestamp: new Date().toISOString()
            });

            // Last resort attempt to close the connection
            try {
              if (!res.writableEnded) {
                res.end();
              }
            } catch (finalError) {
              console.error("Final attempt to close stream failed:", finalError);
            }
          }
        }

        return { streaming: true };
      } catch (error) {
        console.error("Error in streaming setup:", error);
        throw error;
      }
    } 
    
    // Regular non-streaming mode for backward compatibility
    const completion = await openai.chat.completions.create({
      model: "o3-mini-2025-01-31", // Updated model
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

    // If streaming, inform the client of the error
    if (res) {
      res.write(`data: ${JSON.stringify({ error: "An error occurred during the streaming process" })}\n\n`);
      res.end();
    }

    throw error;
  }
}

// Save the query interaction to the qualitative logs
async function saveInteraction(userId: number, query: string, response: string) {
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

    console.log('Saved query interaction to qualitative logs', {
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to save query interaction:", error);
  }
}