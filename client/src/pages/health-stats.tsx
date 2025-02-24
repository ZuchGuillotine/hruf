import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUser } from '@/hooks/use-user';
import { SelectHealthStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Heart, Moon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <a href="/dashboard" className="flex items-center text-sm mb-8 text-white hover:text-white/80">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </a>
        <div className="space-y-8">
          <Card className="bg-[#1b4332] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input id="weight" type="number" {...form.register('weight')} />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (inches)</Label>
                      <Input id="height" type="number" {...form.register('height')} />
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
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea id="allergies" className="h-24" {...form.register('allergies')} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-white text-[#1b4332] hover:bg-white/90">
                    Save Changes
                  </Button>
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
                  <Button onClick={() => setIsEditing(true)} className="w-full bg-white text-[#1b4332] hover:bg-white/90">
                    Edit Information
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/10 border-none text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sleep Analysis</CardTitle>
                <Moon className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Sleep Stats</div>
                <p className="text-xs text-white/70">Monitor your sleep patterns</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Cardiac Stats</div>
                <p className="text-xs text-white/70">Track your heart health</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}