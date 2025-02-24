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

### Data Flow
1. Chat Systems:
   - Qualitative Feedback Chat:
     - Purpose: Gather user observations about supplement experiences
     - Storage: qualitative_logs table with type='chat'
     - Context: Combines supplement logs and previous observations
     - Components: LLMChat, llmContextService, logService
   - (Planned) General Query Chat:
     - Separate interface for supplement information queries
     - Will use shared context but different prompt structure
     - Implementation pending

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

### Tables Schema Overview

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

### Data Validation & Security
- Schema validation using Drizzle-zod
- Input sanitization
- Rate limiting
- Email verification
- Two-factor authentication support

API Routes (from routes.ts)
#### Streak Tracking Routes
GET /api/supplement-streak
- Calculates user's current supplement logging streak
- Requires authentication
- Returns current streak count
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