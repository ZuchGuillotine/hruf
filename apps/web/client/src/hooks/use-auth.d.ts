import { ReactNode } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
type User = {
  id: number;
  username: string;
  email: string;
  subscriptionTier?: string;
  isAdmin?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};
type LoginData = {
  username: string;
  password: string;
};
type RegisterData = {
  username: string;
  email: string;
  password: string;
};
export declare const AuthContext: import('react').Context<AuthContextType | null>;
export declare function AuthProvider({
  children,
}: {
  children: ReactNode;
}): import('react/jsx-runtime').JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=use-auth.d.ts.map
