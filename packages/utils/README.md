# @hruf/utils

A comprehensive collection of platform-agnostic utility functions designed for cross-platform use between web and mobile applications in the HRUF ecosystem.

## Features

- 🌐 **Platform Agnostic**: Works seamlessly across web and mobile platforms
- 📦 **Tree Shakeable**: Import only what you need
- 🔒 **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested**: High test coverage with comprehensive test suites
- 📚 **Well Documented**: Extensive documentation with examples
- 🚀 **Performance Optimized**: Efficient algorithms and data structures

## Installation

```bash
npm install @hruf/utils
```

## Quick Start

```typescript
import { cn, formatDate, isValidEmail, calculateBMI } from '@hruf/utils';

// String utilities
const className = cn('base-class', isActive && 'active', 'text-lg');

// Date utilities
const formattedDate = formatDate(new Date(), 'local');

// Validation utilities
const emailValidation = isValidEmail('user@example.com');

// Math utilities
const bmi = calculateBMI(70, 1.75); // weight in kg, height in m
```

## Modules

### String Utilities

Functions for string manipulation and CSS class handling:

```typescript
import { cn, capitalize, truncate, toKebabCase } from '@hruf/utils';

// Class name merging (with Tailwind CSS support)
const className = cn('px-4 py-2', isActive && 'bg-blue-500');

// String formatting
const title = capitalize('hello world'); // "Hello world"
const slug = toKebabCase('Hello World'); // "hello-world"
const preview = truncate('Long text here...', 20); // "Long text here..."
```

**Available Functions:**
- `cn()` - Combines class names with Tailwind CSS deduplication
- `capitalize()` - Capitalizes first letter
- `toTitleCase()` - Converts to title case
- `truncate()` - Truncates string with ellipsis
- `toKebabCase()` - Converts to kebab-case
- `toCamelCase()` - Converts to camelCase
- `cleanWhitespace()` - Normalizes whitespace
- `generateRandomString()` - Generates random strings
- `normalizeVitaminName()` - Normalizes supplement names

### Date Utilities

Comprehensive date manipulation functions:

```typescript
import { formatDate, addDays, isToday, getSummaryDateRange } from '@hruf/utils';

// Safe date creation and formatting
const date = safeDate('2023-01-01');
const formatted = formatDate(date, 'local');

// Date calculations
const futureDate = addDays(new Date(), 7);
const isCurrentDay = isToday(new Date());

// Date ranges
const { startDate, endDate } = getSummaryDateRange('weekly');
```

**Available Functions:**
- `safeDate()` - Safe date creation with fallbacks
- `formatDate()` - Multiple date format options
- `addDays()` - Add/subtract days from dates
- `getDaysDifference()` - Calculate days between dates
- `isToday()`, `isPast()`, `isFuture()` - Date comparison utilities
- `getStartOfWeek()`, `getEndOfWeek()` - Week boundary calculations
- `getUtcDayBoundary()` - UTC day start/end
- `getSummaryDateRange()` - Predefined date ranges

### Mathematical Utilities

Mathematical functions and calculations:

```typescript
import { clamp, percentage, average, calculateBMI, distance2D } from '@hruf/utils';

// Number utilities
const clamped = clamp(15, 1, 10); // 10
const percent = percentage(25, 100); // 25.0
const avg = average([1, 2, 3, 4, 5]); // 3

// Health calculations
const bmi = calculateBMI(70, 1.75); // 22.86
const category = categorizeBMI(bmi); // "Normal weight"

// Geometric calculations  
const dist = distance2D(0, 0, 3, 4); // 5
```

**Available Functions:**
- `clamp()`, `round()` - Number constraints and rounding
- `average()`, `median()`, `mode()` - Statistical functions
- `sum()`, `range()`, `standardDeviation()` - Array calculations
- `percentage()` - Percentage calculations
- `randomBetween()`, `randomIntBetween()` - Random number generation
- `calculateBMI()`, `categorizeBMI()` - Health calculations
- `degreesToRadians()`, `radiansToDegrees()` - Angle conversions
- `distance2D()` - 2D distance calculations
- `lerp()`, `mapRange()` - Interpolation and mapping

### Validation Utilities

Comprehensive validation functions:

```typescript
import { 
  isValidEmail, 
  isStrongPassword, 
  isValidPhone, 
  combineValidations 
} from '@hruf/utils';

// Individual validations
const emailCheck = isValidEmail('user@example.com');
const passwordCheck = isStrongPassword('MySecurePass123!');
const phoneCheck = isValidPhone('(555) 123-4567');

// Combined validation
const allValidations = combineValidations([
  emailCheck,
  passwordCheck,
  phoneCheck
]);

if (allValidations.isValid) {
  // All validations passed
} else {
  console.log(allValidations.errors); // Array of error messages
}
```

**Available Functions:**
- `isRequired()` - Required field validation
- `isValidEmail()` - Email format validation
- `isValidPhone()` - Phone number validation (US format)
- `isValidUrl()` - URL format validation
- `isValidLength()` - String length validation
- `isValidRange()` - Numeric range validation
- `isStrongPassword()` - Password strength validation
- `isValidDate()` - Date validation with range options
- `isValidCreditCard()` - Credit card validation (Luhn algorithm)
- `combineValidations()` - Combine multiple validation results
- `sanitizeHtml()` - HTML sanitization
- `validateAndSanitize()` - Combined validation and sanitization

### Data Structures

Efficient data structures and algorithms:

```typescript
import { Trie, LRUCache, levenshteinDistance } from '@hruf/utils';

// Trie for efficient prefix searching
const trie = new Trie<{ name: string; id: number }>();
trie.insert('vitamin d', { name: 'Vitamin D3', id: 1 });
trie.insert('vitamin b12', { name: 'Vitamin B12', id: 2 });

const results = trie.search('vit'); // Returns matching items

// LRU Cache for performance optimization
const cache = new LRUCache<string, any>(100);
cache.set('key', 'value');
const value = cache.get('key');

// String similarity
const distance = levenshteinDistance('kitten', 'sitting'); // 3
```

**Available Classes and Functions:**
- `Trie<T>` - Generic trie data structure with fuzzy search
- `LRUCache<K, V>` - Least Recently Used cache implementation
- `levenshteinDistance()` - Edit distance calculation for fuzzy matching

### Object and Array Utilities

Additional utilities for common operations:

```typescript
import { objectUtils, arrayUtils } from '@hruf/utils';

// Object utilities
const isEmpty = objectUtils.isEmpty({}); // true
const cloned = objectUtils.deepClone(originalObject);
const value = objectUtils.get(obj, 'nested.path', 'default');

// Array utilities
const unique = arrayUtils.unique([1, 2, 2, 3]); // [1, 2, 3]
const grouped = arrayUtils.groupBy(users, user => user.role);
const chunks = arrayUtils.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
const shuffled = arrayUtils.shuffle([1, 2, 3, 4, 5]);
```

## Tree Shaking

This package is optimized for tree shaking. You can import individual functions to reduce bundle size:

```typescript
// Import specific functions
import { cn } from '@hruf/utils/string';
import { formatDate } from '@hruf/utils/date';
import { isValidEmail } from '@hruf/utils/validation';

// Or import from specific modules
import { cn, capitalize } from '@hruf/utils/string';
import { clamp, average } from '@hruf/utils/math';
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { ValidationResult, TrieSearchable } from '@hruf/utils';

// Type-safe validation results
const result: ValidationResult = isValidEmail('test@example.com');

// Generic data structures
interface Supplement extends TrieSearchable {
  name: string;
  dosage: number;
  brand: string;
}

const supplementTrie = new Trie<Supplement>();
```

## Error Handling

The package includes custom error types for better error handling:

```typescript
import { ValidationError, NotFoundError } from '@hruf/utils';

try {
  // Some operation that might fail
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.errors);
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found:', error.message);
  }
}
```

## Constants

Common constants are provided for consistency:

```typescript
import { CONSTANTS } from '@hruf/utils';

// Date formats
const format = CONSTANTS.DATE_FORMATS.ISO;

// Validation limits
const maxLength = CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH;

// BMI categories
const category = CONSTANTS.BMI_CATEGORIES.NORMAL;
```

## Testing

The package includes comprehensive tests. To run tests in your own project:

```bash
npm test
```

Coverage reports are generated automatically and aim for >80% coverage across all metrics.

## Platform Compatibility

- ✅ **Web Browsers** - All modern browsers
- ✅ **Node.js** - Version 16+ 
- ✅ **React Native** - All versions
- ✅ **Expo** - All versions
- ✅ **Next.js** - All versions
- ✅ **Vite** - All versions

## Contributing

This package is part of the HRUF monorepo. Please refer to the main repository's contributing guidelines.

## License

MIT License - see the LICENSE file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.