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
  const enableStreaming = true; // Added enableStreaming flag


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

  // Fallback function for non-streaming requests
  const fallbackToNonStreaming = async (userMessage: Message, updatedMessages: Message[]) => {
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
      setIsStreaming(false);
    }
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
  const sendQuery = async (query: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const userMessage: Message = { role: "user", content: query };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // If streaming is enabled, use EventSource
    if (enableStreaming) {
      setIsStreaming(true);

      // Create query string with messages
      const params = new URLSearchParams();
      params.set('stream', 'true');
      params.set('messages', JSON.stringify([userMessage]));

      // Add timestamp to prevent caching
      params.set('t', Date.now().toString());

      // Create URL for EventSource
      const url = `/api/query?${params.toString()}`;
      console.log('Creating EventSource with URL:', url);

      // Create a temporary message that will be updated
      const tempAssistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...updatedMessages, tempAssistantMessage]);

      // Create EventSource connection with error handling
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource(url);

        // Listen for messages
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // If content is provided, update the assistant's message
            if (data.content) {
              setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMsg = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + data.content
                };
                return newMessages;
              });
            }

            // If done is signaled, close the connection
            if (data.done) {
              eventSource?.close();
              setIsLoading(false);
              setIsStreaming(false);
            }
          } catch (error) {
            console.error('Error parsing streaming response:', error);
            eventSource?.close();
            setIsLoading(false);
            setIsStreaming(false);
            setError('Failed to parse streaming response');
          }
        };

        // Handle errors
        eventSource.onerror = (error) => {
          console.error('EventSource detailed error info:', error);
          eventSource?.close();
          setIsLoading(false);
          setIsStreaming(false);

          // Fall back to non-streaming request if streaming fails
          fallbackToNonStreaming(userMessage, updatedMessages);
        };
      } catch (connectionError) {
        console.error('Failed to establish EventSource connection:', connectionError);
        setIsLoading(false);
        setIsStreaming(false);
        setError('Failed to establish streaming connection');

        // Fall back to non-streaming request
        fallbackToNonStreaming(userMessage, updatedMessages);
      }

      return;
    } else {
      await sendQueryTraditional(query);
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