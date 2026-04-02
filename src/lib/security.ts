import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Sanitizes a string to prevent XSS attacks.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export const sanitize = (input: string): string => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input);
};

/**
 * Sanitizes an object by recursively sanitizing all string properties.
 * @param obj The object to sanitize.
 * @returns The sanitized object.
 */
export const sanitizeObject = <T extends object>(obj: T): T => {
  const sanitized = { ...obj } as any;
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitize(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
};

// Common Validation Schemas
export const schemas = {
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password too long'),
  studentName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  className: z.string().min(1, 'Class name required').max(50, 'Class name too long'),
};
