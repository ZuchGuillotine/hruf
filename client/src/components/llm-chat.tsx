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

// LLMChat Component - Handles qualitative feedback collection about user's supplement experiences
// This interface specifically focuses on gathering detailed user observations and reflections
export default function LLMChat() {
  // Track conversation history between user and AI for qualitative feedback
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // Custom hook for managing qualitative feedback chat interactions
  const { chat, isLoading } = useLLM();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      console.log('Sending message to API:', userMessage);
      const result = await chat({
        messages: [...messages, userMessage],
      });
      console.log('Received API response:', result);

      if (!result || !result.response) {
        throw new Error('Invalid response format from server');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            placeholder="Ask about supplements, interactions, or health advice..."
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