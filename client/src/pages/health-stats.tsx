import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Link } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { SelectHealthStats } from "@db/neon-schema";

type HealthStatsFormData = {
  weight?: number;
  height?: number;
  gender?: string;
  dateOfBirth?: string;
  averageSleep?: number;
  profilePhotoUrl?: string;
  allergies?: string;
  sleepHours?: number;
  sleepMinutes?: number;
};

async function updateHealthStats(data: HealthStatsFormData) {
  const response = await fetch('/api/health-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      allergies: data.allergies ? data.allergies.split('\n').filter(Boolean) : [],
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export default function HealthStatsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: healthStats, isLoading: statsLoading } = useQuery<SelectHealthStats>({
    queryKey: ['/api/health-stats'],
    enabled: !!user,
  });

  const form = useForm<HealthStatsFormData>({
    defaultValues: {
      weight: healthStats?.weight,
      height: healthStats?.height,
      gender: healthStats?.gender,
      dateOfBirth: healthStats?.dateOfBirth,
      sleepHours: healthStats?.averageSleep ? Math.floor(healthStats.averageSleep / 60) : undefined,
      sleepMinutes: healthStats?.averageSleep ? healthStats.averageSleep % 60 : undefined,
      profilePhotoUrl: healthStats?.profilePhotoUrl,
      allergies: healthStats?.allergies || '',
    },
  });

  const mutation = useMutation({
    mutationFn: updateHealthStats,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-stats'] });
      toast({
        title: "Success",
        description: "Health stats updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: HealthStatsFormData) => {
    mutation.mutate({
      ...data,
      averageSleep: (data.sleepHours || 0) * 60 + (data.sleepMinutes || 0)
    });
  };


  if (userLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8f3e8]">
      <Header />
      <div className="container mx-auto py-6 max-w-3xl"> {/* Added max-width for container */}
        <Link href="/" className="flex items-center gap-2 text-white mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="max-w-xl mx-auto bg-[#1b4332] rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-white">Health Statistics</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <Card className="bg-[#1b4332] text-white">
              <CardHeader>
                <CardTitle>Basic Health Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Responsive grid */}
                <div>
                  <Label htmlFor="weight" className="text-white block mb-2">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...form.register('weight', { valueAsNumber: true })}
                    className="bg-white w-full text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-white block mb-2">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    {...form.register('height', { valueAsNumber: true })}
                    className="bg-white w-full text-black"
                  />
                </div>
                <div>
                  <Label className="text-white block mb-2">Average Sleep Duration</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Hours"
                      min="0"
                      max="24"
                      {...form.register("sleepHours", { valueAsNumber: true })}
                      className="bg-white w-full text-black"
                    />
                    <Input
                      type="number"
                      placeholder="Minutes"
                      min="0"
                      max="59"
                      {...form.register("sleepMinutes", { valueAsNumber: true })}
                      className="bg-white w-full text-black"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gender" className="text-white block mb-2">Gender</Label>
                  <select id="gender" {...form.register('gender')} className="w-full p-2 rounded-md border border-gray-300 bg-white text-black">
                    <option value="">Select gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer not to answer">Prefer not to answer</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-white block mb-2">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register('dateOfBirth')}
                    className="bg-white w-full text-gray-900"
                    placeholder="mm/dd/yyyy"
                  />
                </div>
                <div>
                  <Label htmlFor="allergies" className="text-white block mb-2">Allergies</Label>
                  <Textarea
                    id="allergies"
                    {...form.register('allergies')}
                    className="bg-white w-full h-[38px] min-h-[38px] resize-none text-black"
                    placeholder="List any allergies (one per line)"
                  />
                </div>
              </CardContent>
              <div className="flex justify-center pb-6">
                <Button
                  type="submit"
                  className="bg-white text-[#1b4332] hover:bg-white/90 px-6"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>

            <Card className="bg-[#1b4332] text-white">
              <CardHeader>
                <CardTitle>Sleep Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Sleep tracking coming soon</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1b4332] text-white">
              <CardHeader>
                <CardTitle>Heart Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Heart rate monitoring coming soon</p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}