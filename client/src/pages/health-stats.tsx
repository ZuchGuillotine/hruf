
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Heart, Moon } from "lucide-react";
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
    body: JSON.stringify(data),
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
          <div className="max-w-xl mx-auto bg-[#1b4332] rounded-lg p-6">
            <h1 className="text-3xl font-bold text-center text-white">Your Health Overview</h1>
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="grid gap-6">
            <Card className="bg-[#1b4332] text-white">
              <CardHeader>
                <CardTitle>Basic Health Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/70">Weight</Label>
                        <Input
                          type="number"
                          step="0.1"
                          {...form.register('weight', { valueAsNumber: true })}
                          className="bg-white text-black"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70">Height (inches)</Label>
                        <Input
                          type="number"
                          {...form.register('height', { valueAsNumber: true })}
                          className="bg-white text-black"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70">Gender</Label>
                        <select {...form.register('gender')} className="w-full p-2 rounded-md bg-white text-black">
                          <option value="">Select gender...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="prefer not to answer">Prefer not to answer</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-white/70">Date of Birth</Label>
                        <Input
                          type="date"
                          {...form.register('dateOfBirth')}
                          className="bg-white text-black"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70">Average Sleep Duration</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Hours"
                            {...form.register('sleepHours', { valueAsNumber: true })}
                            className="bg-white text-black"
                          />
                          <Input
                            type="number"
                            placeholder="Minutes"
                            {...form.register('sleepMinutes', { valueAsNumber: true })}
                            className="bg-white text-black"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white/70">Allergies</Label>
                        <Textarea
                          {...form.register('allergies')}
                          className="bg-white text-black h-[38px] min-h-[38px]"
                          placeholder="List any allergies"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-white text-[#1b4332]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-white text-[#1b4332] hover:bg-white/90"
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-white/70">Weight</Label>
                        <p className="text-white">{healthStats?.weight ? `${healthStats.weight} lbs` : 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-white/70">Height</Label>
                        <p className="text-white">{healthStats?.height ? `${healthStats.height} inches` : 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-white/70">Gender</Label>
                        <p className="text-white">{healthStats?.gender || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-white/70">Date of Birth</Label>
                        <p className="text-white">{healthStats?.dateOfBirth || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-white/70">Average Sleep</Label>
                        <p className="text-white">
                          {healthStats?.averageSleep
                            ? `${Math.floor(healthStats.averageSleep / 60)}h ${healthStats.averageSleep % 60}m`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-white/70">Allergies</Label>
                        <p className="text-white whitespace-pre-wrap">{healthStats?.allergies || 'None listed'}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-white text-[#1b4332] hover:bg-white/90"
                      >
                        Edit Information
                      </Button>
                    </div>
                  </div>
                )}
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
        </div>
        <Link href="/" className="flex items-center gap-2 text-black mt-6 ml-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
