
import fs from 'fs';
import path from 'path';
import { estimateTokenCount } from '../openai';
import logger from './logger';

/**
 * Debug utility to log the context being sent to OpenAI
 * This will help identify issues with context construction
 */
export function debugContext(userId: string | number, context: any, contextType: 'qualitative' | 'query'): void {
  try {
    const debugDir = path.join(__dirname, '../../debug_logs');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    // Format the messages for better readability
    const formattedMessages = context.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      contentPreview: msg.content.substring(0, 200) + '...',
      estimatedTokens: estimateTokenCount(msg.content)
    }));
    
    // Calculate total tokens
    const totalTokens = formattedMessages.reduce((sum: number, msg: any) => sum + msg.estimatedTokens, 0);
    
    // Create debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userId,
      contextType,
      totalMessages: context.messages.length,
      totalEstimatedTokens: totalTokens,
      messages: formattedMessages,
    };
    
    // Save to file
    const filename = `context_debug_${userId}_${contextType}_${Date.now()}.json`;
    fs.writeFileSync(
      path.join(debugDir, filename),
      JSON.stringify(debugInfo, null, 2)
    );
    
    logger.info(`Context debug info saved to ${filename}`, {
      userId,
      contextType,
      totalTokens,
      totalMessages: context.messages.length
    });
    
    // Log warnings if token count is excessive
    if (totalTokens > 10000) {
      logger.warn(`High token count (${totalTokens}) detected in ${contextType} context for user ${userId}`);
    }
  } catch (error) {
    logger.error('Error saving context debug info:', error);
  }
}
