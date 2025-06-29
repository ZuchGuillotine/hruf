# @hruf/api

Shared API client package for HRUF health tracking applications. Provides a platform-agnostic HTTP client with TanStack Query integration for both web and mobile applications.

## Features

- 🌐 **Platform Agnostic**: Works in both web browsers and React Native
- 🔐 **Dual Authentication**: Supports session-based (web) and token-based (mobile) authentication
- ⚡ **TanStack Query Integration**: Pre-built hooks for all API endpoints
- 🎯 **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🔄 **Streaming Support**: Built-in Server-Sent Events (SSE) support for chat features
- 📱 **Mobile Ready**: Optimized for React Native with AsyncStorage support
- 🏭 **Factory Functions**: Easy setup for different environments

## Installation

```bash
npm install @hruf/api
```

## Quick Start

### Web Application Setup

```typescript
import { createWebApi, HrufApiProvider, ConvenienceHooks } from '@hruf/api';

// Create API instance for web
const api = createWebApi({
  baseURL: 'https://your-api.com',
  sessionConfig: {
    cookieName: 'your-session-cookie',
    domain: 'your-domain.com'
  }
});

// Wrap your app with the provider
function App() {
  return (
    <HrufApiProvider api={api}>
      <YourApp />
    </HrufApiProvider>
  );
}

// Use convenience hooks in components
function UserProfile() {
  const { data: user, isLoading } = ConvenienceHooks.useCurrentUser();
  const { mutateAsync: updateProfile } = ConvenienceHooks.useUpdateProfile();

  if (isLoading) return <div>Loading...</div>;
  
  return <div>Welcome, {user?.username}!</div>;
}
```

### React Native Setup

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileApi, HrufApiProvider, ConvenienceHooks } from '@hruf/api';

// Create API instance for mobile
const api = createMobileApi({
  baseURL: 'https://your-api.com',
  storage: AsyncStorage,
  tokenKeys: {
    accessToken: 'auth_token',
    refreshToken: 'refresh_token'
  }
});

// Wrap your app with the provider
function App() {
  return (
    <HrufApiProvider api={api}>
      <YourApp />
    </HrufApiProvider>
  );
}

// Use the same convenience hooks
function UserProfile() {
  const { data: user, isLoading } = ConvenienceHooks.useCurrentUser();
  
  return (
    <View>
      <Text>{user?.username}</Text>
    </View>
  );
}
```

### Platform Detection (Automatic)

```typescript
import { createPlatformApi, HrufApiProvider } from '@hruf/api';

// Automatically detects web vs React Native
const api = createPlatformApi({
  common: {
    baseURL: 'https://your-api.com'
  },
  web: {
    sessionConfig: { cookieName: 'session' }
  },
  mobile: {
    storage: AsyncStorage // Only available in React Native
  }
});
```

## Authentication

The package handles two authentication methods automatically:

### Session-based (Web)
- Uses HTTP cookies for authentication
- Credentials are included automatically
- Session management is handled transparently

### Token-based (Mobile)
- Uses Bearer tokens in Authorization headers
- Stores tokens in AsyncStorage (or custom storage)
- Automatic token injection in API requests

### Managing Authentication

```typescript
// Check authentication status
const isAuthenticated = await api.isAuthenticated();

// Clear authentication
await api.clearAuth();

// Update auth headers manually (usually not needed)
await api.updateAuthHeaders();
```

## API Endpoints

All endpoints are organized into logical groups:

### Authentication
```typescript
// Login
const result = await api.auth.login({ username: 'user', password: 'pass' });

// Register
const result = await api.auth.register({ username: 'user', email: 'user@example.com', password: 'pass' });

// Google OAuth
const result = await api.auth.googleLogin({ credential: 'google-jwt-token' });

// Logout
await api.auth.logout();

// Get current user
const { user } = await api.auth.getCurrentUser();
```

### Supplements
```typescript
// Get user's supplements
const supplements = await api.supplements.getSupplements();

// Create supplement
const supplement = await api.supplements.createSupplement({
  name: 'Vitamin D',
  dosage: '2000 IU',
  frequency: 'daily'
});

// Search supplements
const results = await api.supplements.searchSupplements('vitamin');

// Get supplement logs
const logs = await api.supplements.getSupplementLogs('2024-01-15');
```

### Chat & LLM
```typescript
// Streaming chat
const stream = await api.chat.streamChat([
  { role: 'user', content: 'How do I improve my sleep?' }
]);

// Non-streaming supplement query
const response = await api.chat.query([
  { role: 'user', content: 'Tell me about magnesium' }
]);

// Save chat
const log = await api.chat.saveChat({
  content: 'User asked about sleep improvement',
  type: 'question'
});
```

### Lab Results
```typescript
// Get lab results
const labResults = await api.labs.getLabResults();

// Upload lab files
const result = await api.labs.uploadLabResult(fileArray);

// Get chart data
const chartData = await api.labs.getAllLabChartData();
```

## React Hooks

### Basic Hooks (Manual Endpoint Injection)

```typescript
import { useUser, useSupplements, authKeys } from '@hruf/api';

function Component() {
  // Pass endpoints manually
  const { data: user } = useUser(api.auth);
  const { data: supplements } = useSupplements(api.supplements, user?.id);
}
```

### Convenience Hooks (Automatic Endpoint Injection)

```typescript
import { ConvenienceHooks } from '@hruf/api';

function Component() {
  // No need to pass endpoints - automatically injected via context
  const { data: user } = ConvenienceHooks.useCurrentUser();
  const { data: supplements } = ConvenienceHooks.useSupplements(user?.id);
  const { mutateAsync: createSupplement } = ConvenienceHooks.useCreateSupplement();
}
```

### Streaming Chat Hook

```typescript
import { ConvenienceHooks } from '@hruf/api';

function ChatComponent() {
  const { streamChat, isLoading, limitReached } = ConvenienceHooks.useStreamingChat();

  const handleChat = async () => {
    await streamChat(
      [{ role: 'user', content: 'Hello!' }],
      (chunk) => {
        // Handle streaming response chunks
        if (chunk.response) {
          setResponse(prev => prev + chunk.response);
        }
      }
    );
  };
}
```

## Error Handling

```typescript
import type { ApiError } from '@hruf/api';

try {
  const user = await api.auth.login({ username: 'user', password: 'wrong' });
} catch (error) {
  const apiError = error as ApiError;
  console.log('Status:', apiError.status);
  console.log('Response:', apiError.response);
}
```

## Query Client Configuration

```typescript
import { createQueryClient } from '@hruf/api';

// Create with custom configuration
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      retry: 3
    }
  }
});
```

## File Uploads

```typescript
// Single file
const result = await api.labs.uploadLabResult(file);

// Multiple files
const result = await api.labs.uploadLabResult([file1, file2]);

// With FormData
const formData = new FormData();
formData.append('file', file);
formData.append('metadata', JSON.stringify({ type: 'blood_test' }));
const result = await api.labs.uploadLabResult(formData);
```

## Server-Sent Events (Streaming)

```typescript
// Manual streaming
const stream = await api.chat.streamChat(messages);

for await (const chunk of api.chat.parseChatStream(stream)) {
  if (chunk.response) {
    console.log('Received:', chunk.response);
  }
  if (chunk.error) {
    throw new Error(chunk.error);
  }
}

// Or use the convenience method
const response = await api.chat.chat(messages, (chunk) => {
  console.log('Stream chunk:', chunk);
});
```

## TypeScript Support

The package provides comprehensive TypeScript support:

```typescript
import type {
  User,
  Supplement,
  LabResult,
  ChatResponse,
  ApiError,
  Message
} from '@hruf/api';

// All API responses are properly typed
const user: User = await api.auth.getCurrentUser();
const supplements: Supplement[] = await api.supplements.getSupplements();
```

## Environment Configuration

### Development
```typescript
const api = createWebApi({
  baseURL: 'http://localhost:3000',
  timeout: 10000
});
```

### Production
```typescript
const api = createWebApi({
  baseURL: 'https://api.yourdomain.com',
  timeout: 30000,
  sessionConfig: {
    secure: true,
    sameSite: 'strict'
  }
});
```

## Testing

```typescript
// Mock the API for testing
const mockApi = {
  auth: {
    getCurrentUser: jest.fn(() => Promise.resolve({ user: mockUser }))
  }
} as any;

// Test with mock
render(
  <HrufApiProvider api={mockApi}>
    <YourComponent />
  </HrufApiProvider>
);
```

## Migration from Existing Code

### Before (Direct Fetch)
```typescript
const response = await fetch('/api/supplements', {
  credentials: 'include'
});
const supplements = await response.json();
```

### After (Using API Package)
```typescript
const supplements = await api.supplements.getSupplements();
// or with hooks
const { data: supplements } = ConvenienceHooks.useSupplements();
```

## Contributing

This package is part of the HRUF monorepo. See the main project documentation for contribution guidelines.

## License

MIT - See LICENSE file for details.