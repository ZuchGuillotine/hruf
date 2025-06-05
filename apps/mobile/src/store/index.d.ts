export declare const store: import('@reduxjs/toolkit').EnhancedStore<
  {
    auth: import('./slices/authSlice').AuthState;
  },
  import('redux').UnknownAction,
  import('@reduxjs/toolkit').Tuple<
    [
      import('redux').StoreEnhancer<{
        dispatch: import('redux-thunk').ThunkDispatch<
          {
            auth: import('./slices/authSlice').AuthState;
          },
          undefined,
          import('redux').UnknownAction
        >;
      }>,
      import('redux').StoreEnhancer,
    ]
  >
>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
//# sourceMappingURL=index.d.ts.map
