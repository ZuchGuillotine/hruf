
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
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullResponse = '';
      
      try {
        // Get the stream from OpenAI
        const { stream } = await queryWithAI(contextualizedMessages, userId, true);
        
        // Send each chunk as it arrives
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            // Format as SSE
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
            // Flush the response to ensure chunks are sent immediately
            res.flush?.();
          }
        }
        
        // Send end of stream event
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        
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
