# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Verified complete database functionality:
  - Supplement tracking system operational with proper data persistence
  - Chat logging system successfully storing all AI interactions
  - Qualitative logs storing comprehensive metadata
  - PostgreSQL WAL (Write-Ahead Logging) confirmed operational
- Enhanced navigation in supplement history page
  - Back to tracking button for better UX
  - Improved routing between dashboard and history

### Changed
- Improved public pages routing and layout
  - Fixed routing paths for Terms of Service and Privacy Policy
  - Corrected header component usage for non-authenticated pages
  - Enhanced authentication flow to properly handle public routes
  - Improved page layout consistency for public pages
- Updated frontend routing to include blog management
- Enhanced admin dashboard layout
- Improved data consistency between admin and public views
- Modified authentication system to support multiple strategies
- Updated database connection to use supplemental RDS

### Fixed
- Public routes accessibility issues:
  - Corrected route naming inconsistencies
  - Fixed duplicate header/footer display
  - Resolved auth form visibility on public pages
  - Improved route handling for non-authenticated users
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