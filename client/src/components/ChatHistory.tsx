import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface ChatMessage {
  id: number;
  content: string;
  loggedAt: string;
  type: string;
  tags: string[];
}

interface ParsedContent {
  userMessage: {
    content: string;
  };
  aiResponse: {
    content: string;
  };
}

export function ChatHistory({ selectedDate }: { selectedDate: Date }) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const { data: chatHistory, isLoading, error } = useQuery({
    queryKey: ['chatHistory', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/chat/history/${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json() as Promise<ChatMessage[]>;
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-none">
        <CardContent className="p-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/70" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 border-none">
        <CardContent className="p-4">
          <div className="text-white/70">Unable to load chat history</div>
        </CardContent>
      </Card>
    );
  }

  if (!chatHistory?.length) {
    return (
      <Card className="bg-white/5 border-none">
        <CardContent className="p-4">
          <div className="text-white/70">No chat history for this date.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md">
      <div className="space-y-4">
        {chatHistory.map((message) => {
          let parsedContent: ParsedContent | null = null;
          try {
            parsedContent = JSON.parse(message.content);
          } catch (e) {
            console.error('Error parsing message content:', e);
            return null;
          }

          if (!parsedContent?.userMessage?.content || !parsedContent?.aiResponse?.content) {
            return null;
          }

          const isExpanded = expandedMessages.has(message.id);
          const previewLength = 150;

          return (
            <Card key={message.id} className="bg-white/5 border-none">
              <CardContent className="pt-4">
                <div className="text-sm text-white/70 mb-2">
                  {format(new Date(message.loggedAt), 'h:mm a')}
                </div>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => {
                    setExpandedMessages((prev) => {
                      const next = new Set(prev);
                      if (next.has(message.id)) {
                        next.delete(message.id);
                      } else {
                        next.add(message.id);
                      }
                      return next;
                    });
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full text-left p-0 h-auto hover:bg-white/5">
                      <div className="text-sm text-white">
                        {isExpanded ? parsedContent.userMessage.content : 
                          `${parsedContent.userMessage.content.slice(0, previewLength)}${
                            parsedContent.userMessage.content.length > previewLength ? '...' : ''
                          }`}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator className="my-2 bg-white/10" />
                    <div className="text-sm mt-2 text-white">
                      <strong>AI Response:</strong>
                      <p className="whitespace-pre-wrap mt-1">{parsedContent.aiResponse.content}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}