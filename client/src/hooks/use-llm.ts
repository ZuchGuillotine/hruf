import { useMutation } from "@tanstack/react-query";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function useLLM() {
  const chatMutation = useMutation<
    { response: string },
    Error,
    { messages: Message[] }
  >({
    mutationFn: async ({ messages }) => {
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

      return response.json();
    },
    onError: (error) => {
      console.error("Chat error details:", error);
    }
  });

  return {
    chat: chatMutation.mutateAsync,
    isLoading: chatMutation.isLoading,
  };
}
