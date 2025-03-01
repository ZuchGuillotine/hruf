
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
