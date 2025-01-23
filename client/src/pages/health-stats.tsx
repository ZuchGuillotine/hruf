import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type HealthStatsFormData = {
  weight?: number;
  averageSleep?: number;
  profilePhotoUrl?: string;
  allergies?: string;
};

export default function HealthStatsPage() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<HealthStatsFormData>({
    defaultValues: {
      // To be implemented: Fetch existing health stats
    },
  });

  const onSubmit = async (data: HealthStatsFormData) => {
    try {
      // To be implemented: API call to update health stats
      toast({
        title: "Success",
        description: "Health stats updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
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
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            onClick={() => window.location.href = '/profile'}
            variant="ghost"
            className="mb-4 text-[#1b4332]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          <Card className="bg-[#1b4332] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Health Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (in lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    {...form.register("weight", { valueAsNumber: true })}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageSleep">Average Sleep (hours)</Label>
                  <Input
                    id="averageSleep"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    {...form.register("averageSleep", { valueAsNumber: true })}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhotoUrl">Profile Photo URL</Label>
                  <Input
                    id="profilePhotoUrl"
                    type="url"
                    {...form.register("profilePhotoUrl")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (one per line)</Label>
                  <Textarea
                    id="allergies"
                    {...form.register("allergies")}
                    className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
                    placeholder="Enter your allergies here..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-[#1b4332] hover:bg-white/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}