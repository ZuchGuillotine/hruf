import { useEffect } from 'react';
import { useUser } from './use-user';
import { useQuery } from '@tanstack/react-query';
import { SelectHealthStats } from '@db/neon-schema';

type ProfileStep = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};

export function useProfileCompletion() {
  const { user, isLoading: userLoading } = useUser();

  const { data: healthStats, isLoading: healthStatsLoading } = useQuery({
    queryKey: ['health-stats', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/health-stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch health stats');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: supplementCount } = useQuery({
    queryKey: ['supplements-count', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/supplements/count', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch supplement count');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: labResults } = useQuery({
    queryKey: ['labs-count', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/labs', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch lab results');
      const data = await response.json();
      return { count: data.length };
    },
    enabled: !!user?.id,
  });

  const steps: ProfileStep[] = [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Add your name and contact details',
      completed: !!(user?.name && user?.email),
    },
    {
      id: 'health-metrics',
      label: 'Health Metrics',
      description: 'Add your weight and sleep patterns',
      completed: !!(
        healthStats?.weight ||
        healthStats?.height ||
        healthStats?.gender ||
        healthStats?.dateOfBirth
      ),
    },
    {
      id: 'allergies',
      label: 'Allergies',
      description: 'List any allergies you have',
      completed: !!(healthStats?.allergies && healthStats.allergies.trim().length > 0),
    },
    {
      id: 'supplement-logs',
      label: 'Log Your First Supplements',
      description: 'Log at least one supplement',
      completed: !!(supplementCount && supplementCount > 0),
    },
    {
      id: 'lab-results',
      label: 'Upload Lab Results',
      description: 'Upload your first blood test or lab results',
      completed: !!(labResults?.count && labResults.count > 0),
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    steps,
    completedSteps,
    totalSteps,
    completionPercentage,
    isLoading: userLoading || healthStatsLoading,
  };
}
