/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 13/03/2025 - 17:21:14
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 13/03/2025
    * - Author          : 
    * - Modification    : 
**/
// server/utils/contextDebugger.ts

import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger';
import { safeDate } from './dateUtils';

// Types for context debugging
export interface ContextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UserContextFlags {
  hasHealthStats: boolean;
  hasRecentSummaries: boolean;
  hasHistoricalSummaries: boolean;
  hasQualitativeObservations: boolean;
  hasSupplementLogs: boolean;
  hasDirectSupplementInfo: boolean;
}

export interface TokenEstimate {
  role: string;
  tokens: number;
  preview: string;
}

export interface DebugData {
  timestamp: string;
  userId: string;
  contextType: 'qualitative' | 'query';
  messageCount: number;
  systemPrompt?: string;
  userContext: UserContextFlags;
  query?: string;
  messages: ContextMessage[];
  tokenEstimates: {
    total: number;
    byMessage: TokenEstimate[];
  };
}

/**
 * Checks if context debugging is enabled based on environment
 */
function isDebugEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONTEXT_DEBUG === 'true';
}

/**
 * Extracts user query from context messages
 */
function extractUserQuery(messages: ContextMessage[]): string | undefined {
  const queryMessage = messages.find(m => m.content.includes('User Query:'));
  return queryMessage?.content.split('User Query:')[1]?.trim();
}

/**
 * Calculates token estimates for messages
 */
function calculateTokenEstimates(messages: ContextMessage[]) {
  return {
    total: messages.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0),
    byMessage: messages.map(msg => ({
      role: msg.role,
      tokens: Math.ceil(msg.content.length / 4),
      preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
    }))
  };
}

/**
 * Analyzes context messages for presence of different context types
 */
function analyzeUserContext(messages: ContextMessage[]): UserContextFlags {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  return {
    hasHealthStats: userMessage.includes('User Health Profile') && userMessage.includes('Weight:'),
    hasRecentSummaries: userMessage.includes('Recent Daily Summaries:') || userMessage.includes('Supplement Log Summary'),
    hasHistoricalSummaries: userMessage.includes('Recent Supplement History') || userMessage.includes('Historical Health Summaries'),
    hasQualitativeObservations: userMessage.includes('Qualitative Observations:') || userMessage.includes('Effects Recorded:'),
    hasSupplementLogs: userMessage.includes('Supplements Taken:') || userMessage.includes('Recent Supplement History'),
    hasDirectSupplementInfo: userMessage.includes('Direct Supplement Information')
  };
}

/**
 * Debug context data for LLM interactions
 * @param userId - User ID for context association
 * @param contextData - The context data being sent to the LLM
 * @param contextType - Type of context being debugged
 * @returns Debug data object or undefined if debugging is disabled
 */
export async function debugContext(
  userId: string | number,
  contextData: { messages: ContextMessage[] },
  contextType: 'qualitative' | 'query'
): Promise<DebugData | undefined> {
  try {
    if (!isDebugEnabled()) {
      return;
    }

    const timestamp = safeDate(new Date())?.toISOString().replace(/[:.]/g, '-') ?? 
      new Date().toISOString().replace(/[:.]/g, '-');
    
    const debugData: DebugData = {
      timestamp,
      userId: String(userId),
      contextType,
      messageCount: contextData.messages.length,
      systemPrompt: contextData.messages.find(m => m.role === 'system')?.content,
      userContext: analyzeUserContext(contextData.messages),
      query: extractUserQuery(contextData.messages),
      messages: contextData.messages,
      tokenEstimates: calculateTokenEstimates(contextData.messages)
    };

    const debugDir = path.join(process.cwd(), 'debug_logs');
    
    // Create directory if it doesn't exist
    await fs.mkdir(debugDir, { recursive: true }).catch(error => {
      logger.error('Error creating debug directory:', error);
      throw error;
    });

    const filename = `${contextType}_context_${String(userId)}_${timestamp}.json`;
    const filepath = path.join(debugDir, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(debugData, null, 2)
    ).catch(error => {
      logger.error('Error writing debug file:', error);
      throw error;
    });

    logger.info(`Debug context written to ${filepath}`);
    
    return debugData;
  } catch (error) {
    logger.error('Error in context debugging:', error);
    return undefined;
  }
}
