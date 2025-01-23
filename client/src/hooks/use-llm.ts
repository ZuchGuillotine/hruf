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
        throw new Error(await response.text());
      }

      return response.json();
    },
  });

  return {
    chat: chatMutation.mutateAsync,
    isLoading: chatMutation.isLoading,
  };
}
