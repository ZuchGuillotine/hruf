
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
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
  const [isEditing, setIsEditing] = useState(false);

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
      setIsEditing(false);
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
      <div className="container mx-auto max-w-3xl">
        <div className="px-4">
          <div className="max-w-xl mx-auto bg-[#1b4332] rounded-2xl p-3">
            <h1 className="text-3xl font-bold text-center text-white">Your Health Overview</h1>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Basic Information</CardTitle>
                <Button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" type="number" step="0.1" {...form.register('weight')} />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" type="number" {...form.register('height')} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" {...form.register('gender')} />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" {...form.register('dateOfBirth')} />
                  </div>
                  <div>
                    <Label>Average Sleep Duration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input type="number" placeholder="Hours" {...form.register('sleepHours')} />
                      </div>
                      <div>
                        <Input type="number" placeholder="Minutes" {...form.register('sleepMinutes')} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="allergies">Allergies (one per line)</Label>
                    <Textarea id="allergies" {...form.register('allergies')} />
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Weight</Label>
                      <p>{healthStats?.weight} kg</p>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <p>{healthStats?.height} cm</p>
                    </div>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <p>{healthStats?.gender}</p>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <p>{healthStats?.dateOfBirth}</p>
                  </div>
                  <div>
                    <Label>Average Sleep</Label>
                    <p>
                      {healthStats?.averageSleep
                        ? `${Math.floor(healthStats.averageSleep / 60)}h ${healthStats.averageSleep % 60}m`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>Allergies</Label>
                    <div>
                      {healthStats?.allergies
                        ? healthStats.allergies.split('\n').map((allergy, index) => (
                            <p key={index}>{allergy.trim()}</p>
                          ))
                        : 'None listed'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
