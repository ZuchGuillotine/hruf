
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
      setMessages([...updatedMessages, assistantMessage]);
      setResult(data);
      
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
  
  return {
    sendQuery,
    resetChat,
    messages,
    result,
    isLoading,
    error,
  };
}
