# Backend Structures Document

## Database Structure

### Primary Database (NeonDB)
- Location: Replit PostgreSQL
- Purpose: Core user data and persistent supplement selections
- Tables:
  - users: User authentication and profiles
  - supplements: User's persistent supplement selections (CRUD operations for supplement tracking card)
  - health_stats: User health data
  - blog_posts: Content management

### Tracking Database (AWS RDS)
- Location: AWS RDS PostgreSQL
- Purpose: Historical tracking and qualitative data
- Tables:
  - supplement_logs: Daily supplement intake records
    - Enhanced with real-time synchronization
    - Implements overwrite logic for same-day entries
  - qualitative_logs: Chat interactions and AI responses
  - supplement_reference: Used for supplement autocomplete functionality
    - Fields:
      - id: SERIAL PRIMARY KEY
      - name: TEXT NOT NULL UNIQUE
      - category: TEXT NOT NULL DEFAULT 'General'
      - created_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      - updated_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  - supplement_logs: Stores user supplement intake tracking
    - Fields:
      - id: SERIAL PRIMARY KEY
      - supplement_id: INTEGER NOT NULL
      - user_id: INTEGER NOT NULL
      - taken_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      - notes: TEXT
      - effects: JSONB DEFAULT '{}'
      - created_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      - updated_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  - qualitative_logs: Stores chat and other qualitative data
    - Fields:
      - id: SERIAL PRIMARY KEY
      - user_id: INTEGER NOT NULL
      - content: TEXT NOT NULL
      - logged_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      - type: TEXT NOT NULL
      - tags: JSONB DEFAULT '[]'
      - sentiment_score: INTEGER
      - metadata: JSONB DEFAULT '{}'
      - created_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      - updated_at: TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP


### Data Flow
1. Supplement Management:
   - User selections stored in NeonDB supplements table
   - Daily tracking stored in RDS supplement_logs table
   - Card operations (add/edit/delete) update NeonDB
   - "Save Changes" button triggers RDS supplement_logs entry
   - Real-time UI updates via query invalidation

2. Database Integration Flow:
   - Supplement card data managed in NeonDB supplements table
   - Save operation triggers data storage in RDS supplement_logs
   - History view combines data from both databases:
     - Logs from RDS supplement_logs
     - Supplement details from NeonDB supplements
     - Data enrichment happens server-side
   - Automatic query invalidation ensures UI consistency

3. Real-time Updates:
   - useSupplements hook manages state:
     - Invalidates supplement queries on changes
     - Invalidates supplement logs for current date
     - Ensures history view stays current
   - Implemented in add/update/delete operations
   - Prevents stale data display

4. Chat System:
   - Interactions stored in RDS qualitative_logs
   - Requires UI verification components

## Code Structure Updates
- Enhanced useSupplements hook with query invalidation
- Improved RDS connection handling
- Added overwrite logic for same-day supplement logs
- Implemented proper error handling and logging

API Routes (from routes.ts)
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
Searches for supplements in the central database.
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