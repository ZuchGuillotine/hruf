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
  const responseTextRef = useRef('');

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
    responseTextRef.current = ''; // Reset accumulated response text

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if EventSource is supported
      if (typeof EventSource !== 'undefined') {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // First, make a POST request to initiate the streaming response
        const messagesPayload = [userMessage];
        const encodedMessages = encodeURIComponent(JSON.stringify(messagesPayload));

        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const url = `/api/query?stream=true&messages=${encodedMessages}&t=${timestamp}`;
        console.log('Creating EventSource with URL:', url);

        // Create a new EventSource for streaming
        const newEventSource = new EventSource(url);
        eventSourceRef.current = newEventSource;

        // Add an assistant message placeholder
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        // Handle incoming events
        newEventSource.onmessage = (event) => {
          try {
            // Log raw message for debugging
            console.log('SSE Message received:', event.data);

            // Handle special DONE marker
            if (event.data === '[DONE]') {
              console.log('Stream completed with DONE marker');
              newEventSource.close();
              eventSourceRef.current = null;
              setIsLoading(false);
              return;
            }

            const data = JSON.parse(event.data);

            if (data.content) {
              // Update the assistant's message with accumulating content
              responseTextRef.current += data.content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content = responseTextRef.current;
                }
                return newMessages;
              });
            } else if (data.debug) {
              // Just log debug info
              console.log('Stream debug info:', data.debug);
            } else if (data.error) {
              // Handle error in the stream
              console.error('Stream error:', data.error);
              setError(data.error.details || data.error);
              newEventSource.close();
              eventSourceRef.current = null;
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err, event.data);
          }
        };

        // Handle errors
        newEventSource.onerror = (err) => {
          console.error('EventSource error:', err);
          // Log detailed error info for debugging
          console.log('EventSource detailed error info:', err);

          // Only set error if we haven't received any content yet
          if (!responseTextRef.current) {
            setError('Connection error. Please try again later.');
          }

          newEventSource.close();
          eventSourceRef.current = null;
          setIsLoading(false);
        };

        // Handle the completion of streaming with a specific event
        newEventSource.addEventListener('done', () => {
          console.log('Stream completed with done event');
          newEventSource.close();
          eventSourceRef.current = null;
          setIsLoading(false);
        });

        // Handle open event
        newEventSource.onopen = () => {
          console.log('EventSource connection opened successfully');
        };
      } else {
        // For browsers that don't support EventSource, fall back to regular API call
        console.log('EventSource not supported, falling back to regular API');
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ messages: [userMessage] })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

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
    responseTextRef.current = ''; // Reset accumulated response text
  }, []);

  return { sendQuery, messages, isLoading, error, resetChat };
}