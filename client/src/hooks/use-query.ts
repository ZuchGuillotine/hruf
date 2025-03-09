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
          console.log("EventSource connection opened successfully");
        };

        // Handle errors with retry logic
        let retryCount = 0;
        const maxRetries = 3;

        eventSource.onerror = (err) => {
          console.error("EventSource error encountered:", err);

          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Attempting to reconnect (${retryCount}/${maxRetries})...`);
            // EventSource will automatically try to reconnect
            return;
          }

          // After max retries, close and fallback
          eventSource.close();
          setIsLoading(false);
          setIsStreaming(false);

          // Fallback to non-streaming approach
          if (responseContent === "") {
            setError("Streaming failed. Falling back to standard request...");
            fallbackToNonStreaming(userMessage);
          } else {
            setError("Connection to the server was lost, but partial response was received.");
          }
        };

        // Add timeout to prevent hanging connections
        const connectionTimeout = setTimeout(() => {
          if (responseContent === "") {
            console.log("Connection timeout - closing EventSource");
            eventSource.close();
            setIsLoading(false);
            setIsStreaming(false);
            setError("Request timed out. Please try again.");
          }
        }, 30000); // 30 second timeout

        // Clear timeout when we get a response
        eventSource.onmessage = (event) => {
          clearTimeout(connectionTimeout);
          // ... existing message handling code
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
const fallbackToNonStreaming = async (userMessage: Message) => {
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
      // Update the last message with the response
      newMessages[newMessages.length - 1] = {
        role: "assistant",
        content: data.response,
      };
      return newMessages;
    });

    setIsLoading(false);
    setResult({
      response: data.response,
      usage: data.usage,
      model: data.model,
    });
  } catch (err) {
    console.error("Fallback request failed:", err);
    setError("Failed to get a response. Please try again later.");
    setIsLoading(false);
  }
};