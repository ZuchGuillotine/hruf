
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

  const sendQuery = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const newUserMessage: Message = { role: "user", content: query };
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);
      
      // Send query to API
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get response");
      }
      
      const data = await response.json();
      
      // Add assistant response to the chat
      const assistantMessage: Message = { role: "assistant", content: data.response };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setResult(data);
      
      // Save the chat to our dedicated query chat storage
      try {
        await fetch("/api/query/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: finalMessages }),
        });
      } catch (saveErr) {
        console.error("Failed to save query chat:", saveErr);
        // Non-blocking error - we don't need to alert the user
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Query error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetChat = () => {
    setMessages([]);
    setResult(null);
    setError(null);
  };
  
  const loadHistory = async () => {
    try {
      const response = await fetch("/api/query/history");
      if (!response.ok) {
        throw new Error("Failed to fetch query history");
      }
      
      const history = await response.json();
      return history;
    } catch (err) {
      console.error("Error loading query history:", err);
      return [];
    }
  };

  return {
    sendQuery,
    resetChat,
    loadHistory,
    messages,
    result,
    isLoading,
    error,
  };
}
