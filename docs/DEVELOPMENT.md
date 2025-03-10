
# Development Guide

## Testing Framework

The application uses Jest for running unit and integration tests. The test configuration is in `jest.config.cjs` and uses a CommonJS format to be compatible with the ES module setup of the main project.

### Running Tests

Tests can be run with the following npm commands:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:summary     # Test summary services
npm run test:embedding   # Test embedding services 
npm run test:context     # Test context building services
npm run test:openai      # Test OpenAI integration

# Run tests in watch mode (automatically re-runs when files change)
npm run test:watch
```

### Test Structure

Tests are organized in the `server/tests` directory and follow the pattern of `*.test.ts`. The main test modules include:

- `llmContextService.test.ts` - Tests for context building functionality
- `embeddingService.test.ts` - Tests for vector embedding generation
- `advancedSummaryService.test.ts` - Tests for the summary generation service
- `summaryManager.test.ts` - Tests for scheduled summary tasks
- `openai.test.ts` - Tests for OpenAI integration
- `serviceInitializer.test.ts` - Tests for service initialization and shutdown

### Test Utilities

A `setup.ts` file provides common utilities and mock functions for tests, including:

- Test environment configuration
- Token estimation functions
- Mock implementations of external services
- Database test helpers

### Testing Database Operations

Tests that interact with the database are designed to handle cases where the database might not be available. They include checks to skip tests when necessary.

### Test Data Cleanup

Many tests are designed to clean up after themselves to avoid test data accumulation. For example, summary tests track created records and remove them during test cleanup.


# Development Guide

## Architecture Overview

### Frontend
- React 18 with TypeScript
- TanStack Query for state management
- shadcn/ui components
- Tailwind CSS for styling

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- OpenAI integration for AI insights

## Development Workflow

### Setting Up Local Environment
1. Install dependencies: `npm install`
2. Set up environment variables
3. Start development server: `npm run dev`

### Code Structure
- Components: `/client/src/components`
- Pages: `/client/src/pages`
- API Routes: `/server/routes.ts`
- Database: `/db`

### Adding New Features
1. Create components in `/client/src/components`
2. Add routes in `/server/routes.ts`
3. Update types in `/client/src/lib/types.ts`
4. Add tests where applicable

### AI Integration System
- OpenAI Integration: `/server/openai.ts`
  - Current Model: GPT-4o-mini
  - System prompt defines assistant behavior
  - Customizable temperature and token settings

- Context Building: `/server/services/llmContextService.ts`
  - Constructs personalized user context
  - Retrieves supplement logs and previous chats
  - Will be expanded to include more data sources

- Chat Summarization: `/server/services/llmSummaryService.ts`
  - Maintains condensed chat history
  - Functional but needs further testing
  - Integration Points:
    - Cron job: `/server/cron/summarizeChats.ts`
    - Context building: `/server/services/llmContextService.ts`

- Frontend Implementation:
  - Main chat: `/client/src/components/llm-chat.tsx`
  - Hook: `/client/src/hooks/use-llm.ts`
  - Planned second interface for 'ask' page (upcoming)

### Database Architecture
- Single NeonDB PostgreSQL database
- Schema defined in `/db/schema.ts`
- Migrations in `/db/migrations`
- Drizzle ORM for type-safe queries

### Database Migrations
- Create migration files in `/db/migrations` with TypeScript (.ts extension)
- Run migrations using `npx tsx db/migrations/your_migration_file.ts`
- Import database connection from `/db/index.ts` rather than creating new connections
- Use SQL template literals with drizzle for creating tables and modifying schema
- Verify migrations with direct database queries using appropriate tools

#### Migration Best Practices
- Keep migrations simple and focused on a single responsibility
- Use proper error handling in migration scripts
- Log clear success/failure messages
- Follow existing project conventions for database access
- Reuse the established database connection rather than creating new ones

### Best Practices
- Use TypeScript types for all props
- Follow existing component patterns
- Use TanStack Query for data fetching
- Keep components small and focused

### Common Tasks
- Adding new API endpoint
- Creating new React component
- Updating database schema
- Adding new supplement type

## Deployment
Deployment is handled through Replit's deployment system.
