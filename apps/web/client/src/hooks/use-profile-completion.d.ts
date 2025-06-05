type ProfileStep = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};
export declare function useProfileCompletion(): {
  steps: ProfileStep[];
  completedSteps: number;
  totalSteps: number;
  completionPercentage: number;
  isLoading: boolean;
};
export {};
//# sourceMappingURL=use-profile-completion.d.ts.map
