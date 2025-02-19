
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-02-17
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
