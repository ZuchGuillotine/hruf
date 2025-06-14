export interface User {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  phoneNumber?: string | null;
  subscriptionTier?: string;
  isAdmin?: boolean | null;
  trialEndsAt?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  emailVerified?: boolean;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend Express types
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      name?: string | null;
      phoneNumber?: string | null;
      subscriptionTier?: string;
      isAdmin?: boolean | null;
      trialEndsAt?: Date | null;
    }
  }
} 