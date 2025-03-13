
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
    try {
      await fs.mkdir(debugDir, { recursive: true });
      logger.info(`Debug directory ensured at: ${debugDir}`);
    } catch (mkdirError) {
      logger.error(`Error creating debug directory: ${mkdirError.message}`);
      // Try a fallback approach with absolute path
      try {
        const absolutePath = '/home/runner/workspace/debug_logs';
        await fs.mkdir(absolutePath, { recursive: true });
        logger.info(`Created debug directory at absolute path: ${absolutePath}`);
      } catch (fallbackError) {
        logger.error(`Fallback directory creation also failed: ${fallbackError.message}`);
      }
    }
    
    // Create a log filename with timestamp and user ID
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${type}_context_${userId}_${timestamp}.json`;
    const filePath = path.join(debugDir, filename);
    
    // Log that we're debugging the context
    logger.info(`Debugging ${type} context for user ${userId}`, {
      userId,
      contextType: type,
      messageCount: context.messages.length,
      timestamp: new Date().toISOString(),
      filePath
    });
    
    // Add debugging metadata
    const contextWithDebug = {
      ...context,
      _debug: {
        timestamp: new Date().toISOString(),
        userId,
        contextType: type,
        messageCount: context.messages.length,
        // Include the query if it's in the last message
        query: context.messages.length > 0 ? 
          context.messages[context.messages.length - 1].content.split('User Query:').pop()?.trim() : 
          null
      }
    };
    
    // Format the context for better readability
    const formattedContext = JSON.stringify(contextWithDebug, null, 2);
    
    // Write to file with better error handling
    try {
      await fs.writeFile(filePath, formattedContext, 'utf8');
      logger.info(`Successfully wrote context debug to: ${filePath}`);
    } catch (writeError) {
      logger.error(`Error writing debug file: ${writeError.message}`, {
        error: writeError,
        filePath
      });
      
      // Try alternative approach with sync operations as fallback
      try {
        const fsSync = require('fs');
        fsSync.writeFileSync(filePath, formattedContext, 'utf8');
        logger.info(`Successfully wrote context debug using sync fallback: ${filePath}`);
      } catch (syncError) {
        logger.error(`Sync fallback also failed: ${syncError.message}`);
      }
    }
    
    // Additional logging to help debug
    try {
      const stats = await fs.stat(filePath);
      logger.info(`File stats: exists=${stats.isFile()}, size=${stats.size}, permissions=${stats.mode.toString(8)}`);
    } catch (statError) {
      logger.error(`Could not get file stats: ${statError.message}`);
    }
    
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
