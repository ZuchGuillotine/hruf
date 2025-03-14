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

import { ContextMessage } from '../services/llmContextService';
import fs from 'fs';
import path from 'path';

interface DebugData {
  timestamp: string;
  userId: number;
  contextType: 'query' | 'qualitative';
  messageCount: number;
  systemPrompt: string;
  userContext: string;
  queryContent?: string;
  qualitativeContent?: {
    recentLogs: boolean;
    historicalSummaries: boolean;
    supplementData: boolean;
    healthProfile: boolean;
  };
  tokenEstimate: number;
}

function analyzeContext(messages: ContextMessage[], type: 'query' | 'qualitative'): Partial<DebugData> {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';

  const baseAnalysis = {
    systemPrompt: systemMessage,
    messageCount: messages.length,
    userContext: userMessage,
    tokenEstimate: estimateTokens(messages)
  };

  if (type === 'qualitative') {
    return {
      ...baseAnalysis,
      qualitativeContent: {
        recentLogs: userMessage.includes('Recent Daily Summaries:'),
        historicalSummaries: userMessage.includes('Historical Summaries:'),
        supplementData: userMessage.includes('Supplement Data:'),
        healthProfile: userMessage.includes('User Health Profile:')
      }
    };
  }

  return {
    ...baseAnalysis,
    queryContent: userMessage
  };
}

function estimateTokens(messages: ContextMessage[]): number {
  const totalText = messages.reduce((acc, msg) => acc + msg.content.length, 0);
  return Math.ceil(totalText / 4);
}

function saveDebugLog(userId: number, type: 'query' | 'qualitative', messages: ContextMessage[]) {
  const debugData: DebugData = {
    timestamp: new Date().toISOString(),
    userId,
    contextType: type,
    ...analyzeContext(messages, type),
    messageCount: messages.length,
    systemPrompt: messages.find(m => m.role === 'system')?.content || '',
    userContext: messages.find(m => m.role === 'user')?.content || '',
    tokenEstimate: estimateTokens(messages)
  };

  const fileName = `${type}_context_${userId}_${debugData.timestamp.replace(/:/g, '-')}.json`;
  const debugDir = path.join(process.cwd(), 'debug_logs');

  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(debugDir, fileName),
    JSON.stringify(debugData, null, 2)
  );
}

const contextDebugger = {
  saveDebugLog
};

export default contextDebugger;