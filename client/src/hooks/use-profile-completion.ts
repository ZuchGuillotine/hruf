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
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    onError: (error) => {
      console.error('Error fetching health stats:', error);
    }
  });

  // Log health stats data for debugging
  useEffect(() => {
    if (healthStats) {
      console.log('Health stats loaded:', healthStats);
    }
  }, [healthStats]);

  const { data: supplementCount = 0 } = useQuery<number>({
    queryKey: ["/api/supplements/count"],
    enabled: !!user,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000
  });

  const { data: labResults = { count: 0 } } = useQuery<{count: number}>({
    queryKey: ["labs-count"],
    queryFn: async () => {
      const response = await fetch('/api/labs');
      const data = await response.json();
      return { count: data.length };
    },
    enabled: !!user,
    staleTime: 300000,
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
      label: "Log Your First Supplements",
      description: "Log at least one supplement",
      completed: supplementCount > 0,
    },
    {
      id: "lab-results", 
      label: "Upload Lab Results",
      description: "Upload your first blood test or lab results",
      completed: labResults.count > 0,
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