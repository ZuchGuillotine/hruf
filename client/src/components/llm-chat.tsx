import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLLM } from '@/hooks/use-llm';
import { Loader2, SendHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function LLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
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
      const { response } = await chat({
        messages: [...messages, userMessage],
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleSaveChat = async () => {
    if (messages.length === 0) {
      toast({
        variant: 'default',
        title: 'Nothing to save',
        description: 'Have a conversation first before saving.',
      });
      return;
    }

    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save chat history');
      }

      toast({
        title: 'Success',
        description: 'Chat history saved successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save chat history',
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

      <div className="mt-4 space-y-4">
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

        <div className="flex justify-center"> {/* This line was added */}
          <Button
            onClick={handleSaveChat}
            disabled={messages.length === 0 || isLoading}
            className="w-2/3 bg-white text-[#1b4332] hover:bg-white/90"
          >
            Save Chat History
          </Button>
        </div> {/* This line was added */}
      </div>
    </div>
  );
}