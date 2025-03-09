
import { useState } from "react";
import { Message } from "@/lib/types";

export interface QueryResult {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export function useQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Reset the chat state
  const resetChat = () => {
    setMessages([]);
    setError(null);
    setResult(null);
  };

  // Add user message to the chat
  const addUserMessage = (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    return userMessage;
  };

  // Add assistant message to the chat
  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = { role: "assistant", content };
    setMessages((prev) => [...prev, assistantMessage]);
    return assistantMessage;
  };

  // Stream query using server-sent events
  const streamQuery = async (userQuery: string) => {
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    
    const userMessage = addUserMessage(userQuery);
    const timestamp = Date.now(); // Add timestamp to prevent caching
    
    try {
      // Create placeholder for assistant response
      let assistantMessage = addAssistantMessage("");
      
      // Create event source for server-sent events
      console.log("Creating EventSource with URL:", `/api/query?stream=true&messages=${encodeURIComponent(JSON.stringify([userMessage]))}&t=${timestamp}`);
      const eventSource = new EventSource(`/api/query?stream=true&messages=${encodeURIComponent(JSON.stringify([userMessage]))}&t=${timestamp}`);
      
      let responseContent = "";
      
      // Handle incoming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // If done, close the connection
          if (data.done) {
            eventSource.close();
            setIsLoading(false);
            setIsStreaming(false);
            setResult({
              response: responseContent,
            });
            return;
          }
          
          // Otherwise, append content to the message
          if (data.content) {
            responseContent += data.content;
            
            // Update the assistant message with new content
            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: responseContent,
              };
              return newMessages;
            });
          }
        } catch (e) {
          console.error("Error parsing SSE message:", e);
        }
      };
      
      // Handle errors
      eventSource.onerror = (err) => {
        console.error("EventSource detailed error info:", err);
        eventSource.close();
        setIsLoading(false);
        setIsStreaming(false);
        setError("An error occurred while streaming the response. Please try again.");
      };
      
    } catch (err) {
      setIsLoading(false);
      setIsStreaming(false);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  // Traditional non-streaming query
  const sendQueryTraditional = async (userQuery: string) => {
    setIsLoading(true);
    setError(null);
    
    const userMessage = addUserMessage(userQuery);
    
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [userMessage] }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get response");
      }
      
      const data = await response.json();
      addAssistantMessage(data.response);
      setResult(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Main query function - use streaming by default
  const sendQuery = async (userQuery: string, useStreaming = true) => {
    if (useStreaming) {
      await streamQuery(userQuery);
    } else {
      await sendQueryTraditional(userQuery);
    }
  };

  return {
    sendQuery,
    messages,
    isLoading,
    isStreaming,
    error,
    resetChat,
    result,
  };
}
