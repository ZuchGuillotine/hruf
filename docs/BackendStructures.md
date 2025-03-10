# Backend Structures Document

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
  - Integration:
    - Works with logSummaries table
    - Provides context to both chat systems
    - Reduces token usage in LLM calls
    - Improves relevance of AI responses

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