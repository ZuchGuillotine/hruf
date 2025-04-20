import { useUser } from "./use-user";
import { useQuery } from "@tanstack/react-query";
import { SelectHealthStats } from "@db/neon-schema";

type ProfileStep = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};

export function useProfileCompletion() {
  const { user, isLoading } = useUser();

  const { data: healthStats } = useQuery<SelectHealthStats>({
    queryKey: ["/api/health-stats"],
    enabled: !!user,
  });

  const steps: ProfileStep[] = [
    {
      id: "basic-info",
      label: "Basic Information",
      description: "Add your name and contact details",
      completed: !!(user?.name && user?.email),
    },
    {
      id: "health-metrics",
      label: "Health Metrics",
      description: "Add your weight and sleep patterns",
      completed: !!(healthStats?.weight && healthStats?.averageSleep),
    },
    {
      id: "allergies",
      label: "Allergies",
      description: "List any allergies you have",
      completed: !!(healthStats?.allergies && healthStats.allergies.length > 0),
    },
    {
      id: "supplement-logs",
      label: "Log your supplements",
      description: "Log at least one supplement",
      completed: useQuery<number>({
        queryKey: ["/api/supplement-logs/count"],
        enabled: !!user,
      }).data > 0,
    },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    steps,
    completedSteps,
    totalSteps,
    completionPercentage,
    isLoading,
  };
}