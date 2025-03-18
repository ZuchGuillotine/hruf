
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Message } from '@/lib/types';

interface DebugData {
  timestamp: string;
  userId: string;
  contextType: 'query' | 'qualitative';
  messageCount: number;
  systemPrompt: string | null;
  userContext: string | null;
  messages: Message[];
  tokenEstimates: {
    total: number;
    byMessage: Array<{
      role: string;
      tokens: number;
      preview: string;
    }>;
  };
  contextComponents?: {
    hasHealthStats: boolean;
    hasSupplementLogs: boolean;
    hasQualitativeObservations: boolean;
    hasRecentSummaries: boolean;
  };
}

export async function debugContext(
  userId: string,
  context: { messages: Message[] },
  type: 'query' | 'qualitative'
) {
  try {
    const systemMsg = context.messages.find(m => m.role === 'system');
    const userMsg = context.messages.find(m => m.role === 'user');

    const debugData: DebugData = {
      timestamp: new Date().toISOString(),
      userId,
      contextType: type,
      messageCount: context.messages.length,
      systemPrompt: systemMsg?.content || null,
      userContext: userMsg?.content || null,
      messages: context.messages,
      tokenEstimates: {
        total: context.messages.reduce((sum, msg) => sum + (msg.content?.length || 0) / 4, 0),
        byMessage: context.messages.map(msg => ({
          role: msg.role,
          tokens: (msg.content?.length || 0) / 4,
          preview: msg.content?.substring(0, 100) || ''
        }))
      },
      contextComponents: analyzeContext(context.messages)
    };

    const filename = `${type}_context_${userId}_${debugData.timestamp.replace(/:/g, '-')}.json`;
    const debugDir = join(process.cwd(), 'debug_logs');
    
    await writeFile(
      join(debugDir, filename),
      JSON.stringify(debugData, null, 2)
    );

    console.log(`Debug log created: ${filename}`);
  } catch (error) {
    console.error('Error creating debug log:', error);
  }
}

function analyzeContext(messages: Message[]) {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  return {
    hasHealthStats: userMessage.includes('Health Stats:'),
    hasSupplementLogs: userMessage.includes('Supplement Logs:'),
    hasQualitativeObservations: userMessage.includes('Previous Observations:'),
    hasRecentSummaries: userMessage.includes('Recent Summaries:')
  };
}
