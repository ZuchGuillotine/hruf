
import { debugContext } from '../utils/contextDebugger';
import { chatWithAI, MODELS } from '../openai';
import logger from '../utils/logger';
import { constructUserContext } from './llmContextService';
import { db } from '../../db';
import { qualitativeLogs } from '../../db/schema';

export async function* qualitativeChatWithAI(userId: string | number | undefined, userQuery: string) {
  try {
    // Build context using the context service
    const context = await constructUserContext(userId?.toString() || 'anonymous', userQuery);
    
    // Debug log the context
    await debugContext(userId?.toString() || 'anonymous', context, 'qualitative');

    // Log the request
    logger.info('Qualitative chat request:', {
      userId,
      messageCount: context.messages.length,
      timestamp: new Date().toISOString()
    });

    // Create a unique request ID to track this request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Log the API call
    logger.info(`Making OpenAI API call for qualitative chat:`, {
      userId,
      requestId,
      model: MODELS.QUALITATIVE_CHAT,
      messageCount: context.messages.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Call OpenAI chat with the qualitative model
      const chatStream = chatWithAI(context.messages, MODELS.QUALITATIVE_CHAT);
      
      // Track full response for saving
      let fullResponse = '';
      let isFirstChunk = true;
      
      // Process each chunk
      for await (const chunk of chatStream) {
        logger.debug(`Processing chat chunk:`, {
          requestId,
          chunkSize: chunk.response?.length || 0,
          isError: !!chunk.error,
          isFirstChunk,
          timestamp: new Date().toISOString()
        });

        if (chunk.error) {
          logger.error(`Error in chat stream:`, {
            requestId,
            error: chunk.error,
            timestamp: new Date().toISOString()
          });
          yield { error: chunk.error, streaming: false };
          return;
        }

        if (chunk.response) {
          fullResponse += chunk.response;
          yield { response: chunk.response, streaming: true };
          isFirstChunk = false;
        }
      }

      // Save the complete interaction to the database
      if (userId && fullResponse) {
        try {
          await db.insert(qualitativeLogs).values({
            userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
            userQuery,
            aiResponse: fullResponse,
            timestamp: new Date(),
            requestId
          });

          logger.info(`Saved qualitative chat log:`, {
            requestId,
            userId,
            responseLength: fullResponse.length,
            timestamp: new Date().toISOString()
          });
        } catch (dbError) {
          logger.error(`Failed to save chat log:`, {
            requestId,
            error: dbError instanceof Error ? dbError.message : String(dbError),
            timestamp: new Date().toISOString()
          });
        }
      }

      // Send final chunk
      yield { response: '', streaming: false };
      
    } catch (streamError) {
      logger.error(`Stream processing error:`, {
        requestId,
        error: streamError instanceof Error ? streamError.message : String(streamError),
        stack: streamError instanceof Error ? streamError.stack : undefined,
        timestamp: new Date().toISOString()
      });
      yield { error: 'Error processing chat stream', streaming: false };
    }
  } catch (error) {
    logger.error('Error in qualitative chat service:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    yield { error: 'Error in qualitative chat service', streaming: false };
  }
}
