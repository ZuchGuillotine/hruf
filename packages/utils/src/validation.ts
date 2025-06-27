/**
 * Validation utility functions for consistent data validation across platforms
 * These functions are platform-agnostic and provide common validation patterns
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string | undefined;
  errors?: string[] | undefined;
}

/**
 * Validates if a value is not null, undefined, or empty string
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isRequired("test") // Returns: { isValid: true }
 * isRequired("", "name") // Returns: { isValid: false, message: "name is required" }
 * isRequired(null) // Returns: { isValid: false, message: "Field is required" }
 * ```
 */
export function isRequired(value: any, fieldName: string = "Field"): ValidationResult {
  const isEmpty = value === null || value === undefined || 
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);
  
  return {
    isValid: !isEmpty,
    message: isEmpty ? `${fieldName} is required` : undefined
  };
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidEmail("user@example.com") // Returns: { isValid: true }
 * isValidEmail("invalid-email") // Returns: { isValid: false, message: "Invalid email format" }
 * ```
 */
export function isValidEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid ? undefined : "Invalid email format"
  };
}

/**
 * Validates phone number format (US format)
 * @param phone - Phone number to validate
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidPhone("(555) 123-4567") // Returns: { isValid: true }
 * isValidPhone("5551234567") // Returns: { isValid: true }
 * isValidPhone("invalid") // Returns: { isValid: false, message: "Invalid phone number format" }
 * ```
 */
export function isValidPhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits, optionally with country code)
  const isValid = cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  
  return {
    isValid,
    message: isValid ? undefined : "Invalid phone number format"
  };
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidUrl("https://example.com") // Returns: { isValid: true }
 * isValidUrl("not-a-url") // Returns: { isValid: false, message: "Invalid URL format" }
 * ```
 */
export function isValidUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: false, message: "URL is required" };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, message: "Invalid URL format" };
  }
}

/**
 * Validates string length
 * @param value - String to validate
 * @param min - Minimum length (optional)
 * @param max - Maximum length (optional)
 * @param fieldName - Field name for error messages
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidLength("hello", 3, 10) // Returns: { isValid: true }
 * isValidLength("hi", 3, 10, "password") // Returns: { isValid: false, message: "password must be at least 3 characters" }
 * ```
 */
export function isValidLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = "Field"
): ValidationResult {
  if (!value) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const length = value.length;
  
  if (min !== undefined && length < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min} characters`
    };
  }
  
  if (max !== undefined && length > max) {
    return {
      isValid: false,
      message: `${fieldName} must be no more than ${max} characters`
    };
  }
  
  return { isValid: true };
}

/**
 * Validates numeric range
 * @param value - Number to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @param fieldName - Field name for error messages
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidRange(5, 1, 10) // Returns: { isValid: true }
 * isValidRange(15, 1, 10, "age") // Returns: { isValid: false, message: "age must be no more than 10" }
 * ```
 */
export function isValidRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = "Value"
): ValidationResult {
  if (value === null || value === undefined || isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (min !== undefined && value < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min}`
    };
  }
  
  if (max !== undefined && value > max) {
    return {
      isValid: false,
      message: `${fieldName} must be no more than ${max}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isStrongPassword("MyPassword123!") // Returns: { isValid: true }
 * isStrongPassword("weak") // Returns: { isValid: false, message: "Password is too weak", errors: [...] }
 * ```
 */
export function isStrongPassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;
  
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }
  
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? "Password is too weak" : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates date format and range
 * @param date - Date to validate
 * @param options - Validation options
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidDate(new Date()) // Returns: { isValid: true }
 * isValidDate("invalid-date") // Returns: { isValid: false, message: "Invalid date format" }
 * ```
 */
export function isValidDate(
  date: Date | string,
  options: {
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
    allowFuture?: boolean;
  } = {}
): ValidationResult {
  const { minDate, maxDate, allowPast = true, allowFuture = true } = options;
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return { isValid: false, message: "Invalid date format" };
  }
  
  const now = new Date();
  
  if (!allowPast && dateObj < now) {
    return { isValid: false, message: "Date cannot be in the past" };
  }
  
  if (!allowFuture && dateObj > now) {
    return { isValid: false, message: "Date cannot be in the future" };
  }
  
  if (minDate && dateObj < minDate) {
    return { isValid: false, message: `Date must be after ${minDate.toLocaleDateString()}` };
  }
  
  if (maxDate && dateObj > maxDate) {
    return { isValid: false, message: `Date must be before ${maxDate.toLocaleDateString()}` };
  }
  
  return { isValid: true };
}

/**
 * Validates credit card number using Luhn algorithm
 * @param cardNumber - Credit card number to validate
 * @returns Validation result
 * 
 * @example
 * ```ts
 * isValidCreditCard("4532015112830366") // Returns: { isValid: true }
 * isValidCreditCard("1234567890123456") // Returns: { isValid: false, message: "Invalid credit card number" }
 * ```
 */
export function isValidCreditCard(cardNumber: string): ValidationResult {
  if (!cardNumber) {
    return { isValid: false, message: "Credit card number is required" };
  }
  
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it's all digits and has valid length
  if (!/^\d{13,19}$/.test(cleaned)) {
    return { isValid: false, message: "Invalid credit card number format" };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const isValid = sum % 10 === 0;
  
  return {
    isValid,
    message: isValid ? undefined : "Invalid credit card number"
  };
}

/**
 * Validates multiple fields and returns combined result
 * @param validations - Array of validation results
 * @returns Combined validation result
 * 
 * @example
 * ```ts
 * const emailValidation = isValidEmail("user@example.com");
 * const passwordValidation = isStrongPassword("MyPassword123!");
 * const result = combineValidations([emailValidation, passwordValidation]);
 * ```
 */
export function combineValidations(validations: ValidationResult[]): ValidationResult {
  const errors: string[] = [];
  let isValid = true;
  
  for (const validation of validations) {
    if (!validation.isValid) {
      isValid = false;
      if (validation.message) {
        errors.push(validation.message);
      }
      if (validation.errors) {
        errors.push(...validation.errors);
      }
    }
  }
  
  return {
    isValid,
    message: errors.length > 0 ? errors[0] : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 * 
 * @example
 * ```ts
 * sanitizeHtml("<p>Hello <script>alert('xss')</script>World</p>") // Returns: "<p>Hello World</p>"
 * ```
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
  
  // Remove potentially dangerous tags
  const dangerousTags = ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }
  
  return sanitized.trim();
}

/**
 * Validates and sanitizes user input
 * @param input - Input string to validate and sanitize
 * @param options - Validation and sanitization options
 * @returns Validation result with sanitized value
 * 
 * @example
 * ```ts
 * validateAndSanitize("<p>Hello</p>", { allowHtml: true, maxLength: 100 })
 * // Returns: { isValid: true, sanitizedValue: "<p>Hello</p>" }
 * ```
 */
export function validateAndSanitize(
  input: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
    fieldName?: string;
  } = {}
): ValidationResult & { sanitizedValue?: string } {
  const { required = false, minLength, maxLength, allowHtml = false, fieldName = "Field" } = options;
  
  if (required) {
    const requiredCheck = isRequired(input, fieldName);
    if (!requiredCheck.isValid) {
      return requiredCheck;
    }
  }
  
  if (!input) {
    return { isValid: true, sanitizedValue: '' };
  }
  
  const lengthCheck = isValidLength(input, minLength, maxLength, fieldName);
  if (!lengthCheck.isValid) {
    return lengthCheck;
  }
  
  const sanitizedValue = allowHtml ? sanitizeHtml(input) : input.trim();
  
  return {
    isValid: true,
    sanitizedValue
  };
}