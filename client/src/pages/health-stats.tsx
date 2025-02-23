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
      allergies: healthStats?.allergies ? (healthStats.allergies as string[]).join('\n') : '',
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
    <div className="container mx-auto py-6">
      <div className="max-w-xl mx-auto bg-[#1b4332] rounded-lg p-6 mb-6"> {/* Added max-width and centered the container */}
        <h1 className="text-3xl font-bold text-center text-white">Health Statistics</h1> {/* Centered the title */}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <Card className="bg-[#1b4332] text-white">
            <CardHeader>
              <CardTitle>Basic Health Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...form.register('weight', { valueAsNumber: true })}
                    className="bg-white text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    {...form.register('height', { valueAsNumber: true })}
                    className="bg-white text-black"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" {...form.register('gender')} className="w-full p-2 rounded-md border border-gray-300 bg-white">
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer not to answer">Prefer not to answer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...form.register('dateOfBirth')}
                  className="bg-white text-black"
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  {...form.register('allergies')}
                  className="bg-white text-black"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-[#1b4332] hover:bg-white/90 mt-4"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
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
  );
}