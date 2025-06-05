import { type Express } from 'express';
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
export declare function setupAuth(app: Express): void;
//# sourceMappingURL=auth.d.ts.map
