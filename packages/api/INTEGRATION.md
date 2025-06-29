# Integration Guide: @hruf/api Package

This document explains how to integrate the shared API package with both the web and mobile applications in the HRUF monorepo.

## Overview

The `@hruf/api` package replaces the direct fetch calls and individual hook implementations in both web and mobile applications with a unified, type-safe API client that handles:

- Platform-specific authentication (sessions for web, tokens for mobile)
- TanStack Query integration with proper cache management
- Streaming support for chat features
- File uploads and Server-Sent Events
- Comprehensive error handling

## Web Application Integration

### 1. Remove Existing API Code

Replace the existing query client and direct API calls:

**Before (client/src/lib/queryClient.ts):**
```typescript
// This file can be deleted or simplified
export const queryClient = new QueryClient({...});
export function getQueryFn({...}) {...}
export async function apiRequest(...) {...}
```

**After:**
```typescript
// Import from the shared package
import { createQueryClient, createWebApi } from '@hruf/api';

export const queryClient = createQueryClient();
export const api = createWebApi({
  baseURL: process.env.VITE_API_URL || '',
  sessionConfig: {
    cookieName: 'stacktracker.sid'
  }
});
```

### 2. Update Main App Component

**Before (client/src/main.tsx):**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

**After:**
```typescript
import { HrufApiProvider } from '@hruf/api';
import { api, queryClient } from './lib/queryClient';

root.render(
  <HrufApiProvider api={api} queryClient={queryClient}>
    <App />
  </HrufApiProvider>
);
```

### 3. Replace Hook Implementations

**Before (client/src/hooks/use-user.ts):**
```typescript
// 127 lines of custom implementation
export function useUser() {
  const queryClient = useQueryClient();
  const { data: user, error, isLoading } = useQuery<ExtendedUser | null>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });
  // ... rest of implementation
}
```

**After:**
```typescript
import { ConvenienceHooks } from '@hruf/api';

// Much simpler - just re-export with any customizations
export const useUser = ConvenienceHooks.useCurrentUser;

// Or if you need custom behavior:
export function useUser() {
  return ConvenienceHooks.useCurrentUser({
    staleTime: Infinity,
    retry: false
  });
}
```

### 4. Update Components

**Before:**
```typescript
import { useUser } from '../hooks/use-user';
import { useSupplements } from '../hooks/use-supplements';

function Dashboard() {
  const { user, login, logout } = useUser();
  const { supplements, addSupplement } = useSupplements();
  // ...
}
```

**After:**
```typescript
import { ConvenienceHooks } from '@hruf/api';

function Dashboard() {
  const { data: user } = ConvenienceHooks.useCurrentUser();
  const { mutateAsync: login } = ConvenienceHooks.useLogin();
  const { mutateAsync: logout } = ConvenienceHooks.useLogout();
  const { data: supplements } = ConvenienceHooks.useSupplements(user?.id);
  const { mutateAsync: addSupplement } = ConvenienceHooks.useCreateSupplement();
  // ...
}
```

### 5. Update Streaming Chat

**Before (client/src/hooks/use-llm.ts):**
```typescript
// 97 lines of SSE handling code
export function useLLM() {
  const [limitReached, setLimitReached] = useState(false);
  const chatMutation = useMutation<...>({
    mutationFn: async ({ messages, onStream }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        credentials: "include",
      });
      // ... complex SSE parsing
    }
  });
}
```

**After:**
```typescript
import { ConvenienceHooks } from '@hruf/api';

// Much simpler
export const useLLM = ConvenienceHooks.useStreamingChat;

// Or with custom behavior:
export function useLLM() {
  return ConvenienceHooks.useStreamingChat();
}
```

## Mobile Application Integration

### 1. Install AsyncStorage

```bash
cd mobile
npm install @react-native-async-storage/async-storage
```

### 2. Setup API Instance

**Create mobile/src/lib/api.ts:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileApi, createQueryClient } from '@hruf/api';

export const api = createMobileApi({
  baseURL: 'https://your-api.com',
  storage: AsyncStorage,
  tokenKeys: {
    accessToken: 'hruf_auth_token',
    refreshToken: 'hruf_refresh_token'
  }
});

export const queryClient = createQueryClient();
```

### 3. Update App Root

**Before (mobile/App.tsx):**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
```

**After:**
```typescript
import { HrufApiProvider } from '@hruf/api';
import { api, queryClient } from './src/lib/api';

export default function App() {
  return (
    <HrufApiProvider api={api} queryClient={queryClient}>
      <RootNavigator />
    </HrufApiProvider>
  );
}
```

### 4. Replace Mobile Hooks

**Before (mobile/src/hooks/useAuth.ts):**
```typescript
// Custom implementation for mobile auth
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  
  const login = async (credentials: LoginData) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    // ... handle token storage
  };
  
  return { login, token };
}
```

**After:**
```typescript
import { ConvenienceHooks } from '@hruf/api';

// Much simpler
export const useAuth = () => ({
  user: ConvenienceHooks.useCurrentUser().data,
  login: ConvenienceHooks.useLogin().mutateAsync,
  logout: ConvenienceHooks.useLogout().mutateAsync,
  isLoading: ConvenienceHooks.useCurrentUser().isLoading
});
```

### 5. Update Screen Components

**Before:**
```typescript
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { login, isLoading } = useAuth();
  // ... manual fetch implementation
}
```

**After:**
```typescript
import { ConvenienceHooks } from '@hruf/api';

function LoginScreen() {
  const { mutateAsync: login, isPending } = ConvenienceHooks.useLogin();
  // ... simplified implementation
}
```

## Migration Checklist

### Web Application
- [ ] Update `client/src/lib/queryClient.ts` to use shared package
- [ ] Replace `client/src/main.tsx` with `HrufApiProvider`
- [ ] Remove or update `client/src/hooks/use-user.ts`
- [ ] Remove or update `client/src/hooks/use-supplements.ts`
- [ ] Remove or update `client/src/hooks/use-llm.ts`
- [ ] Update all components to use `ConvenienceHooks`
- [ ] Remove direct fetch calls in components
- [ ] Test authentication flow
- [ ] Test supplement management
- [ ] Test chat functionality
- [ ] Test lab upload functionality

### Mobile Application
- [ ] Install `@react-native-async-storage/async-storage`
- [ ] Create `mobile/src/lib/api.ts` with mobile API setup
- [ ] Update `mobile/App.tsx` with `HrufApiProvider`
- [ ] Replace `mobile/src/hooks/useAuth.ts`
- [ ] Replace `mobile/src/hooks/useSupplements.ts` 
- [ ] Replace `mobile/src/hooks/useLabs.ts`
- [ ] Update all screen components
- [ ] Test token-based authentication
- [ ] Test API calls work correctly
- [ ] Test offline/error handling

### Shared Package
- [x] Complete API client implementation
- [x] Complete endpoint definitions
- [x] Complete TanStack Query hooks
- [x] Complete authentication management
- [x] Complete type definitions
- [x] Build and test package
- [x] Create documentation and examples

## Benefits After Integration

1. **Reduced Code Duplication**: Single source of truth for all API interactions
2. **Better Type Safety**: Comprehensive TypeScript types across platforms
3. **Consistent Error Handling**: Unified error handling patterns
4. **Easier Testing**: Mock API instances for testing
5. **Platform Optimization**: Automatic session vs token auth
6. **Better Maintenance**: Changes in one place affect both platforms
7. **Streaming Support**: Built-in SSE support for chat features
8. **File Upload Support**: Platform-agnostic file upload handling

## Breaking Changes

### Authentication
- Web: No breaking changes (still uses sessions)
- Mobile: Must implement token storage in mobile backend

### Hook API Changes
- Return types now follow TanStack Query patterns
- Some hook names changed (e.g., `useUser` → `useCurrentUser`)
- Error handling now uses TanStack Query error patterns

### Import Changes
- All hooks now imported from `@hruf/api`
- Query client setup simplified
- Provider component required at app root

## Rollback Plan

If issues arise during migration:

1. Keep the original hook files temporarily
2. Use feature flags to switch between old and new implementations  
3. Gradual migration by component/screen
4. Monitor error rates and performance
5. Have old implementation available for quick rollback

## Performance Considerations

- The shared package adds ~50KB to bundle size
- Query client configuration optimized for both platforms
- Automatic request deduplication and caching
- Memory usage should be similar or better due to better cache management