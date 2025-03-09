
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

  // Helper function for non-streaming fallback
  const fallbackToStandardFetch = async (userMessage: Message) => {
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      // Update the assistant message with the response
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1].content = data.response;
        }
        return newMessages;
      });

      setResult(data);
      setIsLoading(false);
    } catch (error) {
      console.error("API error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsLoading(false);
    }
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

          // Use POST method instead of GET with EventSource
          const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            },
            body: JSON.stringify({
              messages: [userMessage],
              stream: true,
            }),
          });

          if (!response.ok || !response.body) {
            throw new Error(`Server error: ${response.status}`);
          }

          // Set up streaming with ReadableStream
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          setIsStreaming(true);

          // Create a fetch request first to check connection status
          const testConnection = await fetch('/api/query?ping=true', { 
            method: 'HEAD',
            credentials: 'same-origin' 
          });

          if (!testConnection.ok) {
            throw new Error(`API server not responding: ${testConnection.status}`);
          }

          // Process the stream
          let accumulatedResponse = "";
          
          // Create a timeout for connection
          let timeoutTimer = setTimeout(() => {
            console.log("Connection timeout - canceling stream");
            reader.cancel();
            setIsStreaming(false);
            setIsLoading(false);
            setError("Connection timeout. The server did not respond in time.");
          }, 20000);
          
          async function readStream() {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  console.log("Stream complete");
                  clearTimeout(timeoutTimer);
                  setIsStreaming(false);
                  setIsLoading(false);
                  break;
                }
                
                // Reset timeout on each chunk
                clearTimeout(timeoutTimer);
                timeoutTimer = setTimeout(() => {
                  console.log("Stream timeout - canceling stream");
                  reader.cancel();
                  setIsStreaming(false);
                  setIsLoading(false);
                }, 20000);
                
                const chunk = decoder.decode(value, { stream: true });
                
                // Process SSE format (data: {...}\n\n)
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    try {
                      const jsonStr = line.substring(5).trim();
                      if (jsonStr) {
                        const data = JSON.parse(jsonStr);
                        
                        // Handle normal content chunks
                        if (data.content !== undefined) {
                          accumulatedResponse += data.content;
                          setMessages((prev) => {
                            const newMessages = [...prev];
                  if (newMessages.length > 0) {
                              const lastMessage = newMessages[newMessages.length - 1];
                              lastMessage.content = accumulatedResponse;
                            }
                            return newMessages;
                          });
                        }
                        
                        // Handle completion
                        if (data.done) {
                          clearTimeout(timeoutTimer);
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
                          setIsStreaming(false);
                          setIsLoading(false);
                          reader.cancel();
                        }
                      }
                    } catch (parseError) {
                      console.error("Failed to parse SSE message:", parseError, line);
                    }
                  }
                }
              }
            } catch (streamError) {
              console.error("Stream reading error:", streamError);
              clearTimeout(timeoutTimer);
              setError(streamError instanceof Error ? streamError.message : "Error reading stream");
              setIsStreaming(false);
              setIsLoading(false);
            }
          }
          
          // Start reading the stream
          readStream().catch(err => {
            console.error("Stream processing failed:", err);
            setError(err instanceof Error ? err.message : "Failed to process response stream");
            setIsStreaming(false);
            setIsLoading(false);
          });
            
            // Handle cleanup if component unmounts during streaming
          return () => {
            clearTimeout(timeoutTimer);
            reader.cancel();
            setIsLoading(false);
            setIsStreaming(false);
          };
        } catch (streamError) {
          console.error("Streaming setup error:", streamError);
          setIsStreaming(false);
          setError("Failed to set up streaming connection. Falling back to standard request.");
          
          // Fallback to non-streaming after streaming setup failure
          await fallbackToStandardFetch(userMessage);
        }
      } else {
        // Fallback for browsers without ReadableStream support
        await fallbackToStandardFetch(userMessage);
      }
    } catch (error) {
      console.error("Query error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsLoading(false);
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
