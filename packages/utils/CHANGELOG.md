# Changelog

All notable changes to the @hruf/utils package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-26

### Added

#### String Utilities
- `cn()` - Class name combining with Tailwind CSS support using clsx and tailwind-merge
- `normalizeVitaminName()` - Supplement name normalization for consistent searching
- `capitalize()` - First letter capitalization
- `toTitleCase()` - Title case conversion
- `truncate()` - String truncation with custom suffix support
- `toKebabCase()` - kebab-case conversion
- `toCamelCase()` - camelCase conversion
- `cleanWhitespace()` - Whitespace normalization
- `generateRandomString()` - Random string generation with custom character sets

#### Date Utilities
- `safeDate()` - Safe date creation with fallback handling
- `formatDate()` - Multiple date format options (local, ISO, time)
- `getUtcDayBoundary()` - UTC day start/end boundary calculations
- `isValidDateUtil()` - Date validation with range constraints
- `getSummaryDateRange()` - Predefined date ranges (daily, weekly)
- `getDaysDifference()` - Days calculation between dates
- `addDays()` - Date arithmetic for adding/subtracting days
- `isToday()`, `isPast()`, `isFuture()` - Date comparison utilities
- `getStartOfWeek()`, `getEndOfWeek()` - Week boundary calculations

#### Mathematical Utilities
- `clamp()` - Number clamping between min/max values
- `round()` - Decimal place rounding
- `percentage()` - Percentage calculations
- `average()`, `median()`, `mode()` - Statistical functions
- `sum()`, `range()`, `standardDeviation()` - Array mathematical operations
- `randomBetween()`, `randomIntBetween()` - Random number generation
- `degreesToRadians()`, `radiansToDegrees()` - Angle conversions
- `distance2D()` - 2D distance calculations
- `calculateBMI()`, `categorizeBMI()` - Health metric calculations
- `lerp()`, `mapRange()` - Interpolation and value mapping

#### Validation Utilities
- `isRequired()` - Required field validation
- `isValidEmail()` - Email format validation with regex
- `isValidPhone()` - US phone number format validation
- `isValidUrl()` - URL format validation
- `isValidLength()` - String length constraints
- `isValidRange()` - Numeric range validation
- `isStrongPassword()` - Password strength validation with customizable rules
- `isValidDate()` - Date validation with past/future constraints
- `isValidCreditCard()` - Credit card validation using Luhn algorithm
- `combineValidations()` - Multiple validation result combination
- `sanitizeHtml()` - HTML content sanitization
- `validateAndSanitize()` - Combined validation and sanitization
- `ValidationResult` interface for consistent validation responses

#### Data Structures
- `Trie<T>` - Generic trie implementation with fuzzy search capabilities
- `LRUCache<K, V>` - Least Recently Used cache implementation
- `levenshteinDistance()` - Edit distance calculation for string similarity
- `TrieSearchable` interface for trie-compatible objects

#### Object and Array Utilities
- `objectUtils.isEmpty()` - Empty object checking
- `objectUtils.deepClone()` - Deep object cloning
- `objectUtils.get()` - Safe nested property access
- `objectUtils.compact()` - Null/undefined property removal
- `arrayUtils.unique()` - Array deduplication
- `arrayUtils.groupBy()` - Array grouping by key function
- `arrayUtils.chunk()` - Array chunking into smaller arrays
- `arrayUtils.shuffle()` - Fisher-Yates array shuffling

#### Error Types
- `ValidationError` - Custom error for validation failures
- `NotFoundError` - Custom error for missing resources

#### Constants and Types
- `CONSTANTS` object with common application constants
- `DeepPartial<T>`, `NonNullable<T>`, `KeysOfType<T, U>` utility types
- Package metadata exports (`VERSION`, `PACKAGE_NAME`)

### Technical Details
- Full TypeScript support with comprehensive type definitions
- ESM module support with tree-shaking optimization
- Platform-agnostic implementation (no Node.js or browser-specific APIs)
- Modular exports for selective importing
- Jest testing setup with 80% coverage target
- ESLint configuration for code quality
- Comprehensive documentation with examples

### Dependencies
- `clsx` ^2.1.1 - Class name utility
- `tailwind-merge` ^2.5.4 - Tailwind CSS class merging

### Development Dependencies
- TypeScript ^5.6.3
- Jest ^29.7.0
- ts-jest ^29.2.6
- @types/jest ^29.5.14

---

## Future Releases

### Planned for 1.1.0
- Additional mathematical functions (complex numbers, matrices)
- More data structures (priority queue, binary search tree)
- Internationalization utilities
- Advanced string manipulation functions
- Performance optimizations

### Planned for 1.2.0
- Color manipulation utilities
- File format validation
- Advanced date/time utilities with timezone support
- Encryption/hashing utilities (platform-agnostic)
- Enhanced validation with custom rule engines