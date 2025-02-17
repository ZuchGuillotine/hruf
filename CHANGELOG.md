# Changelog

## [1.0.1] - 2025-02-17
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
