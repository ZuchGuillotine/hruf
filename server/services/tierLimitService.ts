
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

export type SubscriptionTier = 'free' | 'core' | 'pro';

interface TierLimits {
  aiInteractions: number;
  labUploads: number;
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    aiInteractions: 0,
    labUploads: 0
  },
  core: {
    aiInteractions: 100,
    labUploads: 3
  },
  pro: {
    aiInteractions: Infinity,
    labUploads: Infinity
  }
};

export const tierLimitService = {
  async canUseAI(userId: number): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return false;

    const tierLimits = TIER_LIMITS[user.subscriptionTier as SubscriptionTier];
    
    // Pro tier has unlimited access
    if (user.subscriptionTier === 'pro') return true;
    
    // Free tier has no access
    if (user.subscriptionTier === 'free') return false;

    // Check if we need to reset the monthly counter
    const now = new Date();
    const resetDate = user.aiInteractionsReset ? new Date(user.aiInteractionsReset) : null;
    if (!resetDate || now > resetDate) {
      await db.update(users)
        .set({ 
          aiInteractionsCount: 0,
          aiInteractionsReset: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        })
        .where(eq(users.id, userId));
      return true;
    }

    return (user.aiInteractionsCount || 0) < tierLimits.aiInteractions;
  },

  async incrementAICount(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        aiInteractionsCount: sql`${users.aiInteractionsCount} + 1`
      })
      .where(eq(users.id, userId));
  },

  async canUploadLab(userId: number): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return false;

    const tierLimits = TIER_LIMITS[user.subscriptionTier as SubscriptionTier];
    
    // Pro tier has unlimited access
    if (user.subscriptionTier === 'pro') return true;
    
    // Free tier has no access
    if (user.subscriptionTier === 'free') return false;

    // Check if we need to reset the yearly counter
    const now = new Date();
    const resetDate = user.labUploadsReset ? new Date(user.labUploadsReset) : null;
    if (!resetDate || now > resetDate) {
      await db.update(users)
        .set({ 
          labUploadsCount: 0,
          labUploadsReset: new Date(now.getFullYear() + 1, 0, 1)
        })
        .where(eq(users.id, userId));
      return true;
    }

    return (user.labUploadsCount || 0) < tierLimits.labUploads;
  },

  async incrementLabCount(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        labUploadsCount: sql`${users.labUploadsCount} + 1`
      })
      .where(eq(users.id, userId));
  }
};
