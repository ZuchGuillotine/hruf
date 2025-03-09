
import { useState } from "react";
import { Message } from "@/lib/types";

type QueryResult = {
  response: string;
  usage?: any;
  model?: string;
};

export function useQuery() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const resetChat = () => {
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    setError(null);
    setResult(null);
  };

  const sendQuery = async (content: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      role: "user",
      content,
    };

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);

    // Add empty assistant message for streaming
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    try {
      // Check if stream is available and try it first
      if (window.EventSource) {
        try {
          // Add unique identifier to prevent caching
          const timestamp = Date.now();
          const requestId = Math.random().toString(36).substring(2, 15);

          // Create event source for server-sent events with cache-busting
          const eventSourceUrl = `/api/query?stream=true&messages=${encodeURIComponent(JSON.stringify([userMessage]))}&t=${timestamp}&rid=${requestId}`;
          console.log("Creating EventSource with URL:", eventSourceUrl);

          // Create a fetch request first to check connection status
          const testConnection = await fetch('/api/query?ping=true', { 
            method: 'HEAD',
            credentials: 'same-origin' 
          });

          if (!testConnection.ok) {
            throw new Error(`API server not responding: ${testConnection.status}`);
          }

          // Create EventSource with proper credentials
          const eventSource = new EventSource(eventSourceUrl);
          
          setIsStreaming(true);
          
          // Create a timeout for connection
          let timeoutTimer = setTimeout(() => {
            console.log("Connection timeout - closing EventSource");
            eventSource.close();
            setIsStreaming(false);
            setIsLoading(false);
            setError("Connection timeout. The server did not respond in time.");
          }, 15000);
          
          // Set up EventSource handlers
          eventSource.onopen = () => {
            clearTimeout(timeoutTimer); // Clear the timeout on successful connection
            console.log("EventSource connection established");
          };
          
          eventSource.onmessage = (event) => {
            clearTimeout(timeoutTimer); // Reset timeout on each message
            
            // Reset timeout for next message
            timeoutTimer = setTimeout(() => {
              console.log("Message timeout - closing EventSource");
              eventSource.close();
              setIsStreaming(false);
              setIsLoading(false);
            }, 15000);
            
            try {
              const data = JSON.parse(event.data);
              
              // Handle normal content chunks
              if (data.content !== undefined) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content += data.content;
                  return newMessages;
                });
              }
              
              // Handle completion
              if (data.done) {
                clearTimeout(timeoutTimer);
                eventSource.close();
                setIsStreaming(false);
                setIsLoading(false);
              }
              
              // Handle initialization message
              if (data.initializing) {
                console.log("Stream initialized");
              }
              
              // Handle heartbeat
              if (data.heartbeat) {
                console.log("Heartbeat received");
              }
              
              // Handle errors
              if (data.error) {
                setError(data.error);
                clearTimeout(timeoutTimer);
                eventSource.close();
                setIsStreaming(false);
                setIsLoading(false);
              }
            } catch (parseError) {
              console.error("Failed to parse SSE message:", parseError, event.data);
            }
          };
          
          eventSource.onerror = (err) => {
            console.error("EventSource error encountered:", err);
            
            // Try to reconnect a few times before giving up
            let reconnectAttempt = 0;
            const maxReconnectAttempts = 3;
            
            const tryReconnect = () => {
              reconnectAttempt++;
              if (reconnectAttempt <= maxReconnectAttempts) {
                console.log(`Attempting to reconnect (${reconnectAttempt}/${maxReconnectAttempts})...`);
                // Don't actually reconnect here, just close and let the fallback take over
                eventSource.close();
              } else {
                // Give up and fall back to standard fetch
                eventSource.close();
                setIsStreaming(false);
                
                // Fallback to non-streaming after failed reconnect attempts
                fallbackToStandardFetch(userMessage);
              }
            };
            
            tryReconnect();
          };
          
          // Handle cleanup if component unmounts during streaming
          return () => {
            clearTimeout(timeoutTimer);
            eventSource.close();
            setIsLoading(false);
            setIsStreaming(false);
          };
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          setIsStreaming(false);
          setError("Failed to set up streaming connection. Please try again.");
        }
      } 
      
      // Fallback to non-streaming approach
      if (!window.EventSource) {
        await fallbackToStandardFetch(userMessage);
      }
    } catch (error) {
      console.error("Query error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function for fallback to standard fetch
  const fallbackToStandardFetch = async (userMessage: Message) => {
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      // Update the assistant message with the response
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = data.response;
        return newMessages;
      });

      setResult(data);
    } catch (apiError) {
      console.error("API error:", apiError);

      // Remove the empty assistant message
      setMessages((prev) => prev.slice(0, -1));
      setError(apiError instanceof Error ? apiError.message : "Unknown error occurred");
    }
  };

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    result,
    sendQuery,
    resetChat,
  };
}
