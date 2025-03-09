import { useState } from "react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

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

    // Determine if we should use streaming
    const useStreaming = true; // Always use streaming

    if (useStreaming) {
      setIsStreaming(true);

      try {
        const timestamp = Date.now();

        // Create event source for server-sent events
        const eventSourceUrl = `/api/query?stream=true&messages=${encodeURIComponent(JSON.stringify([userMessage]))}&t=${timestamp}`;
        console.log("Creating EventSource with URL:", eventSourceUrl);

        const eventSource = new EventSource(eventSourceUrl);

        let responseContent = "";

        // Handle incoming events
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // If content is provided, update the message
            if (data.content) {
              responseContent += data.content;

              // Update the last message (assistant's response)
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const lastIndex = newMessages.length - 1;
                newMessages[lastIndex] = {
                  ...newMessages[lastIndex],
                  content: responseContent,
                };
                return newMessages;
              });
            }

            // If done is signaled, close the connection
            if (data.done) {
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);
              setResult({
                response: responseContent,
              });
            }
          } catch (err) {
            console.error("Error parsing SSE message:", err);
          }
        };

        // Handle connection opening
        eventSource.onopen = () => {
          console.log("EventSource connection opened");
        };

        // Handle errors
        eventSource.onerror = (err) => {
          console.error("EventSource detailed error info:", err);
          eventSource.close();
          setIsLoading(false);
          setIsStreaming(false);
          setError("Connection to the server was lost. Please try again.");
        };

      } catch (err) {
        console.error("Failed to set up streaming:", err);
        setIsLoading(false);
        setIsStreaming(false);
        setError("Failed to set up streaming connection. Please try again.");
      }
    } else {
      // Non-streaming implementation (fallback)
      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [userMessage] }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: data.response,
          };
          return newMessages;
        });

        setResult(data);
      } catch (err) {
        console.error("Error in non-streaming query:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    sendQuery,
    messages,
    isLoading,
    isStreaming,
    error,
    result,
    resetChat,
  };
}