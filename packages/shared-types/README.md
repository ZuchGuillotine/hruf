# @hruf/shared-types

A comprehensive TypeScript types package containing database schemas and shared type definitions for the HRUF health tracking platform. This package is designed to be consumed by both web and mobile applications to ensure type consistency across the entire ecosystem.

## Features

- 🗄️ **Complete Database Schemas** - All Drizzle ORM table definitions
- 🔧 **Type Safety** - TypeScript types for all database operations
- ✅ **Zod Validation** - Schema validation for runtime type checking
- 📱 **Cross-Platform** - Works with web and mobile applications
- 🎯 **Tree-shakable** - Import only what you need

## Installation

```bash
npm install @hruf/shared-types
```

## Usage

### Database Types

```typescript
import { 
  SelectUser, 
  InsertUser, 
  users,
  insertUserSchema 
} from '@hruf/shared-types';

// Use the schema for database queries
const user = await db.select().from(users).where(eq(users.id, 1));

// Use types for type-safe operations
const newUser: InsertUser = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashed_password'
};

// Use Zod schema for validation
const validatedUser = insertUserSchema.parse(newUser);
```

### Application Types

```typescript
import { 
  BiomarkerDataPoint, 
  ChartApiResponse, 
  ApiResponse 
} from '@hruf/shared-types';

// Use for API responses
const chartData: ChartApiResponse = {
  success: true,
  data: biomarkers,
  pagination: { page: 1, pageSize: 20, total: 100 }
};

// Use for component props
interface ChartProps {
  data: BiomarkerDataPoint[];
  config: ChartConfig;
}
```

### Selective Imports

```typescript
// Import specific types
import type { SelectUser, BiomarkerDataPoint } from '@hruf/shared-types';

// Import specific schemas
import { users, biomarkerResults } from '@hruf/shared-types/database';

// Import specific type categories
import { ChartApiResponse, TrendSeries } from '@hruf/shared-types/types';
```

## Package Structure

```
src/
├── database/
│   ├── schema.ts         # Drizzle table definitions
│   ├── types.ts          # Database-related TypeScript types
│   └── index.ts          # Database exports
├── types/
│   ├── common.ts         # Shared application types
│   ├── user.ts           # User-related types
│   ├── chart.ts          # Chart and visualization types
│   └── index.ts          # Type exports
└── index.ts              # Main package exports
```

## Available Exports

### Database Schemas
- `users` - User authentication and profile
- `healthStats` - User health metrics
- `supplements` - Supplement tracking
- `labResults` - Lab result storage
- `biomarkerResults` - Processed biomarker data
- `qualitativeLogs` - AI chat interactions
- And many more...

### TypeScript Types
- `SelectUser`, `InsertUser` - User types
- `SelectLabResult`, `InsertLabResult` - Lab result types
- `BiomarkerDataPoint` - Chart data points
- `ApiResponse<T>` - Generic API response wrapper
- `ChartConfig` - Chart configuration options

### Zod Schemas
- `insertUserSchema`, `selectUserSchema`
- `insertLabResultSchema`, `selectLabResultSchema`
- All database table schemas with validation

## Development

Build the package:
```bash
npm run build
```

Watch for changes during development:
```bash
npm run dev
```

## Compatibility

- **Node.js**: >= 18.0.0
- **TypeScript**: >= 5.0.0
- **Drizzle ORM**: ^0.32.1
- **Zod**: ^3.23.8

## License

MIT