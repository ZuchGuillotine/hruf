import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function SupplementHistory() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: supplementLogs, isLoading } = useQuery({
    queryKey: ['supplement-logs', date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!date) return null;
      const response = await fetch(`/api/supplement-logs/${format(date, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch supplement logs');
      return response.json();
    },
    enabled: !!date,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Supplement History</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <Card className="bg-white border-none">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow"
                />
              </CardContent>
            </Card>

            {/* Daily Log Section */}
            <Card className="bg-white/10 border-none text-white">
              <CardHeader>
                <CardTitle>
                  {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
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
                        <div key={log.supplementId} className="flex items-center justify-between p-2 rounded-md bg-white/5">
                          <div>
                            <p className="font-medium">{log.name}</p>
                            <p className="text-sm text-white/70">{log.dosage} • {log.frequency}</p>
                          </div>
                          <Switch
                            checked={log.taken}
                            disabled
                          />
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
                    {date ? 'No logs found for this date' : 'Select a date to view your supplement history'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}