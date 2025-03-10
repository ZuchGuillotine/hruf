import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLLM } from '@/hooks/use-llm';
import { Loader2, SendHorizontal, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function LLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state
  const [streamingResponse, setStreamingResponse] = useState(''); // Added streamingResponse state
  const { chat } = useLLM(); // Removed unnecessary isLoading from useLLM
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreamingResponse(''); // Reset streaming content

    try {
      // Add a placeholder assistant message that will be updated during streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      // Call the fetchResponse function with just the user message
      await fetchResponse(userMessage.content);

    } catch (error: any) {
      console.error('Chat Error:', error);
      let errorMessage = 'Failed to get response from AI';
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });

      // Remove the empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const fetchResponse = async (message: string) => {
    setIsLoading(true);

    try {
      // Create a correctly formatted message array to match backend expectations
      const messageArray = messages.concat({ role: 'user', content: message });

      // Set up EventSource for streaming response with correct URL
      const eventSource = new EventSource(`/api/chat?message=${encodeURIComponent(message)}`);

      // Initialize stream state
      setStreamingResponse('');

      // Set timeout to close connection if it hangs
      const timeoutId = setTimeout(() => {
        console.log('Response timeout reached, closing connection');
        eventSource.close();
        setIsLoading(false);

        // Add error message if no response was received
        if (streamingResponse === '') {
          setMessages((prev) => [
            ...prev.slice(0, prev.length - 1), // Remove the placeholder message
            { role: 'assistant', content: "I'm sorry, there was a timeout while generating a response. Please try again." }
          ]);
        }
      }, 30000); // 30 second timeout

      eventSource.onmessage = (event) => {
        console.log('Received SSE chunk:', event.data);

        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data);

          if (data.error) {
            // Handle error from server
            console.error('Server returned error:', data.error);
            eventSource.close();
            clearTimeout(timeoutId);
            setIsLoading(false);

            // Update the placeholder message with error
            setMessages((prev) => [
              ...prev.slice(0, prev.length - 1), // Remove the placeholder message
              { role: 'assistant', content: "I'm sorry, there was an error generating a response. Please try again." }
            ]);

            // Clear streaming state
            setStreamingResponse('');
          } else if (data.streaming === false) {
            // End of streaming
            eventSource.close();
            clearTimeout(timeoutId);
            setIsLoading(false);

            // Finalize the complete message
            const finalContent = streamingResponse || "I don't have a response for that.";
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: finalContent
              };
              return newMessages;
            });

            // Clear streaming state
            setStreamingResponse('');
          } else if (data.response !== undefined) {
            // Update streaming response with new chunk
            const newChunk = data.response || '';
            setStreamingResponse((prev) => prev + newChunk);

            // Update the placeholder message with accumulated content
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: newMessages[newMessages.length - 1].content + newChunk
              };
              return newMessages;
            });
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        clearTimeout(timeoutId);
        setIsLoading(false);

        // Update with error message if no content was received
        if (streamingResponse === '') {
          setMessages((prev) => [
            ...prev.slice(0, prev.length - 1), // Remove the placeholder message
            { role: 'assistant', content: "I'm sorry, there was an error connecting to the AI service. Please try again later." }
          ]);
        }
      };

    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);

      // Handle general errors
      setMessages((prev) => [
        ...prev.slice(0, prev.length - 1), // Remove the placeholder message
        { role: 'assistant', content: "I'm sorry, an unexpected error occurred. Please try again." }
      ]);
    }
  };

  const handleSaveChat = async () => {
    if (messages.length === 0) return;

    try {
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(messages),
          type: 'chat',
          tags: ['saved_chat'],
        }),
      });

      if (!response.ok) throw new Error('Failed to save chat');

      toast({
        title: "Success",
        description: "Chat saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save chat",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`${
                message.role === 'assistant'
                  ? 'bg-white/10 text-white'
                  : 'bg-white text-[#1b4332]'
              }`}
            >
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {isLoading && index === messages.length - 1 && message.role === 'assistant' && '▋'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your mood, energy, or other supplement responses ..."
            className="bg-white/10 text-white placeholder:text-white/60"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-white text-[#1b4332] hover:bg-white/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </form>

        {messages.length > 0 && (
          <Button
            onClick={handleSaveChat}
            className="bg-white text-[#1b4332] hover:bg-white/90"
          >
            Save Chat
          </Button>
        )}
      </div>
    </div>
  );
}