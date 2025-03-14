
import fs from 'fs';
import path from 'path';

interface ContextMessage {
  role: string;
  content: string;
}

interface DebugData {
  timestamp: string;
  userId: string | number;
  contextType: 'query' | 'qualitative';
  messageCount: number;
  systemPrompt: string;
  userContext: string;
  tokenEstimate: number;
  contextComponents?: {
    hasHealthStats: boolean;
    hasSupplementLogs: boolean;
    hasQualitativeObservations: boolean;
    hasRecentSummaries: boolean;
  };
}

function analyzeContext(messages: ContextMessage[]) {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  return {
    hasHealthStats: userMessage.includes('Health Stats:'),
    hasSupplementLogs: userMessage.includes('Supplement Logs:'),
    hasQualitativeObservations: userMessage.includes('Previous Observations:'),
    hasRecentSummaries: userMessage.includes('Recent Summaries:')
  };
}

function estimateTokens(messages: ContextMessage[]): number {
  return messages.reduce((sum, msg) => sum + (msg.content?.length || 0) / 4, 0);
}

function debugContext(userId: string | number, messages: ContextMessage[], type: 'query' | 'qualitative') {
  const debugData: DebugData = {
    timestamp: new Date().toISOString(),
    userId,
    contextType: type,
    messageCount: messages.length,
    systemPrompt: messages.find(m => m.role === 'system')?.content || '',
    userContext: messages.find(m => m.role === 'user')?.content || '',
    tokenEstimate: estimateTokens(messages),
    contextComponents: analyzeContext(messages)
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

export { debugContext };
