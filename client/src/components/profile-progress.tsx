import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { useProfileCompletion } from "@/hooks/use-profile-completion";

export function ProfileProgress() {
  const { steps, completionPercentage, isLoading } = useProfileCompletion();

  if (isLoading) return null;

  return (
    <Card className="bg-[#1b4332] text-white">
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
          <Progress value={completionPercentage} className="h-2 bg-white/20" />
          <p className="text-sm mt-2 text-white/70">
            {completionPercentage}% Complete
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                step.completed
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-white/70 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{step.label}</h4>
                  {step.completed ? (
                    <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30">
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-white/10 text-white hover:bg-white/20"
                    >
                      Todo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/70 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
