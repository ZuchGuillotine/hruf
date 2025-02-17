# HIPAA-Compliant Supplement Tracking Application

## Project Overview
A cutting-edge health tracking and content management application that combines intelligent health recommendations with robust user experience features. The application provides secure, comprehensive health supplement tracking and AI-powered content creation tools with a focus on user privacy, data integrity, and seamless interaction.

## Technical Stack
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database Architecture**:
  - **Consolidated Database (NeonDB)**:
    - User authentication and profiles
    - Health statistics
    - Blog content management
    - Supplement selections and tracking
    - Chat interaction history
    - Supplement reference data
    - Daily supplement logs
- **Authentication**: 
  - Passport.js with session-based auth
  - Google OAuth integration (currently in troubleshooting)
- **AI Integration**: OpenAI GPT-4 for intelligent health insights
- **Email Service**: SendGrid for verification emails (functional with basic features)
- **Development Tools**: Drizzle ORM, TanStack Query, Wouter routing

## Data Flow Architecture
### Supplement Management Flow:
- User selections stored in supplements table
- Daily tracking stored in supplement_logs table
- Card operations (add/edit/delete) update supplements table
- "Save Changes" button triggers supplement_logs entry

### Database Integration Flow:
- Supplement card data managed in supplements table
- Save operation triggers data storage in supplement_logs
- History view combines data from unified database:
  - Logs from supplement_logs table
  - Notes from interactions stored in qualitative_logs table

### Database Schema Overview
#### NeonDB Tables:
1. **users**:
   - Core user authentication data
   - Profile information
   - Admin privileges tracking
   - Email verification status

2. **supplements**:
   - User's persistent supplement selections
   - Basic supplement information
   - Active/inactive status tracking

3. **healthStats**:
   - User health metrics
   - Historical health data
   - Tracking of various health indicators

4. **blogPosts**:
   - Content management system
   - Health-related articles and resources

5. **supplementLogs**:
   - Tracks daily supplement intake
   - Fields: id, supplementId, userId, takenAt, notes, effects (JSON)
   - Includes mood, energy, sleep tracking
   - Timestamps for creation and updates

6. **qualitativeLogs**:
   - Stores chat interactions and AI responses
   - Fields: id, userId, content, type, tags (JSON)
   - Includes sentiment analysis scores
   - Metadata for enhanced tracking

7. **supplementReference**:
   - Powers autocomplete functionality
   - Fields: id, name, category
   - Unique constraints on supplement names
   - Timestamps for data management

## Implemented Features

### Authentication & User Management
- Secure user registration and login system
- Session-based authentication with Passport.js
- Profile management with user details and preferences
- Pro account toggle functionality
- Email verification system (functional with basic features):
  - Verification token generation
  - Token expiration handling (24-hour validity)
  - Secure verification flow
  - User-friendly verification UI

### Core Supplement Management
- Add, view, and delete supplements
- Advanced fuzzy search functionality:
  - Levenshtein distance algorithm for typo tolerance
  - Special handling for common vitamin name variations
  - Dynamic search distance based on word length
  - Normalized supplement name matching
- Detailed supplement information tracking:
  - Name, dosage, and frequency
  - Notes and additional details
  - Active/inactive status tracking

### Health Statistics
- Comprehensive health metrics tracking:
  - Weight tracking
  - Sleep analysis
  - Allergies logging
  - Profile photo management
- Visual health overview dashboard
- Detailed health statistics page

### AI Assistant Integration
- Real-time chat interface with AI
- Contextual health and supplement advice
- Research-backed supplement information
- Interactive chat UI with loading states

### User Interface
- Responsive dashboard layout
- Navigation header with user dropdown
- Professional dark forest green theme
- Mobile-friendly design
- Intuitive form layouts

### Legal Compliance & Privacy
- Comprehensive Terms of Service page
- Detailed Privacy Policy
- HIPAA-compliant data handling
- GDPR-compliant cookie consent mechanism:
  - User choice persistence
  - Accept/Decline options
  - Clear explanation of cookie usage
  - Link to Privacy Policy

## Current Development Status

### Active Development
1. Google OAuth Integration
   - Currently troubleshooting authentication issues
   - Callback URL configuration under review
   - Environment variables and secrets configuration needs verification

2. Email System
   - SendGrid integration functional with basic features
   - Basic email verification working
   - Enhanced functionality planned but low priority

3. Database Integration
   - Primary Database (NeonDB): ✅ Fully operational
     - Successfully handling user authentication
     - Managing health statistics
     - Storing user supplement selections
   - Secondary Database (RDS): Needs trouble shooting
     - storing supplement logs (connection failing)
     - Chat interaction logs with enhanced metadata
     - Autocomplete functionality for supplement search

### Known Issues
1. Google OAuth authentication experiencing authorization failures
2. Need to implement more comprehensive audit logging

## Next Steps

### Feature Enhancements
1. **Notifications System**
   - Implement supplement intake reminders
   - Add advanced email notifications
   - Push notifications for mobile devices

2. **Advanced Analytics**
   - Implement data visualization with Recharts
   - Add trend analysis for health metrics
   - Create supplement effectiveness reports

3. **Mobile Optimization**
   - Enhance responsive design
   - Add PWA capabilities
   - Implement mobile-specific features

4. **Pro Features**
   - Implement Stripe payment integration
   - Add premium features for pro users
   - Enhanced data export capabilities

### Technical Improvements
1. **Testing**
   - Add unit tests for components
   - Implement E2E testing
   - Add API integration tests

2. **Performance**
   - Implement data caching
   - Optimize database queries
   - Add lazy loading for components

3. **Security**
   - Add 2FA support
   - Implement rate limiting
   - Enhanced HIPAA compliance measures

4. **Infrastructure**
   - Set up CI/CD pipeline
   - Add error monitoring
   - Implement comprehensive logging system

## Deployment Considerations
- Set up proper environment variables
- Configure production database
- Set up monitoring and logging
- Implement backup strategy
- Set up CDN for blog assets
- Implement proper SSL/TLS
- Configure proper CORS policies

This document reflects the current state of the application as of February 13, 2025, and serves as the primary reference for ongoing development and future enhancements.