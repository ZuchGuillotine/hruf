import type { ApiClient } from '../client';
import type { 
  Message, 
  ChatResponse, 
  ChatRequest,
  QueryRequest,
  SaveChatData,
  QualitativeLog
} from '../types';

/**
 * Chat and LLM API endpoints
 */
export class ChatEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Start a streaming chat session (qualitative feedback)
   * Returns a ReadableStream for Server-Sent Events
   */
  async streamChat(messages: Message[]): Promise<ReadableStream> {
    return this.client.stream('/api/chat', {
      method: 'POST',
      body: { messages }
    });
  }

  /**
   * Send a supplement query (non-streaming)
   */
  async query(messages: Message[]): Promise<{ response: string }> {
    return this.client.post('/api/query', { messages });
  }

  /**
   * Save a chat conversation
   */
  async saveChat(data: SaveChatData): Promise<QualitativeLog> {
    return this.client.post('/api/chat/save', data);
  }

  /**
   * Get chat history
   */
  async getChatHistory(): Promise<QualitativeLog[]> {
    return this.client.get('/api/chat/history');
  }

  /**
   * Parse Server-Sent Events stream into chat responses
   */
  async *parseChatStream(stream: ReadableStream): AsyncGenerator<ChatResponse> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ChatResponse = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Convenience method to chat with streaming and get full response
   */
  async chat(
    messages: Message[], 
    onChunk?: (chunk: ChatResponse) => void
  ): Promise<{ response: string }> {
    const stream = await this.streamChat(messages);
    let fullResponse = '';

    for await (const chunk of this.parseChatStream(stream)) {
      if (chunk.response) {
        fullResponse += chunk.response;
      }
      
      if (chunk.error) {
        throw new Error(chunk.error);
      }

      if (chunk.limitReached) {
        throw new Error('Usage limit reached');
      }

      onChunk?.(chunk);
    }

    return { response: fullResponse };
  }
}