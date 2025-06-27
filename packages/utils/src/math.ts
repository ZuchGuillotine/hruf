/**
 * Mathematical utility functions for calculations across web and mobile platforms
 * These functions are platform-agnostic and handle edge cases consistently
 */

/**
 * Clamps a number between min and max values
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 * 
 * @example
 * ```ts
 * clamp(5, 1, 10) // Returns: 5
 * clamp(-5, 1, 10) // Returns: 1
 * clamp(15, 1, 10) // Returns: 10
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The value to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded value
 * 
 * @example
 * ```ts
 * round(3.14159, 2) // Returns: 3.14
 * round(3.14159, 0) // Returns: 3
 * round(3.14159) // Returns: 3.14
 * ```
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates the percentage of a value relative to a total
 * @param value - The value
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage as a number
 * 
 * @example
 * ```ts
 * percentage(25, 100) // Returns: 25.0
 * percentage(1, 3, 2) // Returns: 33.33
 * percentage(0, 100) // Returns: 0
 * ```
 */
export function percentage(value: number, total: number, decimals: number = 1): number {
  if (total === 0) return 0;
  return round((value / total) * 100, decimals);
}

/**
 * Calculates the average of an array of numbers
 * @param values - Array of numbers
 * @returns Average value or 0 if array is empty
 * 
 * @example
 * ```ts
 * average([1, 2, 3, 4, 5]) // Returns: 3
 * average([]) // Returns: 0
 * average([10, 20, 30]) // Returns: 20
 * ```
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Calculates the sum of an array of numbers
 * @param values - Array of numbers
 * @returns Sum of all values
 * 
 * @example
 * ```ts
 * sum([1, 2, 3, 4, 5]) // Returns: 15
 * sum([]) // Returns: 0
 * sum([-1, 1, 2]) // Returns: 2
 * ```
 */
export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Finds the median value in an array of numbers
 * @param values - Array of numbers
 * @returns Median value or 0 if array is empty
 * 
 * @example
 * ```ts
 * median([1, 2, 3, 4, 5]) // Returns: 3
 * median([1, 2, 3, 4]) // Returns: 2.5
 * median([5, 1, 3]) // Returns: 3
 * ```
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * Finds the mode (most frequent value) in an array of numbers
 * @param values - Array of numbers
 * @returns Mode value or the first value if no mode exists
 * 
 * @example
 * ```ts
 * mode([1, 2, 2, 3]) // Returns: 2
 * mode([1, 2, 3]) // Returns: 1 (first value when no clear mode)
 * ```
 */
export function mode(values: number[]): number {
  if (values.length === 0) return 0;
  
  const frequency: Record<number, number> = {};
  let maxCount = 0;
  let modeValue = values[0];
  
  for (const value of values) {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxCount) {
      maxCount = frequency[value];
      modeValue = value;
    }
  }
  
  return modeValue;
}

/**
 * Calculates the standard deviation of an array of numbers
 * @param values - Array of numbers
 * @returns Standard deviation or 0 if array has less than 2 values
 * 
 * @example
 * ```ts
 * standardDeviation([1, 2, 3, 4, 5]) // Returns: ~1.58
 * standardDeviation([1]) // Returns: 0
 * ```
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const avg = average(values);
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquaredDiff = average(squaredDiffs);
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculates the range (max - min) of an array of numbers
 * @param values - Array of numbers
 * @returns Range of values or 0 if array is empty
 * 
 * @example
 * ```ts
 * range([1, 2, 3, 4, 5]) // Returns: 4
 * range([10]) // Returns: 0
 * range([]) // Returns: 0
 * ```
 */
export function range(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

/**
 * Generates a random number between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number in range
 * 
 * @example
 * ```ts
 * randomBetween(1, 10) // Returns: random number between 1 and 10
 * randomBetween(0, 1) // Returns: random number between 0 and 1
 * ```
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer in range
 * 
 * @example
 * ```ts
 * randomIntBetween(1, 6) // Returns: random integer 1-6 (dice roll)
 * randomIntBetween(0, 100) // Returns: random integer 0-100
 * ```
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 * 
 * @example
 * ```ts
 * degreesToRadians(180) // Returns: π (3.14159...)
 * degreesToRadians(90) // Returns: π/2 (1.5708...)
 * ```
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 * 
 * @example
 * ```ts
 * radiansToDegrees(Math.PI) // Returns: 180
 * radiansToDegrees(Math.PI / 2) // Returns: 90
 * ```
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the distance between two points in 2D space
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns Distance between points
 * 
 * @example
 * ```ts
 * distance2D(0, 0, 3, 4) // Returns: 5 (3-4-5 triangle)
 * distance2D(1, 1, 1, 1) // Returns: 0 (same point)
 * ```
 */
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates BMI (Body Mass Index)
 * @param weightKg - Weight in kilograms
 * @param heightM - Height in meters
 * @returns BMI value
 * 
 * @example
 * ```ts
 * calculateBMI(70, 1.75) // Returns: 22.86 (normal weight)
 * calculateBMI(80, 1.8) // Returns: 24.69 (normal weight)
 * ```
 */
export function calculateBMI(weightKg: number, heightM: number): number {
  if (heightM <= 0) return 0;
  return round(weightKg / (heightM * heightM), 2);
}

/**
 * Categorizes BMI value into standard categories
 * @param bmi - BMI value
 * @returns BMI category string
 * 
 * @example
 * ```ts
 * categorizeBMI(18.5) // Returns: "Normal weight"
 * categorizeBMI(30) // Returns: "Obese"
 * ```
 */
export function categorizeBMI(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Interpolates between two values
 * @param start - Starting value
 * @param end - Ending value
 * @param progress - Progress from 0 to 1
 * @returns Interpolated value
 * 
 * @example
 * ```ts
 * lerp(0, 100, 0.5) // Returns: 50
 * lerp(10, 20, 0.25) // Returns: 12.5
 * ```
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp(progress, 0, 1);
}

/**
 * Maps a value from one range to another
 * @param value - Input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 * 
 * @example
 * ```ts
 * mapRange(5, 0, 10, 0, 100) // Returns: 50
 * mapRange(75, 0, 100, 0, 1) // Returns: 0.75
 * ```
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin;
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}