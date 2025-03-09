import { Request, Response } from 'express';
import { constructQueryContext } from '../services/llmContextService_query';
import { queryWithAI, saveInteraction } from '../services/openaiQueryService';
import { db } from '../../db';
import { queryChats } from '../../db/schema';

// Simple ping endpoint to check API availability
export async function ping(req: Request, res: Response) {
  res.status(200).send('API is available');
}

export async function handleQueryRequest(req: Request, res: Response) {
  console.log(`Handling ${req.method} request to /api/query, params:`, {
    method: req.method,
    query: req.query,
    isAuthenticated: !!req.user,
    headers: {
      contentType: req.headers['content-type'],
      accept: req.headers['accept']
    }
  });

  // Handle ping requests for connection testing
  if (req.query.ping === 'true') {
    return res.status(200).send('API is available');
  }

  try {
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).send('');
    }

    // For GET requests, return a simple health check
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'Query endpoint is operational' });
    }

    // Check if the request body is valid
    if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: "Invalid request body. Messages must be an array." });
    }

    const { messages } = req.body;
    const userQuery = messages[messages.length - 1].content;
    const isStreamRequest = req.query.stream === 'true';

    // Determine user authentication status safely
    const userId = req.user?.id || null;
    const isAuthenticated = !!userId;

    console.log('Query request received:', {
      method: req.method,
      isAuthenticated,
      userId,
      messageCount: messages?.length || 0,
      isStreaming: isStreamRequest,
      timestamp: new Date().toISOString()
    });

    // Construct context based on user's data if authenticated
    const { messages: contextualizedMessages } = await constructQueryContext(
      userId ? Number(userId) : null,
      userQuery
    );

    if (isStreamRequest) {
      // Set proper headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Prevents buffering for Nginx
        'Access-Control-Allow-Origin': '*', // Adjust for production as needed
      });

      // Send an initial connection message immediately
      res.write(`data: ${JSON.stringify({ initializing: true })}\n\n`);

      // Flush the response to ensure the client gets the initialization message
      if (res.flush) {
        res.flush();
      }

      let fullResponse = '';

      try {
        console.log('Starting streaming response to client');

        // Get the stream from OpenAI
        const { stream } = await queryWithAI(contextualizedMessages, userId, true);

        // Check if client is still connected
        let clientConnected = true;

        // Handle client disconnection
        res.on('close', () => {
          clientConnected = false;
          console.log('Client closed connection before streaming completed');
        });

        // Send a heartbeat every 5 seconds to keep the connection alive
        const heartbeatInterval = setInterval(() => {
          if (clientConnected) {
            try {
              // Standard SSE comment for heartbeat
              res.write(`:heartbeat\n\n`);

              // Also send an empty data event that clients can detect
              res.write(`data: ${JSON.stringify({ heartbeat: true })}\n\n`);

              if (res.flush) {
                res.flush();
              }
            } catch (err) {
              clientConnected = false;
              console.error('Failed to send heartbeat:', err);
            }
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 5000); // Reduced from 15s to 5s for more frequent keepalive

        // Send each chunk as it arrives with timing logging
        console.log('Starting to process OpenAI stream chunks');
        let chunkCount = 0;

        // Set a more generous timeout for the response
        req.socket.setTimeout(120000); // 2 minutes timeout
        res.setTimeout(120000);

        try {
          for await (const chunk of stream) {
            // Stop if client disconnected
            if (!clientConnected) {
              console.log('Client disconnected, stopping stream processing');
              clearInterval(heartbeatInterval);
              break;
            }

            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || '';

            // Debug chunk content
            if (chunkCount <= 3 || chunkCount % 50 === 0) {
              console.log(`Chunk ${chunkCount} content: "${content.substring(0, 20)}${content.length > 20 ? '...' : ''}"`);
            }

            // Always send a chunk even if empty to keep connection alive
            try {
              // Add the content to the full response if it exists
              if (content) {
                fullResponse += content;
              }

              // Format as SSE - ensure proper format with data: prefix and double newlines
              res.write(`data: ${JSON.stringify({ content, chunkId: chunkCount })}\n\n`);

              // Flush the output to ensure it's sent immediately
              if (res.flush) {
                res.flush();
              }

              // Log progress occasionally
              if (chunkCount % 10 === 0) {
                console.log(`Sent ${chunkCount} chunks so far, current response length: ${fullResponse.length}`);
              }
            } catch (writeError) {
              console.error('Error writing stream chunk:', writeError);
              clearInterval(heartbeatInterval);
              break;
            }
          }
          console.log(`Finished streaming. Total chunks: ${chunkCount}, Final response length: ${fullResponse.length}`);
        } catch (streamError) {
          console.error('Error processing stream:', streamError);

          // Try to send an error message to the client
          try {
            res.write(`data: ${JSON.stringify({ error: 'Error processing stream' })}\n\n`);
            if (res.flush) {
              res.flush();
            }
          } catch (writeError) {
            console.error('Failed to send error message:', writeError);
          }

          clearInterval(heartbeatInterval);
        }

        clearInterval(heartbeatInterval);

        // Send end of stream event if client is still connected
        if (clientConnected) {
          try {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          } catch (endError) {
            console.error('Error sending end of stream event:', endError);
          }
        }

        // If user is authenticated, store the query
        if (userId) {
          // Save the full interaction after streaming is complete
          await db
            .insert(queryChats)
            .values({
              userId: Number(userId),
              messages: contextualizedMessages.concat({ role: 'assistant', content: fullResponse }),
              metadata: {
                savedAt: new Date().toISOString(),
                query: userQuery
              }
            });

          await saveInteraction(userId, userQuery, fullResponse);
        }

        // End the response
        res.end();
      } catch (error) {
        // Handle errors during streaming
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response - original implementation
      const { response, usage, model } = await queryWithAI(contextualizedMessages, userId);

      // If user is authenticated, store the query in query_chats table
      if (userId) {
        await db
          .insert(queryChats)
          .values({
            userId: Number(userId),
            messages: contextualizedMessages.concat({ role: 'assistant', content: response }),
            metadata: {
              savedAt: new Date().toISOString(),
              query: userQuery
            }
          });
      }

      res.json({ response, usage, model });
    }
  } catch (error) {
    console.error('Error in query endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Failed to process query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}