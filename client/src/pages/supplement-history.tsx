import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

export default function SupplementHistory() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const { data: supplementLogs, isLoading } = useQuery({
    queryKey: ['supplement-logs', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/supplement-logs/${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch supplement logs');
      return response.json();
    },
  });

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
              ) : supplementLogs ? (
                <div className="space-y-4">
                  {/* Quantitative Data Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold mb-2">Supplement Intake</h3>
                    {supplementLogs.supplements?.map((log: any) => (
                      <div key={log.supplementId} className="p-3 rounded-md bg-white/5">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                          <div className="flex-grow">
                            <p className="font-medium">{log.supplement?.name || 'Unknown Supplement'}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-white/70">{log.supplement?.dosage || 'No dosage specified'}</p>
                              <p className="text-xs text-white/50">
                                {new Date(log.takenAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes Section (Placeholder for future text data) */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Daily Notes</h3>
                    <Card className="bg-white/5 border-none">
                      <CardContent className="p-4">
                        <p className="text-white/70">
                          Notes feature coming soon. Track your supplement effects and experiences.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <p className="text-white/70">
                  No logs found for this date
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}