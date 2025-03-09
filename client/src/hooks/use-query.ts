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

          let responseText = "";
          let timeoutTimer: NodeJS.Timeout;
          let reconnectAttempts = 0;
          const MAX_RECONNECT_ATTEMPTS = 3;
          const RECONNECT_TIMEOUT = 3000;

          // Set up event handlers
          eventSource.onopen = () => {
            // Reset timeout when connection opens
            clearTimeout(timeoutTimer);

            // Set a new timeout as a safeguard
            timeoutTimer = setTimeout(() => {
              console.log("Connection timeout - closing EventSource");
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);

              if (responseText) {
                // If we received some content, use it
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = responseText;
                  return newMessages;
                });
              } else {
                setError("Connection timed out. Please try again.");
              }
            }, 15000); // 15 second timeout
          };

          eventSource.onmessage = (event) => {
            clearTimeout(timeoutTimer); // Reset timeout on each message

            try {
              const data = JSON.parse(event.data);

              // Handle different message types
              if (data.initializing) {
                // Initial connection established
                timeoutTimer = setTimeout(() => {
                  eventSource.close();
                  setError("Response timeout. Please try again.");
                  setIsLoading(false);
                  setIsStreaming(false);
                }, 20000); // 20 second timeout for first content
              } else if (data.heartbeat) {
                // Heartbeat - do nothing but keep connection alive
              } else if (data.content !== undefined) {
                // Content chunk received
                responseText += data.content;

                // Update the assistant message with the latest content
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = responseText;
                  return newMessages;
                });

                // Extend timeout after receiving content
                timeoutTimer = setTimeout(() => {
                  eventSource.close();
                  setIsLoading(false);
                  setIsStreaming(false);
                }, 10000); // 10 seconds without new content will close connection
              } else if (data.done) {
                // End of stream
                eventSource.close();
                setIsLoading(false);
                setIsStreaming(false);
              } else if (data.error) {
                // Server reported an error
                throw new Error(data.error);
              }
            } catch (err) {
              console.error("Error parsing SSE message:", err);
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);
              setError("Failed to parse streaming response");
            }
          };

          eventSource.onerror = (err) => {
            console.log("EventSource error encountered:", err);

            // Attempt to reconnect a limited number of times
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++;
              console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

              // Close current connection
              eventSource.close();

              // Try to reconnect after a delay
              setTimeout(() => {
                const newEventSource = new EventSource(eventSourceUrl);
                // Update the reference to the new EventSource
                Object.assign(eventSource, newEventSource);
              }, RECONNECT_TIMEOUT);
            } else {
              // Give up after max attempts
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);

              // If we have partial content, show it
              if (responseText) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = responseText;
                  return newMessages;
                });
              } else {
                setError("Connection failed. Please try again.");
              }
            }
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
      } else {
        // Non-streaming implementation (fallback)
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
      }
    } catch (error) {
      console.error("Query error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
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