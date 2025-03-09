
import { Request, Response } from 'express';
import { constructQueryContext } from '../services/llmContextService_query';
import { queryWithAI, saveInteraction } from '../services/openaiQueryService';
import { db } from '../../db';
import { queryChats } from '../../db/schema';

export async function handleQueryRequest(req: Request, res: Response) {
  try {
    const { messages } = req.body;
    const userQuery = messages[messages.length - 1].content;
    const isStreamRequest = req.query.stream === 'true';
    
    // Check if user is authenticated
    const userId = req.user?.id || null;
    
    console.log('Query request received:', {
      isAuthenticated: !!userId,
      userId: userId,
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
      
      // Send an initial connection message
      res.write(`data: ${JSON.stringify({ initializing: true })}\n\n`);

      let fullResponse = '';
      
      try {
        // Get the stream from OpenAI
        const { stream } = await queryWithAI(contextualizedMessages, userId, true);
        
        // Check if client is still connected
        let clientConnected = true;
        
        // Handle client disconnection
        res.on('close', () => {
          clientConnected = false;
          console.log('Client closed connection before streaming completed');
        });
        
        // Send a heartbeat every 15 seconds to keep the connection alive
        const heartbeatInterval = setInterval(() => {
          if (clientConnected) {
            try {
              res.write(`:heartbeat\n\n`); // Comment line for SSE
            } catch (err) {
              clientConnected = false;
              console.error('Failed to send heartbeat:', err);
            }
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 15000);
        
        // Send each chunk as it arrives
        for await (const chunk of stream) {
          // Stop if client disconnected
          if (!clientConnected) {
            clearInterval(heartbeatInterval);
            break;
          }
          
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            try {
              // Format as SSE - ensure proper format with data: prefix and double newlines
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            } catch (writeError) {
              console.error('Error writing stream chunk:', writeError);
              clearInterval(heartbeatInterval);
              break;
            }
          }
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
