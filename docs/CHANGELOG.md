
## [Unreleased]
### Added (March 22, 2025)
- Enhanced debug logging system for context operations
- Implemented fallback mechanisms for failed vector searches
- Added comprehensive error tracking for context building
- Enhanced token usage monitoring and optimization

### Fixed
- Improved vector search error handling
- Enhanced streaming response stability
- Added better authentication state tracking
- Improved context component verification

### Known Issues
- Context save operations incomplete
- Retrieval operations returning partial data
- Vector search casting errors ongoing
- Streaming stability improvements needed



# Changelog

## [March 2025]
### Fixed (March 18, 2025 - Update 5)
- Vector Search and Context Services:
  - Fixed vector search casting error in similarity search
  - Resolved "cannot cast type record to vector" error
  - Enhanced context building reliability
  - Improved token efficiency in queries
  - Added comprehensive error recovery
  - Enhanced streaming response stability

### Fixed (March 18, 2025 - Update 4)
- Context Services:
  - Added QUERY_SYSTEM_PROMPT to openai.ts
  - Fixed openai client export configuration
  - Updated logger to use ES Module syntax
  - Implemented LRUCache for embedding service
  - Enhanced error handling in context building

### Enhanced (March 18, 2025 - Update 3)
- Context Building and Streaming:
  - Fixed streaming response handling in qualitative chat
  - Enhanced error handling in OpenAI service
  - Improved token usage tracking
  - Enhanced event stream parsing
  - Fixed client-side message replacement issues

### Identified (March 18, 2025 - Update 2)
- Context Building Issues:
  - Vector search casting error in similarity search ("cannot cast type record to vector")
  - Incomplete context propagation to UI (partial population observed in debug logs)
  - EventSource connection instability resulting in event errors in the client
  - Missing health stats and qualitative observations in context components
- Debug System Performance:
  - Successfully tracking context components
  - Capturing vector search errors
  - Logging streaming connection issues
  - Monitoring authentication state

### Enhanced (March 18, 2025)
- Troubleshooting Efforts:  
  - Reviewed debug logs, hybrid systems document, and previous code changes
  - Identified vector search casting errors, incomplete context population, and EventSource connection issues
  - Further investigation and solutions in progress


# Changelog

## [March 2025]
# Changelog

### Identified (March 18, 2025 - Update 2)
- Context Building Issues:
  - Vector search casting error in similarity search ("cannot cast type record to vector")
  - Incomplete context propagation to UI (partial population observed in debug logs)
  - EventSource connection instability resulting in event errors in the client
  - Missing health stats and qualitative observations in context components
- Debug System Performance:
  - Successfully tracking context components
  - Capturing vector search errors
  - Logging streaming connection issues
  - Monitoring authentication state

### Enhanced (March 18, 2025)
- Troubleshooting Efforts:  Reviewed debug logs, hybrid systems document, and previous code changes (authentication state tracking, context building improvements, error handling enhancements, debug logging additions).  Identified vector search casting errors, incomplete context population, and EventSource connection issues as root causes of UI unresponsiveness and event errors.  Further investigation and solutions are in progress.
### Enhanced (March 14, 2025)
- Context Building System:
  - Improved vector-based context retrieval
  - Enhanced qualitative chat log integration
  - Added proper authentication state tracking
  - Implemented comprehensive debug logging
  - Enhanced context relevance through vector similarity
  - Improved health statistics integration
  - Fixed context flags tracking and verification

- Debug Infrastructure:
  - Implemented detailed context debugging system
  - Added token usage analysis
  - Enhanced error tracking capabilities
  - Added proper debug file management
  - Improved logging for context building

### Fixed
- LLM Chat Service Streaming:
  - Fixed streaming response issue in qualitative feedback chat
  - Resolved problem where correct responses were being replaced with error messages
  - Ensured complete responses are properly delivered to the client
  - Improved error handling in stream processing
  - Enhanced client-side parsing of Server-Sent Events

### Added
- Comprehensive Testing Framework:
  - Implemented Jest-based testing infrastructure
  - Created test suite for core services:
    - LLM context building (llmContextService.test.ts)
    - Vector embeddings (embeddingService.test.ts)
    - Summary generation (advancedSummaryService.test.ts)
    - Summary scheduling (summaryManager.test.ts)
    - OpenAI integration (openai.test.ts)
    - Service initialization (serviceInitializer.test.ts)
  - Added test utilities in setup.ts
  - Updated package.json with comprehensive test commands
  - Configured jest.config.cjs for ES modules compatibility
  - Added proper test environments for different service types
  - Implemented database-aware tests with graceful fallbacks

- Type Safety Audit of Summary Services:
  - Identified critical type safety issues in advancedSummaryService
  - Documented null safety concerns in date handling
  - Found metadata schema mismatches
  - Discovered query result type definition gaps

## [March 2025]
### Added
- Comprehensive Testing Framework:
  - Implemented Jest-based testing infrastructure
  - Created test suite for core services:
    - LLM context building (llmContextService.test.ts)
    - Vector embeddings (embeddingService.test.ts)
    - Summary generation (advancedSummaryService.test.ts)
    - Summary scheduling (summaryManager.test.ts)
    - OpenAI integration (openai.test.ts)
    - Service initialization (serviceInitializer.test.ts)
  - Added test utilities in setup.ts
  - Updated package.json with comprehensive test commands
  - Configured jest.config.cjs for ES modules compatibility
  - Added proper test environments for different service types
  - Implemented database-aware tests with graceful fallbacks

- Summary Controller and Routes Integration:
  - Created dedicated summaryController.ts with comprehensive functionality
  - Implemented modular summaryRoutes.ts for better code organization
  - Added /api/summaries endpoint with various actions:
    - GET / for retrieving all summaries
    - POST /daily for generating daily summaries
    - POST /weekly for generating weekly summaries
    - POST /realtime for triggering immediate summarization
  - Enhanced authentication with dedicated middleware
  - Improved error handling and response formatting
  - Added robust parameter validation
  - Successfully integrated summary routes into the main server application
  - Added setupSummaryRoutes import and initialization in server/index.ts

### Enhanced 
- Supplement History Component:
  - Updated supplement-history page to work with summary-based approach
  - Improved data fetching from qualitative logs and daily summaries
  - Enhanced UI to display both supplement logs and summaries
  - Added better error handling and loading states
  - Fixed date handling for proper UTC boundaries
  - Improved navigation and user experience

- Server API Routes:
  - Modified /api/supplement-logs/:date endpoint to support summarization
  - Enhanced data retrieval with proper UTC day boundary handling
  - Improved error logging and debugging information
  - Optimized database queries for better performance
  - Added comprehensive data enrichment for history view

### Fixed
- Timezone Issues:
  - Resolved date mismatch between client and server
  - Implemented proper UTC day boundary handling
  - Fixed date display in supplement history calendar
  - Improved date/time conversions across application


# Changelog

## [March 2025]
### Enhanced
- Server Startup and Shutdown Process:
  - Improved service initialization with better sequencing
  - Added dedicated `initializeAndStart()` function for clearer flow
  - Enhanced graceful shutdown with proper resource cleanup
  - Added timeout handling for forced shutdown after 10 seconds
  - Implemented more robust signal handling (SIGTERM, SIGINT)
  - Improved connection closure during shutdown
  - Better error recovery if service initialization fails
  - Enhanced logging throughout startup and shutdown process

### Added
- Enhanced OpenAI Integration with Improved Metrics:
  - Implemented advanced token usage tracking and analytics
  - Added comprehensive logging throughout the OpenAI service
  - Enhanced error handling with detailed diagnostics
  - Added token estimation functions for optimization
  - Improved error recovery mechanisms for streaming responses
  - Enhanced debugging capabilities with detailed logging
  - Added usage analytics for monitoring and optimization

### Added
- Service Initializer Module:
  - Implemented comprehensive service initialization system
  - Created proper startup sequence for all AI context services
  - Added graceful shutdown procedures
  - Properly integrated with server startup process
  - Configured environment-aware scheduled tasks
  - Added robust error handling for service initialization
  - Enhanced logging for easier debugging and monitoring
  - Added PGVector and summarization service verification

## [March 2025]
### Added
- Advanced Context Management Services:
  - Implemented embeddingService for vector embedding management:
    - OpenAI embedding generation for logs and summaries
    - Semantic similarity search functionality
    - Batch processing for efficient API usage
    - Support for both qualitative and quantitative logs
  - Implemented advancedSummaryService for intelligent summarization:
    - Daily summaries of supplement logs and experiences
    - Weekly summaries identifying patterns and trends
    - Automatic extraction of significant changes
    - Token-optimized context for LLM interactions
  - Enhanced token efficiency through smart context building:
    - Retrieval of semantically relevant content
    - Prioritization of recent and significant information
    - Reduced token usage while maintaining context quality
    - Improved response relevance for both chat systems
  - Implemented automated summary scheduling system:
    - Scheduled daily summary generation (1 AM)
    - Scheduled weekly summary generation (Sundays at 2 AM)
    - Smart scheduling of first runs
    - On-demand real-time summarization capability
    - Comprehensive logging and error recovery

- Vector Search Capabilities:
  - Implemented pgvector PostgreSQL extension
  - Added log_embeddings table for storing log vectors
  - Added summary_embeddings table for chat summary vectors
  - Created vector search indexes using ivfflat algorithm
  - Configured for 1536-dimension OpenAI embeddings
  - Updated schema.ts with vector field definitions
  - Fixed migration script execution for TypeScript files
  - Enhanced run_migration.js with ES module compatibility

### Fixed
- LLM Model Configuration Issues:
  - Fixed incorrect model usage in qualitative chat interface
  - Properly configured model constants for different interface types:
    - Qualitative feedback chat now correctly uses GPT-4o-mini model
    - Query chat continues to use o3-mini model as intended
  - Enhanced error logging and debugging for LLM service calls
  - Improved model selection logic to ensure each interface uses the correct model
  - Added model information to console logs for easier troubleshooting

### Enhanced
- Supplement Form Dosage Options:
  - Enhanced dosage unit options to include IU (International Units) and mcg (micrograms)
  - Implemented dynamic dosage amount ranges based on selected unit:
    - mg: 50-1000 in increments of 50
    - mcg: 50-1000 in increments of 50
    - IU: 50-2000 in increments of 50
    - g: 1-10 in increments of 1
  - Improved user experience with automatic default value selection when changing units
  - Added proper reset logic to maintain appropriate dosage values for each unit type

### Enhanced (March 09, 2025)
- AI Integration and Streaming Updates:
  - Upgraded to new model "o3-mini-2025-01-31"
  - Implemented real-time streaming response functionality:
    - Added streaming support in chat and query interfaces
    - Enhanced client-side handling of streamed responses
    - Improved user experience with word-by-word display
  - Updated OpenAI API configuration:
    - Removed unsupported parameters (temperature, max_tokens)
    - Added max_completion_tokens parameter
    - Enhanced error handling for API responses
  - Improved debugging and logging:
    - Added detailed stream chunk logging
    - Enhanced error tracking in streaming responses
    - Improved client-side parsing of SSE data
  - Technical improvements:
    - Converted chatWithAI to async generator function
    - Enhanced SSE handling in routes
    - Optimized streaming response delivery
    - Improved error recovery mechanisms


### Fixed
- Duplicate Notification Issue:
  - Fixed issue where supplement intake reminder notifications appeared twice
  - Implemented notification tracking state to prevent duplicate toast messages
  - Separated effect hooks to better control notification trigger conditions
  - Added proper dependency array optimization to prevent unnecessary re-renders
  - Enhanced notification visibility control for improved user experience

- Login Redirection Issue:
  - Resolved issue where users received a 404 page after login instead of being redirected to dashboard
  - Added explicit redirect URL parameter in authentication response
  - Updated client-side login flow to properly handle server redirects
  - Preserved new user signup flow including payment modal functionality
  - Enhanced login handler to ensure consistent post-authentication navigation

## [March 2025]
### Added
- Enhanced Background Animation System
  - Improved full-page coverage of background scrolling text
  - Fixed background text visibility in taller pages with cards
  - Adjusted header styling to prevent background text showing through
  - Optimized z-index layering for proper component visibility
  - Increased number of word rows for consistent page coverage
  - Preserved original animation style, speed and direction
- Stripe Subscription Integration
  - Implemented correct price ID mapping for all subscription tiers
  - Added direct signup URL for frictionless free trial flow
  - Enhanced subscription page interface with clear tier options
  - Configured seamless checkout process integration

### Fixed
- Stripe Checkout Issues:
  - Resolved product/price ID mapping in checkout session creation
  - Fixed authentication state preservation during checkout
  - Implemented proper error handling and logging
  - Added direct trial signup without payment info requirement
- Subscription Page UX:
  - Improved button labeling clarity
  - Fixed redirect handling post-checkout
  - Enhanced error messaging for failed checkouts
  - Streamlined trial vs paid subscription flows

### Enhanced
- Improved Chat Systems Separation
  - Updated Daily Notes section to exclude query chats
  - Ensured query chats are properly stored in query_chats table
  - Modified LLM context service to maintain clear separation
  - Enhanced server routes to properly filter log types
  - Fixed authentication recognition in query system
- Improved Landing Page Layout and Conversion:
  - Implemented centered header card with white background
  - Added two-column responsive layout for desktop view
  - Enhanced z-index layering for proper content visibility
  - Improved container styling with backdrop blur
  - Added value proposition cards with enhanced styling
  - Optimized mobile responsiveness
  - Fixed background animation layer ordering

### Enhanced
- Authentication state management:
  - Added comprehensive debug endpoints for auth verification
  - Improved error handling in authentication flow
  - Enhanced session security with proper cookie settings
  - Optimized auth info middleware for consistent access
- Implemented Google Analytics tracking
  - Added Google Analytics tag to main HTML template
  - Configured debug mode for verification
  - Confirmed successful tracking implementation
  - Enhanced with additional event tracking for better insights

### Fixed
- Authentication Flow Improvements:
  - Resolved navigation logic in SignupForm
  - Enhanced error handling in userController
  - Fixed verification flow feedback
  - Optimized session management
  - Improved TypeScript type definitions
  - Added proper error messaging
- Resolved authentication recognition issue in query interface
  - Fixed user authentication state propagation in query routes
  - Corrected middleware order for proper session handling
  - Enhanced CORS configuration to properly handle credentials
  - Streamlined authentication middleware to improve performance
  - Ensured consistent authentication verification across services

### Changed
- Updated authentication system architecture:
  - Simplified session configuration with MemoryStore
  - Improved cookie handling with proper security settings
  - Optimized authentication middleware chain
  - Reduced unnecessary debug logging for better performance


## [February 2025]
### Added
- Implemented Query Chats Table
  - Created database table for storing query conversations
  - Added schema with user references and JSONB message storage
  - Implemented timestamp tracking for conversations
  - Added metadata support for future feature extensions
  - Established foundation for dual LLM conversation tracking
  - Separates general queries from qualitative feedback in storage and display

### Fixed
- Fixed Research Documents functionality
  - Resolved undefined `researchDocuments` variable in routes.ts
  - Error boundary now properly catching and displaying errors in research pages
  - Successfully implemented research documents backend/frontend connection
  - Improved error handling for research document retrieval

## [February 2025]
### Added
- Implemented dual LLM service architecture
  - Created separate LLM services for different user needs:
    - Qualitative feedback chat for supplement experiences
    - General query system for supplement information
  - Enhanced context building with health statistics data
  - Authentication-aware responses for personalized information
  - Different system prompts optimized for each use case
  - AskPage UI for general supplement queries
  - Comprehensive error handling for both services
  - Full integration with existing database schema

- Implemented Research page routing
  - Added route for the Research page in AppRouter
  - Created placeholder component for future implementation
  - Prepared application for expanded research content features
- Implemented chat summarization system
  - Periodic summarization of old chat interactions
  - Integration with LLM context building
  - Improved context management for user interactions
  - Functionality working but needs thorough testing

### Changed
- Consolidated all database operations to NeonDB
  - Migrated all tables from RDS to NeonDB PostgreSQL
  - Removed AWS RDS dependencies and connections
  - Updated all database queries to use NeonDB schemas
  - Simplified database connection management

### Enhanced
- OpenAI Integration
  - Functional integration with OpenAI API
  - Plans for streaming responses implementation
  - System prompt refinements in development
  - Additional context support in progress
- LLM Services
  - Created functional llmContextService.ts
  - Supporting supplement context
  - Planning additional table data integration
  - Preparing for second LLM user interface on 'ask' page


## [1.0.3] - 2025-02-17
### Added
- Payment System Integration:
  - Created AccountInfo component for subscription management
  - Implemented trial period countdown
  - Added subscription pricing options display
  - Integrated Stripe payment links
  - Enhanced profile page with subscription status

## [1.0.2] - 2025-02-17
### Added
- Supplement Streak Tracking Feature:
  - New streak tracking card component
  - Progress bar for 90-day goal visualization
  - Motivational messaging based on streak status
  - Backend endpoint for streak calculation
### Enhanced
- Redesigned Health Stats page layout:
  - Implemented dual-column layout for basic information
  - Added centered edit button placement
  - Improved data presentation with clear labeling
  - Enhanced form validation and error handling
  - Optimized mobile responsiveness
- Improved Health Stats page UI:
  - Enhanced title card styling with optimized spacing
  - Increased border radius for better visual appeal
  - Improved layout hierarchy with repositioned back link
  - Optimized component spacing and padding
### Fixed
- Database migration improvements:
  - Established correct migration execution using `tsx` instead of `drizzle-kit push:pg`
  - Implemented proper database connection initialization in migration files
  - Successfully removed redundant id column from health_stats table
  - Changed allergies column from jsonb to text type

## [1.0.1] - 2025-02-17
### Fixed
- Health Stats UI improvements:
  - Fixed sleep value persistence in health stats form
  - Implemented proper conversion between minutes and hours/minutes display
  - Enhanced user experience with proper form value retention
### Enhanced
- Improved chat message display in supplement history:
  - Added personalized username display instead of generic "user" label
  - Enhanced message attribution clarity
  - Improved user identification in chat history
### Fixed
- Resolved critical timezone and date display issues in supplement tracking:
  - Fixed supplement logs appearing one day ahead in history view
  - Corrected timestamp preservation for supplement intake logs
  - Fixed incorrect fixed time (4:00) display issue
  - Implemented proper UTC day boundary handling for date queries

### Changed
- Enhanced timezone handling across the application:
  - Client-side:
    - Modified supplement logging to preserve exact intake timestamps
    - Removed UTC noon timestamp normalization
    - Added detailed logging for timestamp debugging
  - Server-side:
    - Implemented UTC day boundary calculations
    - Switched from DATE() casting to direct timestamp comparisons
    - Added comprehensive timezone-aware date handling
    - Enhanced logging for better debugging capabilities

### Technical Details
If similar issues occur in the future, here's how to fix them:

1. Timestamp Preservation:
   - Always use `toISOString()` for timestamps
   - Don't normalize times to noon or any fixed time
   - Preserve original intake times throughout the system

2. Date Querying:
   - Use UTC day boundaries for date range queries
   - Calculate start/end of day in UTC:
     ```typescript
     const startOfDay = new Date(`${date}T00:00:00.000Z`);
     const endOfDay = new Date(`${date}T23:59:59.999Z`);
     ```
   - Use direct timestamp comparisons instead of DATE() casting

3. Common Pitfalls to Avoid:
   - Don't use DATE() casting for timestamp comparisons
   - Avoid timezone conversion in SQL queries
   - Don't normalize timestamps to fixed times
   - Preserve original timestamps throughout the application

### Migration Guide
No database migration required. These changes are purely logical and affect only how dates are handled in the application code.

## [Unreleased]
### Fixed
- Enhanced chat summary display in supplement history:
  - Improved formatting of chat summaries
  - Added combined user and assistant message display
  - Removed unnecessary JSON syntax from visible text
  - Improved truncation handling to show both messages
### Changed
- Simplified chat storage system:
  - Removed sentiment analysis requirements
  - Updated chat save functionality
  - Improved error handling in chat interactions
  - Enhanced chat interface responsiveness
- Resolved timezone handling in supplement logs
  - Fixed date mismatch between saving and retrieving logs
  - Implemented proper UTC conversion in both client and server
  - Added timezone offset adjustment for accurate date display

### Changed
- Consolidated all database operations to NeonDB
  - Migrated supplement_logs table from RDS to NeonDB
  - Migrated qualitative_logs table from RDS to NeonDB
  - Migrated supplement_reference table from RDS to NeonDB
  - Removed AWS RDS dependencies and connections
  - Updated all database queries to use NeonDB schemas
  - Simplified database connection management

### Removed
- AWS RDS integration and dependencies
- RDS-specific schema definitions
- Dual-database architecture

### Added
- Reorganized database schemas into dedicated files
- Enhanced database integration
- Verified complete database functionality
- Enhanced navigation in supplement history page
- Blog post management system
- Rich text editing capabilities
- Thumbnail URL support for blog posts
- Responsive grid layout for blog listing
- Loading states and error handling
- Protected admin routes
- Blog post schema with proper timestamps
- Supplemental RDS database integration
- Google OAuth authentication system (in progress)

### Changed
- Improved public pages routing and layout
- Updated frontend routing to include blog management
- Enhanced admin dashboard layout
- Improved data consistency between admin and public views
- Modified authentication system to support multiple strategies
- Updated database connection to use supplemental RDS

### Fixed
- Public routes accessibility issues
- Blog post schema implementation
- Data synchronization between admin dashboard and public views
- API endpoint authentication checks

### Known Issues
- Google OAuth authentication failing despite correct client credentials
- Environment URL configuration may need adjustment for development environment
- Callback URL verified but authorization still failing
- Logging shows credentials exist but authentication flow incomplete

## [0.1.0] - 2025-02-09
### Added
- Initial release with core functionality
- User authentication system
- Supplement tracking basics
- Background animated text
- Basic admin dashboard

### Changed
- Enhanced security measures
- Improved UI components

### Fixed
- Various routing issues
- Authentication edge cases

## [0.0.1] - 2025-02-01
### Added
- Project initialization
- Basic project structure
- Initial database setup

### Needed Improvements
- Type Safety Enhancements Required:
  1. Date Handling:
     - Add null checks for takenAt and loggedAt fields
     - Implement safe Date object creation
     - Update type definitions for date fields
  2. Database Types:
     - Add proper type definitions for NeonHttpQueryResult
     - Implement iterator interface for query results
     - Add length property to query result types
  3. Schema Alignment:
     - Update InsertLogSummary type definition
     - Add missing metadata properties
     - Consider database migration for naming consistency
  4. Error Prevention:
     - Add runtime checks for null values
     - Implement proper type guards
     - Enhance error logging for type-related issues

### Added
- New `dateUtils.ts` module for centralized date handling
  - Safe date parsing with error handling
  - UTC-aware date boundary calculations
  - Standardized date formatting
  - Date range validation and calculations
  - SQL helpers for date queries

### Changed
- Updated schema timestamp fields with improved type safety
  - Added `{ mode: 'date' }` to all timestamp fields
  - Standardized `CURRENT_TIMESTAMP` defaults
  - Made critical timestamp fields non-nullable
  - Added proper type definitions for metadata date fields

### Fixed
- Addressed date handling inconsistencies in context services
  - Improved UTC boundary handling
  - Added proper null checking for dates
  - Fixed timezone-related comparison issues

### Technical Debt
- Context services require updates to use new date utilities
- Migration needed for existing date fields
- Additional tests required for date handling edge cases

### Added
- Context Debugger System
  - Comprehensive debug logging for LLM context analysis
  - Token usage estimation and optimization tools
  - Context component tracking and validation
  - Environment-aware debug configuration
  - Non-blocking error handling
  - Integration with qualitative and query services