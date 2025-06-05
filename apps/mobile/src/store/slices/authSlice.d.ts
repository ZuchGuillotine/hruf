interface User {
  id: string;
  email: string;
  name?: string;
}
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
export declare const setCredentials: import('@reduxjs/toolkit').ActionCreatorWithPayload<
    {
      user: User;
      token: string;
    },
    'auth/setCredentials'
  >,
  setLoading: import('@reduxjs/toolkit').ActionCreatorWithPayload<boolean, 'auth/setLoading'>,
  setError: import('@reduxjs/toolkit').ActionCreatorWithPayload<string, 'auth/setError'>,
  logout: import('@reduxjs/toolkit').ActionCreatorWithoutPayload<'auth/logout'>;
export type { AuthState };
declare const _default: import('redux').Reducer<AuthState>;
export default _default;
//# sourceMappingURL=authSlice.d.ts.map
