
// server/utils/contextDebugger.ts

import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

/**
 * Debugs LLM context by saving it to a file for inspection
 * @param userId User ID for tracking context by user
 * @param context The context object containing messages
 * @param type The type of context (qualitative or query)
 */
export async function debugContext(userId: number | string, context: { messages: any[] }, type: 'qualitative' | 'query') {
  try {
    // Create debug directory if it doesn't exist
    const debugDir = path.join(process.cwd(), 'debug_logs');
    await fs.mkdir(debugDir, { recursive: true });
    
    // Create a log filename with timestamp and user ID
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${type}_context_${userId}_${timestamp}.json`;
    const filePath = path.join(debugDir, filename);
    
    // Log that we're debugging the context
    logger.info(`Debugging ${type} context for user ${userId}`, {
      userId,
      contextType: type,
      messageCount: context.messages.length,
      timestamp: new Date().toISOString()
    });
    
    // Format the context for better readability
    const formattedContext = JSON.stringify(context, null, 2);
    
    // Write to file
    await fs.writeFile(filePath, formattedContext, 'utf8');
    
    logger.info(`Context debug saved to ${filename}`);
    
    // Return true to indicate success
    return true;
  } catch (error) {
    // Log errors but don't fail the entire operation
    logger.error('Error debugging context:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      contextType: type
    });
    
    // Return false to indicate failure
    return false;
  }
}
