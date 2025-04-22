import { useUser } from "./use-user";
import { useQuery } from "@tanstack/react-query";

export function useProfileCompletion() {
  const { user, isLoading: userLoading } = useUser();

  const { data: healthStats, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/health-stats"],
    enabled: !!user,
  });

  const { data: supplementCount, isLoading: supplementLoading } = useQuery<number>({
    queryKey: ["/api/supplements/count"],
    enabled: !!user,
  });

  const { data: labResults, isLoading: labsLoading } = useQuery<{count: number}>({
    queryKey: ["labs-count"],
    enabled: !!user,
  });

  // Return early if still loading or no user
  if (userLoading || !user) {
    return { completionPercentage: 0, isLoading: true };
  }

  // Check if other queries are still loading
  const isLoading = healthLoading || supplementLoading || labsLoading;

  // Define completion checks
  const completionChecks = [
    !!user.name && !!user.email,                    // Basic info
    !!healthStats?.weight && !!healthStats?.averageSleep,  // Health metrics
    !!healthStats?.allergies && healthStats.allergies.length > 0,  // Allergies
    (supplementCount || 0) > 0,                     // Supplements logged
    (labResults?.count || 0) > 0                    // Lab results uploaded
  ];

  const completedChecks = completionChecks.filter(Boolean).length;
  const completionPercentage = Math.round((completedChecks / completionChecks.length) * 100);

  return {
    completionPercentage,
    isLoading
  };
}