/**
 * Utility functions for consistent date handling across web and mobile platforms
 * These functions are platform-agnostic and don't depend on Node.js or browser APIs
 */

/**
 * Creates a Date object from a potentially null timestamp
 * @param timestamp - The timestamp to convert
 * @param defaultValue - Optional default value if timestamp is null
 * @returns Date object or null
 * 
 * @example
 * ```ts
 * safeDate("2023-01-01") // Returns: Date object
 * safeDate(null, new Date()) // Returns: current Date
 * safeDate("invalid") // Returns: null
 * ```
 */
export function safeDate(timestamp: Date | string | null, defaultValue: Date | null = null): Date | null {
  if (!timestamp) return defaultValue;
  
  try {
    const date = new Date(timestamp);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return defaultValue;
    }
    return date;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Formats a date for display, handling null values
 * @param date - The date to format
 * @param format - The format to use
 * @returns Formatted date string or placeholder
 * 
 * @example
 * ```ts
 * formatDate(new Date(), 'local') // Returns: "1/1/2023"
 * formatDate(new Date(), 'iso') // Returns: "2023-01-01T00:00:00.000Z"
 * formatDate(null) // Returns: "Not specified"
 * ```
 */
export function formatDate(date: Date | null, format: 'local' | 'iso' | 'time' = 'local'): string {
  if (!date) return 'Not specified';
  
  try {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'time':
        return date.toLocaleTimeString();
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Creates a UTC date boundary for the given date
 * @param date - The date to get boundaries for
 * @param boundary - Start or end of day
 * @returns Date object set to start or end of UTC day
 * 
 * @example
 * ```ts
 * const date = new Date('2023-01-01T15:30:00');
 * getUtcDayBoundary(date, 'start') // Returns: 2023-01-01T00:00:00.000Z
 * getUtcDayBoundary(date, 'end') // Returns: 2023-01-01T23:59:59.999Z
 * ```
 */
export function getUtcDayBoundary(date: Date, boundary: 'start' | 'end'): Date {
  const utcDate = new Date(date);
  
  if (boundary === 'start') {
    utcDate.setUTCHours(0, 0, 0, 0);
  } else {
    utcDate.setUTCHours(23, 59, 59, 999);
  }
  
  return utcDate;
}

/**
 * Validates if a date is within acceptable range
 * @param date - The date to validate
 * @param options - Validation options
 * @returns true if date is valid and within range
 * 
 * @example
 * ```ts
 * isValidDate(new Date()) // Returns: true
 * isValidDate(null, { allowNull: true }) // Returns: true
 * isValidDate(new Date('2025-01-01'), { maxDate: new Date() }) // Returns: false
 * ```
 */
export function isValidDate(
  date: Date | null,
  options: { 
    minDate?: Date,
    maxDate?: Date,
    allowNull?: boolean 
  } = {}
): boolean {
  if (!date) return !!options.allowNull;
  
  const timestamp = date.getTime();
  if (isNaN(timestamp)) return false;
  
  if (options.minDate && timestamp < options.minDate.getTime()) return false;
  if (options.maxDate && timestamp > options.maxDate.getTime()) return false;
  
  return true;
}

/**
 * Gets the date range for a summary period
 * @param period - The period type
 * @param referenceDate - The reference date (defaults to now)
 * @returns Object with start and end dates
 * 
 * @example
 * ```ts
 * getSummaryDateRange('daily') // Returns: { startDate: start of today, endDate: end of today }
 * getSummaryDateRange('weekly') // Returns: { startDate: 7 days ago, endDate: end of today }
 * ```
 */
export function getSummaryDateRange(
  period: 'daily' | 'weekly',
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const endDate = getUtcDayBoundary(referenceDate, 'end');
  const startDate = new Date(endDate);
  
  if (period === 'weekly') {
    startDate.setDate(startDate.getDate() - 7);
    startDate.setUTCHours(0, 0, 0, 0);
  } else {
    startDate.setUTCHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}

/**
 * Calculates the difference between two dates in days
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates (can be negative)
 * 
 * @example
 * ```ts
 * const date1 = new Date('2023-01-01');
 * const date2 = new Date('2023-01-05');
 * getDaysDifference(date1, date2) // Returns: 4
 * getDaysDifference(date2, date1) // Returns: -4
 * ```
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Adds or subtracts days from a date
 * @param date - The base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added/subtracted
 * 
 * @example
 * ```ts
 * const date = new Date('2023-01-01');
 * addDays(date, 5) // Returns: 2023-01-06
 * addDays(date, -3) // Returns: 2022-12-29
 * ```
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if a date is today
 * @param date - The date to check
 * @returns true if the date is today
 * 
 * @example
 * ```ts
 * isToday(new Date()) // Returns: true
 * isToday(new Date('2023-01-01')) // Returns: false (unless today is 2023-01-01)
 * ```
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Checks if a date is in the past
 * @param date - The date to check
 * @returns true if the date is before now
 * 
 * @example
 * ```ts
 * isPast(new Date('2023-01-01')) // Returns: true (assuming current date is after 2023-01-01)
 * isPast(new Date('2030-01-01')) // Returns: false
 * ```
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Checks if a date is in the future
 * @param date - The date to check
 * @returns true if the date is after now
 * 
 * @example
 * ```ts
 * isFuture(new Date('2030-01-01')) // Returns: true
 * isFuture(new Date('2023-01-01')) // Returns: false (assuming current date is after 2023-01-01)
 * ```
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Gets the start of the week for a given date
 * @param date - The date to get the week start for
 * @param startOfWeek - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns Date representing start of week
 * 
 * @example
 * ```ts
 * const date = new Date('2023-01-05'); // Thursday
 * getStartOfWeek(date, 1) // Returns: Monday of that week
 * getStartOfWeek(date, 0) // Returns: Sunday of that week
 * ```
 */
export function getStartOfWeek(date: Date, startOfWeek: number = 1): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < startOfWeek ? 7 : 0) + day - startOfWeek;
  
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * Gets the end of the week for a given date
 * @param date - The date to get the week end for
 * @param startOfWeek - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns Date representing end of week
 * 
 * @example
 * ```ts
 * const date = new Date('2023-01-05'); // Thursday
 * getEndOfWeek(date, 1) // Returns: Sunday of that week at 23:59:59
 * ```
 */
export function getEndOfWeek(date: Date, startOfWeek: number = 1): Date {
  const result = getStartOfWeek(date, startOfWeek);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  
  return result;
}