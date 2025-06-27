/**
 * @hruf/utils - Shared utility functions for HRUF web and mobile applications
 * 
 * This package provides platform-agnostic utility functions that can be used
 * across web and mobile applications. All functions are pure and don't depend
 * on platform-specific APIs like Node.js filesystem or browser DOM.
 * 
 * @version 1.0.0
 */

// String utilities
export {
  cn,
  normalizeVitaminName,
  capitalize,
  toTitleCase,
  truncate,
  cleanWhitespace,
  toKebabCase,
  toCamelCase,
  generateRandomString
} from './string';

// Date utilities
export {
  safeDate,
  formatDate,
  getUtcDayBoundary,
  isValidDate as isValidDateUtil,
  getSummaryDateRange,
  getDaysDifference,
  addDays,
  isToday,
  isPast,
  isFuture,
  getStartOfWeek,
  getEndOfWeek
} from './date';

// Mathematical utilities
export {
  clamp,
  round,
  percentage,
  average,
  sum,
  median,
  mode,
  standardDeviation,
  range,
  randomBetween,
  randomIntBetween,
  degreesToRadians,
  radiansToDegrees,
  distance2D,
  calculateBMI,
  categorizeBMI,
  lerp,
  mapRange
} from './math';

// Validation utilities
export {
  isRequired,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidLength,
  isValidRange,
  isStrongPassword,
  isValidDate,
  isValidCreditCard,
  combineValidations,
  sanitizeHtml,
  validateAndSanitize,
  type ValidationResult
} from './validation';

// Data structures and algorithms
export {
  levenshteinDistance,
  Trie,
  LRUCache,
  type TrieSearchable
} from './data-structures';

// Re-export commonly used external dependencies for convenience
export { type ClassValue } from 'clsx';

/**
 * Package metadata
 */
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@hruf/utils';

/**
 * Common constants used across the application
 */
export const CONSTANTS = {
  // Date formats
  DATE_FORMATS: {
    ISO: 'iso',
    LOCAL: 'local',
    TIME: 'time'
  } as const,
  
  // BMI categories
  BMI_CATEGORIES: {
    UNDERWEIGHT: 'Underweight',
    NORMAL: 'Normal weight',
    OVERWEIGHT: 'Overweight',
    OBESE: 'Obese'
  } as const,
  
  // Common validation limits
  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 100,
    PHONE_DIGITS: 10,
    PHONE_DIGITS_WITH_COUNTRY: 11
  } as const,
  
  // Mathematical constants
  MATH: {
    GOLDEN_RATIO: 1.618033988749,
    PI: Math.PI,
    E: Math.E
  } as const
} as const;

/**
 * Utility type helpers
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Common error types
 */
export class ValidationError extends Error {
  public readonly errors: string[];
  
  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Utility functions for working with objects
 */
export const objectUtils = {
  /**
   * Checks if an object is empty (has no own properties)
   */
  isEmpty: (obj: object): boolean => {
    return Object.keys(obj).length === 0;
  },
  
  /**
   * Deep clones an object (simple implementation)
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as T;
    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = objectUtils.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  },
  
  /**
   * Safely gets a nested property value
   */
  get: <T>(obj: any, path: string, defaultValue?: T): T | undefined => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },
  
  /**
   * Removes properties with null or undefined values
   */
  compact: <T extends Record<string, any>>(obj: T): Partial<T> => {
    const result: Partial<T> = {};
    
    for (const key in obj) {
      if (obj[key] != null) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }
};

/**
 * Utility functions for working with arrays
 */
export const arrayUtils = {
  /**
   * Removes duplicates from an array
   */
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },
  
  /**
   * Groups array items by a key function
   */
  groupBy: <T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> => {
    const result = {} as Record<K, T[]>;
    
    for (const item of array) {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    
    return result;
  },
  
  /**
   * Chunks an array into smaller arrays of specified size
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    
    return chunks;
  },
  
  /**
   * Shuffles an array (Fisher-Yates shuffle)
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
};