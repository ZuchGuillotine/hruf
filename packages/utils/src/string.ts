import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge for optimal class deduplication
 * This is commonly used in component libraries for conditional styling
 * 
 * @param inputs - Array of class values to combine
 * @returns Combined and deduplicated class string
 * 
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'text-white')
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes vitamin and supplement names for consistent searching
 * Handles common misspellings and variations in supplement names
 * 
 * @param input - Raw supplement name input
 * @returns Normalized string for consistent matching
 * 
 * @example
 * ```ts
 * normalizeVitaminName("Vit D3") // Returns: "vitamind3"
 * normalizeVitaminName("Vitamin B 12") // Returns: "vitaminb12"
 * ```
 */
export function normalizeVitaminName(input: string): string {
  if (!input) return '';

  // Remove spaces and convert to lowercase
  let normalized = input.toLowerCase().replace(/\s+/g, '');

  // Common vitamin spelling patterns
  normalized = normalized
    .replace(/vit+a*min/g, 'vitamin')  // Handle repeated letters
    .replace(/vitamiin/g, 'vitamin')
    .replace(/vitmin/g, 'vitamin')
    .replace(/vitamen/g, 'vitamin')
    .replace(/vitemin/g, 'vitamin');

  return normalized;
}

/**
 * Capitalizes the first letter of a string
 * 
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 * 
 * @example
 * ```ts
 * capitalize("hello world") // Returns: "Hello world"
 * ```
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case
 * 
 * @param str - String to convert
 * @returns String in title case
 * 
 * @example
 * ```ts
 * toTitleCase("hello world") // Returns: "Hello World"
 * ```
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncates a string to a specified length with ellipsis
 * 
 * @param str - String to truncate
 * @param length - Maximum length (default: 100)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 * 
 * @example
 * ```ts
 * truncate("This is a very long string", 10) // Returns: "This is a..."
 * ```
 */
export function truncate(str: string, length: number = 100, suffix: string = '...'): string {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Removes extra whitespace and normalizes spacing
 * 
 * @param str - String to clean
 * @returns Cleaned string
 * 
 * @example
 * ```ts
 * cleanWhitespace("  hello    world  ") // Returns: "hello world"
 * ```
 */
export function cleanWhitespace(str: string): string {
  if (!str) return str;
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Converts a string to kebab-case
 * 
 * @param str - String to convert
 * @returns String in kebab-case
 * 
 * @example
 * ```ts
 * toKebabCase("Hello World") // Returns: "hello-world"
 * toKebabCase("camelCase") // Returns: "camel-case"
 * ```
 */
export function toKebabCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts a string to camelCase
 * 
 * @param str - String to convert
 * @returns String in camelCase
 * 
 * @example
 * ```ts
 * toCamelCase("hello-world") // Returns: "helloWorld"
 * toCamelCase("hello_world") // Returns: "helloWorld"
 * ```
 */
export function toCamelCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

/**
 * Generates a random string of specified length
 * 
 * @param length - Length of the string to generate
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 * 
 * @example
 * ```ts
 * generateRandomString(8) // Returns: "aB3kX9mP"
 * ```
 */
export function generateRandomString(
  length: number = 8,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}