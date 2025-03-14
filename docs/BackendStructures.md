# Backend Structures Document

## Service Initialization

### Service Startup Architecture
- Class: ServiceInitializer (in server/services/serviceInitializer.ts)
  - Purpose: Provides orderly initialization of all dependent services
  - Methods:
    - `initializeServices()`: Main entry point for service initialization
    - `initializePGVector()`: Sets up vector database services
    - `initializeSummarization()`: Initializes summarization services
    - `startScheduledTasks()`: Configures automated summary generation
    - `shutdownServices()`: Provides graceful shutdown of all services
  - Integration:
    - Integrated with server startup in index.ts
    - Environment-aware scheduling (only in production)
    - Robust error handling to prevent startup failures
    - Graceful shutdown with proper cleanup

### Initialization Flow
1. Server Startup:
   - Express server initialization and middleware setup
   - Database connection establishment
   - Service initialization via `initializeAndStart()` function:
     - Calls serviceInitializer.initializeServices()
     - Continues server startup even if services fail
     - Finds available port with retry mechanism
     - Starts listening on available port
   - Proper signal handling for graceful shutdown

2. Service Initialization:
   - PGVector services verification
   - OpenAI API connectivity check
   - Summarization service setup
   - Automated task scheduling (production only)

3. Shutdown Process:
   - Dedicated `handleShutdown()` function for clean termination
   - Signal handler registration (SIGTERM, SIGINT)
   - Service cleanup via serviceInitializer.shutdownServices()
   - Server connection closure
   - Forced termination after 10-second timeout
   - Comprehensive error handling during shutdown

## Database Structure

### Primary Database (NeonDB)
- Location: Neon PostgreSQL
- Purpose: All application data storage
- Tables:
  - users: User authentication and profiles
  - supplements: User's persistent supplement selections
  - healthStats: User health data
  - blogPosts: Content management
  - supplementLogs: Daily supplement intake records
  - qualitativeLogs: Chat interactions and AI responses
  - supplementReference: Autocomplete and search functionality
  - query_chats: General query chat interactions


### Data Flow
1. Chat Systems:
   - Qualitative Feedback Chat:
     - Purpose: Gather user observations about supplement experiences
     - Storage: qualitative_logs table with type='chat'
     - Context: Combines health stats, supplement logs and previous observations
     - Components: LLMChat, llmContextService, logService
     - Display: Shown in the Daily Notes section of supplement history
   - General Query Chat (Implemented):
     - Purpose: Provide factual information about supplements
     - Storage: Uses same database tables but different context structure
     - Context: Specialized context with health stats and different system prompt
     - Components: AskPage, llmContextService_query, openaiQueryService
     - Authentication-aware: Provides personalized context for auth users

2. Supplement Management:
   - User selections stored in supplements table
   - Daily tracking stored in supplement_logs table
   - Card operations (add/edit/delete) update supplements table
   - "Save Changes" button triggers supplement_logs entry

2. Database Integration Flow:
   - Supplement card data managed in supplements table
   - Save operation triggers data storage in supplement_logs
   - History view combines data from supplement_logs and qualitative_logs

3. Chat System:
   - Interactions stored in qualitative_logs

#### Chat Summary System
- Table: chatSummaries
  - Fields: userId, summary, periodStart, periodEnd, metadata
  - Purpose: Stores condensed historical chat interactions
- Integration: 
  - Automated summarization via cron job
  - Included in LLM context building
  - Reduces token usage while maintaining context quality
  - Includes sentiment analysis and metadata

#### Advanced Summary System
- Service: advancedSummaryService.ts
  - Purpose: Creates intelligent summaries of user supplement logs and experiences
  - Features:
    - Daily summaries combining supplement logs and qualitative observations
    - Weekly summaries that identify patterns and trends
    - Automatic extraction of significant changes
    - Token-optimized context building for LLM interactions
    - Vector-based semantic similarity search
    - Retrieval of relevant historical content
    - Intelligent context prioritization 
  - Integration:
    - Works with logSummaries and embedding tables
    - Provides context to both chat and query systems
    - Reduces token usage in LLM calls
    - Improves relevance of AI responses
    - Integrates with embeddingService for semantic search
    - Powers both qualitative feedback and general query systems

#### Summary Scheduling System
- Service: summaryManager.ts (in server/cron)
  - Purpose: Manages automated scheduling of summary generation tasks
  - Features:
    - Configurable daily summaries (default: 1 AM)
    - Configurable weekly summaries (default: Sunday 2 AM)
    - Smart scheduling for first runs
    - On-demand real-time summarization capability
  - Integration:
    - Works with advancedSummaryService
    - Coordinates proper scheduling of resource-intensive tasks
    - Implements proper error handling and recovery
    - Provides comprehensive logging for monitoring

#### Vector Embedding System
- Service: embeddingService.ts
  - Purpose: Creates vector embeddings for semantic search
  - Features:
    - Generates 1536-dimension vectors using OpenAI embeddings
    - Supports similarity search via cosine distance
    - Processes both logs and summaries
    - Batch processing for efficient API usage
  - Integration:
    - Works with logEmbeddings and summaryEmbeddings tables
    - Enables semantic search in context building
    - Powers relevant context retrieval for query interface
    - Improves response quality with targeted context

### Tables Schema Overview

#### Vector Search Tables
- logEmbeddings:
  - Purpose: Stores vector embeddings for semantic search of logs
  - Fields: id, logId, logType, embedding (vector(1536)), createdAt
  - Indexing: Uses ivfflat index with cosine similarity for fast search
  - Relations: References log entries across different log tables

- summaryEmbeddings:
  - Purpose: Stores vector embeddings for chat summaries
  - Fields: id, summaryId, embedding (vector(1536)), createdAt
  - Indexing: Uses ivfflat index with cosine similarity for fast search
  - Relations: References entries in the logSummaries table

#### Core Tables
- users:
  - Authentication data (username, email, password)
  - Profile information
  - Subscription status (isPro, isAdmin)
  - Email verification fields

- supplements:
  - Active supplement tracking
  - Dosage and frequency information
  - User associations
  - Status tracking

- healthStats:
  - User health metrics
  - Biographical data
  - Allergies and conditions

#### Tracking Tables
- supplementLogs:
  - Daily intake records
  - Effects tracking (mood, energy, sleep)
  - Timestamps and notes
  - Side effects tracking

- qualitativeLogs:
  - Chat interactions
  - Sentiment analysis
  - Metadata for analytics
  - Categorization and tagging

- query_chats:
    - General query chat interactions
    - Timestamps
    - User ID (if authenticated)


#### Reference Tables
- supplementReference:
  - Supplement name standardization
  - Category classification
  - Autocomplete support

#### Content Management
- blogPosts:
  - Educational content
  - SEO metadata
  - Publishing workflow

- researchDocuments:
  - Scientific research articles
  - Detailed content with images
  - Author attribution
  - Tags for categorization
  - Slug-based URL routing

### Data Validation & Security
- Schema validation using Drizzle-zod
- Input sanitization
- Rate limiting
- Email verification
- Two-factor authentication support

## Authentication System

### Session Management
- MemoryStore-based session storage:
  - 24-hour session duration with automatic cleanup
  - Efficient memory usage with pruning of expired entries
  - Production-ready session security with secure cookies
- Cookie Configuration:
  - Secure flag enabled in production
  - HTTP-only flags for XSS protection
  - SameSite: 'lax' for CSRF protection
  - 24-hour expiration with automatic renewal

### Authentication Flow
1. Session Initialization:
   - Express session middleware with MemoryStore
   - Secure cookie configuration with proper flags
   - Proper middleware ordering for reliable auth state

2. Passport Integration:
   - Local strategy for username/password
   - Google OAuth integration
   - Efficient session serialization/deserialization
   - Proper user data persistence

3. Request Processing:
   - Session validation and user deserialization
   - Consistent authentication state propagation
   - Context-aware response handling
   - Proper error recovery

### Security Measures
1. CORS Configuration:

#### Supplement History Routes
GET /api/supplement-logs/:date
- Retrieves all supplement logs for a specific date
- Implements UTC day boundary handling for consistent results
- Returns combined data:
  - Supplement logs for the requested date
  - Qualitative logs for the date (excluding query-type logs)
  - Daily summaries for the date
- All data is properly joined with relevant tables
- Requires authentication
- Enhanced error handling with detailed logging

#### Summary Routes
GET /api/summaries
- Retrieves all summaries for the current user
- Requires authentication
- Returns array of summary objects with metadata

POST /api/summaries/daily
- Generates a daily summary for a specific date
- Requires authentication and date parameter
- Creates a comprehensive summary of supplement intake and qualitative feedback

POST /api/summaries/weekly
- Generates a weekly summary for a date range
- Requires authentication and date range parameters
- Identifies patterns and trends across multiple days

POST /api/summaries/realtime
- Triggers immediate summarization for the current user
- Requires authentication
- Used for on-demand context building and analysis

   - Credentials properly handled
   - Essential headers allowed: Content-Type, Authorization, Cookie
   - Secure methods: GET, POST, PUT, DELETE, OPTIONS
   - Origin validation for cross-domain requests

2. Rate Limiting:
   - 100 requests per 15-minute window
   - Progressive delay after 50 requests
   - Standards-compliant headers (draft-7)

3. Middleware Chain:
   - Optimized ordering for security and performance
   - Session middleware before authentication
   - Authentication before route handlers
   - Rate limiting as final protection layer

### Debug Infrastructure
1. Authentication Verification:
   - Dedicated debug endpoints
   - Session state inspection
   - User authentication validation
   - Comprehensive error logging

2. Security Monitoring:
   - Authentication state tracking
   - Session lifecycle monitoring
   - Error recovery mechanisms
   - Performance optimization hooks

## Data Flow Architecture

### Authentication Data Flow
1. Client Request:
   - Session cookie included
   - Credentials properly transmitted
   - CORS headers respected

2. Server Processing:
   - Session validation
   - User deserialization
   - Authentication state checking
   - Request authorization

3. Response Handling:
   - Authentication-aware responses
   - Proper error states
   - Security headers included

### Data Flow
1. Chat Systems:
   - Qualitative Feedback Chat:
     - Purpose: Gather user observations about supplement experiences
     - Storage: qualitative_logs table with type='chat'
     - Context: Combines health stats, supplement logs and previous observations
     - Components: LLMChat, llmContextService, logService
   - General Query Chat (Implemented):
     - Purpose: Provide factual information about supplements
     - Storage: Uses same database tables but different context structure
     - Context: Specialized context with health stats and different system prompt
     - Components: AskPage, llmContextService_query, openaiQueryService
     - Authentication-aware: Provides personalized context for auth users

2. Supplement Management:
   - User selections stored in supplements table
   - Daily tracking stored in supplement_logs table
   - Card operations (add/edit/delete) update supplements table
   - "Save Changes" button triggers supplement_logs entry

2. Database Integration Flow:
   - Supplement card data managed in supplements table
   - Save operation triggers data storage in supplement_logs
   - History view combines data from supplement_logs and qualitative_logs

3. Chat System:
   - Interactions stored in qualitative_logs

#### Chat Summary System
- Table: chatSummaries
  - Fields: userId, summary, periodStart, periodEnd, metadata
  - Purpose: Stores condensed historical chat interactions
- Integration: 
  - Automated summarization via cron job
  - Included in LLM context building
  - Reduces token usage while maintaining context quality
  - Includes sentiment analysis and metadata


API Routes (from routes.ts)
#### AI Query Routes
POST /api/query
- Handles general supplement information queries
- Works for both authenticated and non-authenticated users
- Uses separate context building service (llmContextService_query)
- Authenticated users get personalized responses based on their health profile

#### Streak Tracking Routes
GET /api/supplement-streak
- Calculates user's current supplement logging streak
- Requires authentication
- Returns current streak count
#### Research Document Routes
GET /api/research
- Retrieves list of all research documents
- Publicly accessible
- Returns array of research document objects

GET /api/research/:slug
- Retrieves a specific research document by slug
- Publicly accessible
- Returns single research document object or 404

#### Admin Research Document Routes
POST /api/admin/research
- Creates a new research document
- Requires admin authentication
- Auto-generates slug from title

PUT /api/admin/research/:id
- Updates an existing research document
- Requires admin authentication

DELETE /api/admin/research/:id
- Deletes a research document
- Requires admin authentication

Authentication Routes
POST /api/register
Registers a new user.
Handles initial email verification token generation.
POST /api/login
Authenticates a user.
POST /api/logout
Logs out the user.
GET /api/verify-email
Handles email verification via token.
POST /api/auth/2fa/send
Initiates the two-factor authentication process.
Supplement Routes
GET /api/supplements
Retrieves a list of the user’s supplements.
POST /api/supplements
Adds a new supplement.
PUT /api/supplements/:id
Updates an existing supplement.
DELETE /api/supplements/:id
Deletes a supplement.
GET /api/supplements/search
Searches for supplements in the supplement_refference table from the rds database.
Health Stats Routes
GET /api/health-stats
Retrieves the user’s health data.
POST /api/health-stats
Updates the user’s health data.
AI Integration Routes
POST /api/chat
Sends a chat message to the AI assistant.
Passes the system prompt and user-specific progress data to the OpenAI API.
Database Schema (from schema.ts)
Core Tables
users Table:
Fields: id, username, email, password, isVerified, verificationToken, isPro (Pro/Admin status), timestamps.
supplements Table:
Fields: id, name, dosage, frequency, userId (foreign key), activeStatus, startDate, timestamps.
Relationships: Each supplement is associated with a user.
supplementLogs Table:
Fields: id, supplementId, userId, takenAt (timestamp), mood, energy, sleep, sideEffects, timestamps.
healthStats Table:
Fields: id, userId, weight, sleepPattern, heartRate, allergies (JSON array), timestamps.
Core Business Logic
Supplement Management:
Dosage tracking and frequency scheduling.
Handling active/inactive status.
Support for alternative names via a separate supplementReference table (if applicable).
Health Monitoring:
Tracking weight, sleep patterns, and other basic health metrics.
Aggregation and visualization of health data.
Data Validation & Security:
Schema validation using Drizzle-zod.
Input sanitization and rate limiting across API endpoints.
Email verification and two-factor authentication flows.
AI Integration:
The system prepares a system prompt and includes user-specific data before sending requests to the OpenAI API.
Manages the daily limit for non-paying users.
Error Handling & Logging:
Robust error handling across all routes.
Security logging and monitoring to support HIPAA compliance.

### AI Service Architecture Updates (March 2025)

#### Streaming Response Implementation
- Chat Service:
  - Converted `chatWithAI` to async generator function
  - Implemented SSE (Server-Sent Events) for real-time delivery
  - Enhanced error handling and recovery mechanisms
  - Added comprehensive chunk-level logging
  - Fixed issues with premature stream termination
  - Ensured proper completion of streaming responses
  - Resolved race conditions in stream processing

- Query Service:
  - Modified `queryWithAI` to support streaming responses
  - Implemented parallel streaming architecture to chat service
  - Added user context preservation during streaming
  - Enhanced client-side stream parsing

#### Technical Specifications
- OpenAI Integration:
  - Model: "o3-mini-2025-01-31"
  - Parameters:
    - max_completion_tokens: Controls response length
    - stream: true for real-time delivery
  - Removed legacy parameters:
    - temperature (unsupported)
    - max_tokens (replaced)
  - Enhanced Metrics and Logging:
    - Token usage estimation and tracking
    - Request and response token counting
    - Detailed chunk-level streaming logs
    - Comprehensive error diagnostics
    - Performance timing metrics

#### Response Flow
1. Client Request:
   - Initiates connection with appropriate headers
   - Sets up EventSource listener for streaming
   - Maintains connection for duration of response

2. Server Processing:
   - Configures SSE headers
   - Creates streaming response channel
   - Processes chunks via async generator
   - Maintains proper error boundaries

3. Stream Handling:
   - Word-by-word content delivery
   - Real-time UI updates
   - Proper connection closure
   - Error recovery mechanisms

#### Logging Infrastructure
- Stream Processing:
  - Chunk-level content logging
  - Timing information for each chunk
  - Error tracking and recovery
  - Performance metrics

- Client Integration:
  - SSE connection status
  - Parse success/failure
  - UI update verification
  - Error boundary activation

#### Error Handling
- Comprehensive error recovery:
  - Stream interruption handling
  - Connection dropout recovery
  - Parse error management
  - Client-side error boundaries

#### Performance Optimizations
- Efficient stream processing
- Minimal memory footprint
- Proper connection management
- Enhanced debugging capabilities

## Testing Architecture

The application uses Jest for testing core functionality with a focus on critical services.

### Test Structure
- **Location**: `server/tests/`
- **Configuration**: `jest.config.cjs` (CommonJS format for ES module compatibility)
- **Setup**: `server/tests/setup.ts` for shared testing utilities

### Core Test Suites

#### Context Building Tests
- **File**: `llmContextService.test.ts`
- **Purpose**: Verify context construction for both feedback and query systems
- **Key Tests**:
  - User context construction for feedback chat
  - Query context construction for supplement information
  - Context differences between different query types
  - Unauthenticated user handling
  - Token optimization verification

#### Embedding Service Tests
- **File**: `embeddingService.test.ts`
- **Purpose**: Test vector embedding generation and similarity search
- **Key Tests**:
  - Embedding generation for different text types
  - Vector similarity search functionality
  - Batch processing capabilities
  - Error handling and recovery

#### Summary Service Tests
- **File**: `advancedSummaryService.test.ts`
- **Purpose**: Verify summarization functionality
- **Key Tests**:
  - Daily summary generation
  - Weekly summary generation
  - Handling of different log types
  - Content extraction from summaries
  - Vector search integration

#### Scheduled Tasks Tests
- **File**: `summaryManager.test.ts`
- **Purpose**: Test the scheduling of summary generation
- **Key Tests**:
  - Daily task scheduling
  - Weekly task scheduling
  - Real-time summary triggering
  - Task cleanup and shutdown

#### OpenAI Integration Tests
- **File**: `openai.test.ts`
- **Purpose**: Verify OpenAI API integration
- **Key Tests**:
  - Chat completion generation
  - Streaming response handling
  - Error recovery mechanisms
  - Token estimation accuracy

#### Service Initialization Tests
- **File**: `serviceInitializer.test.ts`
- **Purpose**: Test service startup and shutdown
- **Key Tests**:
  - Proper initialization sequence
  - Graceful shutdown
  - Error handling during startup
  - Service verification

### Test Commands
```
npm test               # Run all tests
npm run test:watch     # Run in watch mode (auto-rerun)
npm run test:summary   # Test summary services
npm run test:embedding # Test embedding services
npm run test:context   # Test context building
npm run test:openai    # Test OpenAI integration
```

### Testing Strategies
1. **Database-Aware Testing**: Tests check for database availability and skip when unavailable
2. **Cleanup**: Test data is cleaned up after tests to avoid accumulation
3. **Mock Services**: External dependencies are mocked for reliable testing
4. **Token Estimation**: A consistent token estimation strategy is used across tests
5. **Timeouts**: Longer timeouts for API-dependent tests


### AI Service Architecture Updates (March 2025)

#### Streaming Response Implementation
- Chat Service:
  - Converted `chatWithAI` to async generator function
  - Implemented SSE (Server-Sent Events) for real-time delivery
  - Enhanced error handling and recovery mechanisms
  - Added comprehensive chunk-level logging
  - Fixed issues with premature stream termination
  - Ensured proper completion of streaming responses
  - Resolved race conditions in stream processing

- Query Service:
  - Modified `queryWithAI` to support streaming responses
  - Implemented parallel streaming architecture to chat service
  - Added user context preservation during streaming
  - Enhanced client-side stream parsing

#### Technical Specifications
- OpenAI Integration:
  - Model: "o3-mini-2025-01-31"
  - Parameters:
    - max_completion_tokens: Controls response length
    - stream: true for real-time delivery
  - Removed legacy parameters:
    - temperature (unsupported)
    - max_tokens (replaced)
  - Enhanced Metrics and Logging:
    - Token usage estimation and tracking
    - Request and response token counting
    - Detailed chunk-level streaming logs
    - Comprehensive error diagnostics
    - Performance timing metrics

#### Response Flow
1. Client Request:
   - Initiates connection with appropriate headers
   - Sets up EventSource listener for streaming
   - Maintains connection for duration of response

2. Server Processing:
   - Configures SSE headers
   - Creates streaming response channel
   - Processes chunks via async generator
   - Maintains proper error boundaries

3. Stream Handling:
   - Word-by-word content delivery
   - Real-time UI updates
   - Proper connection closure
   - Error recovery mechanisms

#### Logging Infrastructure
- Stream Processing:
  - Chunk-level content logging
  - Timing information for each chunk
  - Error tracking and recovery
  - Performance metrics

- Client Integration:
  - SSE connection status
  - Parse success/failure
  - UI update verification
  - Error boundary activation

#### Error Handling
- Comprehensive error recovery:
  - Stream interruption handling
  - Connection dropout recovery
  - Parse error management
  - Client-side error boundaries

#### Performance Optimizations
- Efficient stream processing
- Minimal memory footprint
- Proper connection management
- Enhanced debugging capabilities

### Context Building Logic

The context building service implements a sophisticated approach:

1. Authentication and User Context:
   - Properly validates user authentication state
   - Fetches health statistics for authenticated users
   - Handles anonymous users with appropriate defaults
   - Maintains consistent authentication checks

2. Vector Search Integration:
   - Uses embeddingService for semantic similarity search
   - Retrieves relevant qualitative chat logs
   - Processes daily and weekly summaries
   - Filters content based on relevance scores
   - Optimizes token usage through smart filtering

3. Content Processing:
   - Combines multiple content types:
     - Recent daily summaries
     - Relevant historical summaries
     - Qualitative observations
     - Quantitative supplement logs
   - Formats content with proper date information
   - Maintains context hierarchy for better responses

4. Debug Infrastructure:
   - Generates detailed debug logs
   - Tracks context components and flags
   - Analyzes token usage
   - Monitors content relevance
   - Provides comprehensive error tracking

5. Context Assembly:
   - Constructs properly formatted messages array
   - Includes system prompt with user context
   - Maintains conversation history when relevant
   - Optimizes context for token efficiency
   - Ensures proper content ordering