import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import type { 
  Message, 
  ChatResponse, 
  SaveChatData,
  QualitativeLog,
  ApiError
} from '../types';
import type { ChatEndpoints } from '../endpoints/chat';

// Query Keys
export const chatKeys = {
  all: ['chat'] as const,
  history: () => [...chatKeys.all, 'history'] as const,
};

/**
 * Hook for getting chat history
 */
export function useChatHistory(
  chatEndpoints: ChatEndpoints,
  options?: Omit<UseQueryOptions<QualitativeLog[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: chatKeys.history(),
    queryFn: () => chatEndpoints.getChatHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Hook for supplement queries (non-streaming)
 */
export function useSupplementQuery(
  chatEndpoints: ChatEndpoints,
  options?: UseMutationOptions<{ response: string }, ApiError, Message[]>
) {
  return useMutation({
    mutationFn: (messages: Message[]) => chatEndpoints.query(messages),
    ...options
  });
}

/**
 * Hook for saving chat conversations
 */
export function useSaveChat(
  chatEndpoints: ChatEndpoints,
  options?: UseMutationOptions<QualitativeLog, ApiError, SaveChatData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveChatData) => chatEndpoints.saveChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.history() });
    },
    ...options
  });
}

/**
 * Hook for streaming chat conversations
 */
export function useStreamingChat(chatEndpoints: ChatEndpoints) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const chat = useCallback(async (
    messages: Message[],
    onChunk?: (chunk: ChatResponse) => void
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setLimitReached(false);

    try {
      const result = await chatEndpoints.chat(messages, (chunk) => {
        if (chunk.limitReached) {
          setLimitReached(true);
        }
        onChunk?.(chunk);
      });
      
      return result.response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (error.message.includes('limit reached')) {
        setLimitReached(true);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatEndpoints]);

  const streamChat = useCallback(async (
    messages: Message[],
    onChunk: (chunk: ChatResponse) => void
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setLimitReached(false);

    try {
      const stream = await chatEndpoints.streamChat(messages);
      
      for await (const chunk of chatEndpoints.parseChatStream(stream)) {
        if (chunk.limitReached) {
          setLimitReached(true);
        }
        
        if (chunk.error) {
          throw new Error(chunk.error);
        }
        
        onChunk(chunk);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (error.message.includes('limit reached')) {
        setLimitReached(true);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatEndpoints]);

  const resetLimitReached = useCallback(() => {
    setLimitReached(false);
  }, []);

  return {
    chat,
    streamChat,
    isLoading,
    error,
    limitReached,
    resetLimitReached
  };
}