# Integration Guide

This guide explains how to integrate the `@hruf/shared-types` package into your web and mobile applications.

## Installation

Since this is a workspace package, it's automatically available to other packages in the monorepo:

```bash
# From root directory
npm install

# The shared-types package will be available as @hruf/shared-types
```

## Usage in Web Application (client/)

Update your `client/src/lib/types.ts` to import from the shared package:

```typescript
// Replace local type definitions with imports
import type { 
  ResearchDocument,
  BlogPost,
  Message,
  BiomarkerDataPoint,
  ChartApiResponse 
} from '@hruf/shared-types';

// You can now remove the local type definitions
```

Update components to use shared types:

```typescript
// client/src/components/BiomarkerHistoryChart.tsx
import type { BiomarkerDataPoint, ChartConfig } from '@hruf/shared-types';

interface ChartProps {
  data: BiomarkerDataPoint[];
  config?: ChartConfig;
}
```

## Usage in Server Application (server/)

Replace server type imports:

```typescript
// server/types/user.ts - can now import from shared package
import type { 
  User, 
  SelectUser,
  InsertUser,
  HealthStats,
  Supplement 
} from '@hruf/shared-types';

// Remove local type definitions that are now in shared package
```

Update route handlers:

```typescript
// server/routes/labs.ts
import type { 
  ChartApiResponse, 
  BiomarkerDataPoint,
  SelectLabResult 
} from '@hruf/shared-types';

export async function getChartData(): Promise<ChartApiResponse> {
  // Implementation
}
```

## Usage with Database Operations

Import schemas and types for database operations:

```typescript
// server/services/labUploadService.ts
import { 
  labResults, 
  biomarkerResults,
  insertLabResultSchema,
  type InsertLabResult,
  type SelectBiomarkerResult 
} from '@hruf/shared-types/database';

import { db } from '@db';

async function createLabResult(data: InsertLabResult) {
  // Validate with Zod schema
  const validatedData = insertLabResultSchema.parse(data);
  
  // Insert with Drizzle
  const result = await db.insert(labResults).values(validatedData).returning();
  
  return result[0];
}
```

## Usage in Mobile Application

```typescript
// mobile/src/types/index.ts
export type {
  UserProfile,
  SupplementInfo,
  BiomarkerDataPoint,
  ApiResponse,
  ChartApiResponse
} from '@hruf/shared-types';

// mobile/src/services/api.ts
import type { ApiResponse, UserProfile } from '@hruf/shared-types';

export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  // Implementation
}
```

## Migration Steps

### 1. Update Package Dependencies

Add the shared types package to your tsconfig.json paths if needed:

```json
{
  "compilerOptions": {
    "paths": {
      "@hruf/shared-types": ["./packages/shared-types/src"],
      "@hruf/shared-types/*": ["./packages/shared-types/src/*"]
    }
  }
}
```

### 2. Replace Local Type Definitions

1. **Client Types**: Replace types in `client/src/lib/types.ts`
2. **Server Types**: Replace types in `server/types/user.ts`
3. **Chart Types**: Replace types in `client/src/types/chart.ts`

### 3. Update Database Schema Imports

Replace direct schema imports:

```typescript
// Before
import { users, supplements } from '@db/schema';

// After  
import { users, supplements } from '@hruf/shared-types/database';
```

### 4. Update Component Imports

Update all component files to import types from the shared package:

```typescript
// Before
import type { BiomarkerDataPoint } from '../types/chart';

// After
import type { BiomarkerDataPoint } from '@hruf/shared-types';
```

### 5. Test Integration

Run the following commands to ensure everything works:

```bash
# Build shared types
cd packages/shared-types && npm run build

# Run type checking
npm run check

# Run tests
npm test

# Build applications
npm run build
```

## Benefits After Integration

1. **Type Consistency**: Same types used across web and mobile
2. **Centralized Management**: Single source of truth for all types
3. **Better Maintainability**: Changes in one place affect all apps
4. **Reduced Duplication**: No more duplicate type definitions
5. **Better Developer Experience**: Intellisense and autocomplete work across projects
6. **Version Control**: Types are versioned and can be updated independently

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Ensure the shared-types package is built: `cd packages/shared-types && npm run build`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript configuration paths

### Import Errors

If imports don't resolve:

1. Check that the package is properly installed in the workspace
2. Verify the export paths in the shared-types package.json
3. Ensure your bundler supports the ESM module format

### Type Conflicts

If you encounter type conflicts:

1. Remove local type definitions that are now in the shared package
2. Use type aliases to rename conflicting types
3. Check for duplicate exports in the shared package