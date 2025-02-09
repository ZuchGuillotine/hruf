# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Enhanced navigation in supplement history page
  - Back to tracking button for better UX
  - Improved routing between dashboard and history
- Blog post management system
  - Complete CRUD operations for blog posts
  - Admin dashboard interface
  - Public blog/learn section
  - SEO-friendly URLs with slugs
- Rich text editing capabilities
- Thumbnail URL support for blog posts
- Responsive grid layout for blog listing
- Loading states and error handling
- Protected admin routes
- Blog post schema with proper timestamps
- Supplemental RDS database integration for enhanced data storage
- Google OAuth authentication system (in progress)
  - Support for both login and signup flows
  - Passport.js Google Strategy implementation

### Changed
- Updated frontend routing to include blog management
- Enhanced admin dashboard layout
- Improved data consistency between admin and public views
- Modified authentication system to support multiple strategies
- Updated database connection to use supplemental RDS

### Fixed
- Blog post schema implementation
- Data synchronization between admin dashboard and public views
- API endpoint authentication checks

### Known Issues
- Google OAuth authentication experiencing 403 errors
- Need to finalize callback URL configuration for Google authentication

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