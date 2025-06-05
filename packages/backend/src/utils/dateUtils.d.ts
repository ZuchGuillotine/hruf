/**
 * Utility functions for consistent date handling across the application
 */
/**
 * Creates a Date object from a potentially null timestamp
 * @param timestamp The timestamp to convert
 * @param defaultValue Optional default value if timestamp is null
 * @returns Date object or null
 */
export declare function safeDate(
  timestamp: Date | string | null,
  defaultValue?: Date | null
): Date | null;
/**
 * Formats a date for display, handling null values
 * @param date The date to format
 * @param format The format to use (default: toLocaleDateString)
 * @returns Formatted date string or placeholder
 */
export declare function formatDate(date: Date | null, format?: 'local' | 'iso' | 'time'): string;
/**
 * Creates a UTC date boundary for the given date
 * @param date The date to get boundaries for
 * @param boundary Start or end of day
 * @returns Date object set to start or end of UTC day
 */
export declare function getUtcDayBoundary(date: Date, boundary: 'start' | 'end'): Date;
/**
 * SQL helper for date range queries
 * @param field The database field to compare
 * @param startDate Start of range
 * @param endDate End of range
 * @returns SQL query part for date range
 */
export declare function dateRangeSql(
  field: string,
  startDate: Date,
  endDate: Date
): import('drizzle-orm').SQL<unknown>;
/**
 * Validates if a date is within acceptable range
 * @param date The date to validate
 * @param options Validation options
 * @returns true if date is valid and within range
 */
export declare function isValidDate(
  date: Date | null,
  options?: {
    minDate?: Date;
    maxDate?: Date;
    allowNull?: boolean;
  }
): boolean;
/**
 * Gets the date range for a summary period
 * @param period The period type
 * @param referenceDate The reference date (defaults to now)
 * @returns Object with start and end dates
 */
export declare function getSummaryDateRange(
  period: 'daily' | 'weekly',
  referenceDate?: Date
): {
  startDate: Date;
  endDate: Date;
};
//# sourceMappingURL=dateUtils.d.ts.map
