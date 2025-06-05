import type { SelectUser } from '@core/db';
type RequestResult =
  | {
      ok: true;
      user?: SelectUser;
      message?: string;
      requiresVerification?: boolean;
      redirectUrl?: string;
    }
  | {
      ok: false;
      message: string;
    };
export declare function useUser(): {
  user: any;
  isLoading: boolean;
  error: Error | null;
  login: import('@tanstack/react-query').UseMutateAsyncFunction<
    RequestResult,
    Error,
    InsertUser,
    unknown
  >;
  googleLogin: import('@tanstack/react-query').UseMutateAsyncFunction<
    RequestResult,
    Error,
    string,
    unknown
  >;
  logout: import('@tanstack/react-query').UseMutateAsyncFunction<
    RequestResult,
    Error,
    void,
    unknown
  >;
  register: import('@tanstack/react-query').UseMutateAsyncFunction<
    RequestResult,
    Error,
    InsertUser,
    unknown
  >;
};
export {};
//# sourceMappingURL=use-user.d.ts.map
