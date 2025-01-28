import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Header from "@/components/header";
import { ProfileProgress } from "@/components/profile-progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ProfileFormData = {
  email: string;
  phoneNumber: string;
  name: string;
  username: string;
  dateOfBirth: string;
  isPro: boolean;
};

async function updateProfile(data: ProfileFormData) {
  const response = await fetch('/api/profile', {
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

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      name: user?.name || "",
      username: user?.username || "",
      dateOfBirth: "", 
      isPro: user?.isPro || false,
    },
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
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

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <ProfileProgress />
          <Card className="bg-[#1b4332] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...form.register("phoneNumber")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...form.register("username")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    max={format(new Date(), 'yyyy-MM-dd')}
                    {...form.register("dateOfBirth")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="pro"
                    checked={form.watch("isPro")}
                    onCheckedChange={(checked) => form.setValue("isPro", checked)}
                  />
                  <Label htmlFor="pro">Pro Account</Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-[#1b4332] hover:bg-white/90"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-[#1b4332] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Health Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = '/health-stats'}
                className="w-full bg-white text-[#1b4332] hover:bg-white/90"
              >
                View Health Stats
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}