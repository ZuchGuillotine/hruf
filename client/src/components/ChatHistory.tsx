import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatMessage {
  id: number;
  content: string;
  loggedAt: string;
  type: string;
  tags: string[];
}

export const ChatHistory = ({ selectedDate }: { selectedDate: Date }) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['chatHistory', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/chat/history/${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json() as Promise<ChatMessage[]>;
    },
  });

  const toggleMessage = (id: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return <div>Loading chat history...</div>;
  }

  if (!chatHistory?.length) {
    return <div>No chat history for this date.</div>;
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Chat History</h3>
        {chatHistory.map((message) => {
          const parsedContent = JSON.parse(message.content);
          const isExpanded = expandedMessages.has(message.id);
          const previewLength = 150;

          return (
            <Card key={message.id} className="w-full">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-2">
                  {format(new Date(message.loggedAt), 'h:mm a')}
                </div>
                <Collapsible open={isExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full text-left p-0 h-auto">
                      <div className="text-sm">
                        {isExpanded ? parsedContent.userMessage.content : 
                          `${parsedContent.userMessage.content.slice(0, previewLength)}${
                            parsedContent.userMessage.content.length > previewLength ? '...' : ''
                          }`}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator className="my-2" />
                    <div className="text-sm mt-2">
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
};
