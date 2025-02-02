4. Backend Structures Document
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
