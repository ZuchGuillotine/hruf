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

    // Always use streaming but with fallback
    setIsStreaming(true);

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
    ; // Added semicolon here to fix the syntax error
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

  const updateStreamingMessage = (assistantMessage: string) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      const lastIndex = newMessages.length - 1;
      newMessages[lastIndex] = {
        ...newMessages[lastIndex],
        content: assistantMessage,
      };
      return newMessages;
    });
  };

  // Start streaming query with EventSource
  const startStream = async (queryText: string) => {
    setIsLoading(true);
    setIsStreaming(true);
    const newMessages = [...messages, { role: 'user', content: queryText }];
    setMessages(newMessages);

    try {
      // Add timestamp to prevent caching
      const params = new URLSearchParams({
        stream: 'true',
        messages: JSON.stringify(newMessages),
        t: Date.now().toString()
      });

      console.log('Creating EventSource with URL:', `/api/query?${params}`);

      // Create EventSource for the stream
      let eventSource = new EventSource(`/api/query?${params}`);
      let assistantMessage = '';
      let reconnectAttempt = 0;
      const maxReconnects = 3;
      let lastMessageTime = Date.now();

      const attemptReconnect = () => {
        if (reconnectAttempt < maxReconnects) {
          reconnectAttempt++;
          console.log(`Attempting to reconnect (${reconnectAttempt}/${maxReconnects})...`);

          // Close existing connection first
          if (eventSource) {
            eventSource.close();
          }

          // Create a new connection
          eventSource = new EventSource(`/api/query?${params}`);
          setupEventListeners();
          return true;
        } else {
          console.error('Max reconnection attempts reached');
          setError('Connection lost. Max reconnection attempts reached.');
          setIsLoading(false);
          setIsStreaming(false);
          return false;
        }
      };

      const setupEventListeners = () => {
        eventSource.onopen = () => {
          console.log('EventSource connection established');
          lastMessageTime = Date.now();
        };

        eventSource.onmessage = (event) => {
          try {
            lastMessageTime = Date.now();
            reconnectAttempt = 0; // Reset reconnect attempts on successful message

            const data = JSON.parse(event.data);

            // Debug received message
            if (data.content) {
              console.log(`Received chunk: "${data.content.substring(0, 20)}${data.content.length > 20 ? '...' : ''}"`);
            } else {
              console.log('Received message:', JSON.stringify(data).substring(0, 50));
            }

            // Handle initializing message
            if (data.initializing) {
              console.log('Stream initializing...');
              return;
            }

            // Handle heartbeat
            if (data.heartbeat) {
              console.log('Heartbeat received');
              return;
            }

            // Handle content chunks
            if (data.content) {
              assistantMessage += data.content;
              updateStreamingMessage(assistantMessage);
            }

            // Handle completion
            if (data.done) {
              console.log('Stream completed normally');
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);
            }

            // Handle error messages
            if (data.error) {
              console.error('Server reported error:', data.error);
              setError(`Server error: ${data.error}`);
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);
            }
          } catch (parseError) {
            console.error('Error parsing event data:', parseError, event.data);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error encountered:', error);

          // If we've gone too long without a message, try to reconnect
          const timeSinceLastMessage = Date.now() - lastMessageTime;
          if (timeSinceLastMessage > 10000) { // 10 seconds
            if (!attemptReconnect()) {
              eventSource.close();
              setIsLoading(false);
              setIsStreaming(false);
              setError('Connection to server lost. Please try again.');
            }
          }
        };
      };

      setupEventListeners();

      // Keep track of connection activity with a watchdog timer
      const activityTimer = setInterval(() => {
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        console.log(`Time since last message: ${Math.round(timeSinceLastMessage/1000)}s`);

        if (timeSinceLastMessage > 30000) { // 30 seconds
          console.log('Connection timeout - closing EventSource');
          clearInterval(activityTimer);
          eventSource.close();
          setIsLoading(false);
          setIsStreaming(false);
          if (assistantMessage === '') {
            setError('Request timed out. Please try again.');
          } else {
            // We got some response, so just finalize it
            updateStreamingMessage(assistantMessage + "\n\n[Connection closed due to timeout]");
          }
        }
      }, 5000); // Check every 5 seconds

      // Clean up function to close the EventSource when component unmounts
      return () => {
        clearInterval(activityTimer);
        eventSource.close();
      };
    } catch (error) {
      console.error('Error starting stream:', error);
      setIsLoading(false);
      setIsStreaming(false);
      setError('Failed to connect to streaming service');
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