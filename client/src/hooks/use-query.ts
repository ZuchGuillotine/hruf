
import { useState, useRef, useEffect, useCallback } from "react";

export type Message = {
  role: string;
  content: string;
};

export function useQuery() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const sendQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if EventSource is supported
      if (typeof EventSource !== 'undefined') {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create a new EventSource connection for streaming
        const url = `/api/query?stream=true&query=${encodeURIComponent(query)}`;
        eventSourceRef.current = new EventSource(url);
        
        // Initialize an empty assistant message
        const assistantMessage: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Listen for messages
        eventSourceRef.current.onmessage = (event) => {
          if (event.data === '[DONE]') {
            // Stream completed
            setIsLoading(false);
            eventSourceRef.current?.close();
            return;
          }
          
          try {
            const data = JSON.parse(event.data);
            
            if (data.error) {
              setError(data.error);
              setIsLoading(false);
              eventSourceRef.current?.close();
              return;
            }
            
            if (data.content) {
              // Append to the current assistant message content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += data.content;
                }
                return newMessages;
              });
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
            setError('Error processing server response. Please try again.');
          }
        };

        // Handle connection open
        eventSourceRef.current.onopen = () => {
          console.log('SSE connection established');
        };

        // Handle errors
        eventSourceRef.current.onerror = (err) => {
          console.error('EventSource error:', err);
          setError('Connection error. Please try again.');
          setIsLoading(false);
          
          // Close the connection on error
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
        };
      } else {
        // Fallback for browsers not supporting EventSource
        const response = await fetch(`/api/query?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return { sendQuery, messages, isLoading, error, resetChat };
}
