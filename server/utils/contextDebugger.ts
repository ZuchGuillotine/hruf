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
  tokenEstimate: number;
}

function analyzeContext(messages: ContextMessage[], type: 'query' | 'qualitative') {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';

  return {
    hasHealthStats: userMessage.includes('Health Stats:'),
    hasSupplementLogs: userMessage.includes('Supplement Logs:'),
    hasQualitativeObservations: type === 'qualitative' && userMessage.includes('Previous Observations:'),
    hasRecentSummaries: type === 'qualitative' && userMessage.includes('Recent Summaries:')
  };
}

function estimateTokens(messages: ContextMessage[]): number {
  return messages.reduce((sum, msg) => sum + (msg.content?.length || 0) / 4, 0);
}

function saveDebugLog(userId: number, type: 'query' | 'qualitative', messages: ContextMessage[]) {
  const debugData: DebugData = {
    timestamp: new Date().toISOString(),
    userId,
    contextType: type,
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

export { saveDebugLog as debugContext };