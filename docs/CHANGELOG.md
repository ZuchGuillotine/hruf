# Changelog

## [March 2025]
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