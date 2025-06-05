export type SubscriptionTier = 'free' | 'core' | 'pro';
export declare const tierLimitService: {
  canUseAI(userId: number): Promise<boolean>;
  incrementAICount(userId: number): Promise<void>;
  canUploadLab(userId: number): Promise<boolean>;
  incrementLabCount(userId: number): Promise<void>;
};
//# sourceMappingURL=tierLimitService.d.ts.map
