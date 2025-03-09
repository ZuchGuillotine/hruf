import { useMutation } from "@tanstack/react-query";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function useLLM() {
  const chatMutation = useMutation<
    { response: string },
    Error,
    { messages: Message[]; onStream?: (chunk: string) => void }
  >({
    mutationFn: async ({ messages, onStream }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(JSON.stringify(errorData));
      }

      // Handle streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (!reader) throw new Error("No response body");

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullResponse += chunk;
            onStream?.(chunk);
          }
        } finally {
          reader.releaseLock();
        }

        return { response: fullResponse };
      }

      // Handle non-streaming response
      return response.json();
    },
    onError: (error) => {
      console.error("Chat error details:", error);
    }
  });

  return {
    chat: chatMutation.mutateAsync,
    isLoading: chatMutation.isPending,
  };
}