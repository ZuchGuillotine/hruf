# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-06-26

### Added
- Initial release of @hruf/shared-types package
- Complete database schema extraction from main project
- All Drizzle ORM table definitions and relationships
- TypeScript types for all database operations (Select/Insert)
- Zod validation schemas for runtime type checking
- Shared application types for cross-platform compatibility
- Chart and visualization type definitions
- User and authentication type definitions
- Comprehensive API response type definitions
- Tree-shakable exports for optimal bundle size
- Full TypeScript declaration files and source maps
- Comprehensive documentation and usage examples

### Database Schemas Included
- `users` - User authentication and profiles
- `healthStats` - User health metrics
- `supplements` - Supplement tracking
- `supplementLogs` - Daily supplement intake logs
- `supplementReference` - Supplement reference data
- `labResults` - Lab result file storage
- `biomarkerResults` - Processed biomarker data
- `biomarkerProcessingStatus` - Processing status tracking
- `biomarkerReference` - Biomarker reference data
- `qualitativeLogs` - AI chat interactions
- `queryChatLogs` - Query chat storage
- `blogPosts` - Blog content management
- `researchDocuments` - Research article storage
- `chatSummaries` - Chat summary storage
- `logEmbeddings` - Vector embeddings for search
- `summaryEmbeddings` - Summary vector embeddings
- `logSummaries` - Summarized content storage

### Types Included
- All database Select/Insert types
- Chart and visualization types
- API response wrapper types
- User profile and authentication types
- Biomarker and lab result types
- Pagination and filtering types
- Subscription and usage limit types

### Features
- ESM module format
- TypeScript 5.6+ compatibility
- Drizzle ORM integration
- Zod schema validation
- Cross-platform compatibility (Web/Mobile)
- Comprehensive type safety
- Tree-shakable imports
- Full documentation