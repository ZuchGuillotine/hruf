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
  qualitativeContext?: {
    recentLogs?: boolean;
    historicalSummaries?: boolean;
    supplementData?: boolean;
    healthProfile?: boolean;
  };
}

export interface QualitativeDebugInfo {
  chatType: 'feedback' | 'query';
  messagePreview: string;
  contextComponents: string[];
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
  
  const hasContent = (markers: string[]) => 
    markers.some(marker => userMessage.toLowerCase().includes(marker.toLowerCase()));
  
  return {
    hasHealthStats: hasContent(['User Health Profile', 'Weight:', 'Height:', 'Gender:']),
    hasRecentSummaries: hasContent(['Recent Daily Summaries:', 'Supplement Log Summary', 'Recent Summary:', '[SUMMARY:']),
    hasHistoricalSummaries: hasContent(['Historical Health Summaries', 'Historical Summary:', 'Previous Summaries']),
    hasQualitativeObservations: hasContent(['Qualitative Observations:', 'Effects Recorded:', 'User Reported:', 'Feedback:']),
    hasSupplementLogs: hasContent(['Supplements Taken:', 'Recent Supplement History', 'Supplement Log:', 'Dosage:']),
    hasDirectSupplementInfo: hasContent(['Direct Supplement Information', 'Supplement Details:', 'Current Regimen:'])
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
    

/**
 * Analyzes qualitative chat context for debugging
 */
function analyzeContextComponents(messages: ContextMessage[], type: 'query' | 'qualitative'): DebugData['contextComponents'] {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  const baseAnalysis = {
    supplementData: userMessage.includes('Supplement Data:'),
    healthProfile: userMessage.includes('User Health Profile:')
  };

  // Add qualitative-specific components while preserving query analysis
  return type === 'qualitative' ? {
    ...baseAnalysis,
    recentLogs: userMessage.includes('Recent Daily Summaries:'),
    historicalSummaries: userMessage.includes('Historical Summaries:'),
  } : baseAnalysis;
}

/**
 * Debug qualitative chat context
 */
export async function debugQualitativeChat(
  userId: string | number,
  messages: ContextMessage[],
  chatInfo: QualitativeDebugInfo
): Promise<DebugData | undefined> {
  try {
    if (!isDebugEnabled()) {
      return;
    }

    logger.info(`Qualitative chat request with ${messages.length} message(s)`, {
      userId,
      messagePreview: chatInfo.messagePreview
    });

    return await debugContext(userId, { messages }, 'qualitative');
  } catch (error) {
    logger.error('Error in qualitative chat debugging:', error);
    return undefined;
  }
}

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
