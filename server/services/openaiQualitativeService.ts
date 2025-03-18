
import { debugContext } from '../utils/contextDebugger';
import { chatWithAI, MODELS } from '../openai';
import logger from '../utils/logger';
import { constructUserContext } from './llmContextService';

export async function* qualitativeChatWithAI(userId: string | number | undefined, userQuery: string) {
  try {
    // Build context using the context service
    const context = await constructUserContext(userId, userQuery);
    
    // Debug log the context
    await debugContext(userId?.toString() || 'anonymous', context, 'qualitative');

    // Log the request
    logger.info('Qualitative chat request:', {
      userId,
      messageCount: context.messages.length,
      timestamp: new Date().toISOString()
    });

    // Call OpenAI chat with the qualitative model
    return chatWithAI(context.messages, MODELS.QUALITATIVE_CHAT);
  } catch (error) {
    logger.error('Error in qualitative chat service:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
