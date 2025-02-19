import Header from "@/components/header";
import Footer from "@/components/footer";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SupplementHistory() {
  const today = new Date();
  const { user } = useUser();
  const [selectedChat, setSelectedChat] = useState<any[]>([]);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to today's date when component mounts
  useEffect(() => {
    const todayButton = scrollContainerRef.current?.querySelector(`button[data-date='${format(today, 'yyyy-MM-dd')}']`);
    if (todayButton) {
      todayButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['supplement-logs', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        console.log('Fetching logs for date:', dateStr);

        const response = await fetch(`/api/supplement-logs/${dateStr}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = await response.json();

        // Process dates to ensure proper timezone handling
        if (data.supplements) {
          data.supplements = data.supplements.map((log: any) => ({
            ...log,
            takenAt: new Date(log.takenAt).toISOString(),
          }));
        }

        if (data.qualitativeLogs) {
          data.qualitativeLogs = data.qualitativeLogs.map((log: any) => ({
            ...log,
            loggedAt: new Date(log.loggedAt).toISOString(),
          }));
        }

        console.log('Fetched logs:', data);
        return data;
      } catch (err) {
        console.error('Error fetching logs:', err);
        throw err;
      }
    },
    retry: 1,
  });

  if (error) {
    console.error('Query error:', error);
  }

  const { supplements, qualitativeLogs } = logsData || { supplements: [], qualitativeLogs: [] };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Supplement History</h2>

          {/* Date Picker */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Button 
                variant="ghost" 
                onClick={prevMonth}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button 
                variant="ghost" 
                onClick={nextMonth}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              >
                {daysInMonth.map((date) => (
                  <Button
                    key={date.toISOString()}
                    data-date={format(date, 'yyyy-MM-dd')}
                    variant={selectedDate.toDateString() === date.toDateString() ? "default" : "outline"}
                    className={`flex-shrink-0 w-14 h-14 rounded-full ${
                      selectedDate.toDateString() === date.toDateString()
                        ? "bg-white text-[#1b4332]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="text-center">
                      <div className="text-xs">{format(date, 'EEE')}</div>
                      <div className="text-lg font-bold">{format(date, 'd')}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Log Section */}
          <Card className="bg-white/10 border-none text-white">
            <CardHeader>
              <CardTitle>
                {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Supplement Intake</h3>
                    {supplements.length > 0 ? (
                      <div className="space-y-3">
                        {supplements.map((log: any) => (
                          <div key={`log-${log.id}`} className="p-3 rounded-md bg-white/10">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                              <div className="flex-grow">
                                <p className="font-medium">{log.name}</p>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm text-white/70">{log.dosage}</p>
                                  <p className="text-xs text-white/50">
                                    {new Date(log.takenAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">No supplements logged for this date.</p>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Daily Notes</h3>
                    {qualitativeLogs.length > 0 ? (
                      <div className="space-y-4">
                        {qualitativeLogs.map((log: any) => (
                          <div key={log.id} className="p-3 rounded-md bg-white/10">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-white/50">
                                {new Date(log.loggedAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              {log.type === 'chat' && (
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                  AI Chat
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                try {
                                  const messages = JSON.parse(log.content);
                                  setSelectedChat(messages);
                                  setShowChatDialog(true);
                                } catch (e) {
                                  console.error("Error parsing chat:", e);
                                }
                              }}
                              className="text-left w-full"
                            >
                              <p className="text-white/70 text-sm hover:text-white/90 transition-colors">
                                {(() => {
                                  try {
                                    const messages = JSON.parse(log.content);
                                    const firstMessage = messages[0];
                                    return `${firstMessage.role === 'user' ? user?.username || 'user' : 'assistant'}: ${firstMessage.content}`;
                                  } catch (e) {
                                    return log.summary;
                                  }
                                })()}
                              </p>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">
                        No notes or chat history for this date.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to Dashboard Button */}
          <div className="mt-6">
            <Link href="/">
              <Button className="bg-white text-[#1b4332] hover:bg-white/90 flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Tracking
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Dialog */}
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Conversation History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              {selectedChat.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "assistant"
                      ? "bg-green-50 ml-4"
                      : "bg-blue-50 mr-4"
                  }`}
                >
                  <p className="text-sm font-semibold mb-1 capitalize">
                    {message.role === 'user' ? user?.username || 'user' : message.role}
                  </p>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}