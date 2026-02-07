import { useCallback } from 'react';

export interface XSSValidationOptions {
  sanitize?: boolean;
  throwOnXSS?: boolean;
  logWarnings?: boolean;
}

const dangerousPatterns = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<link/i,
  /<meta/i,
  /<style/i,
];

export function useXSSValidation(options: XSSValidationOptions = {}) {
  const { sanitize = true, throwOnXSS = false, logWarnings = false } = options;

  const validateString = useCallback((value: string, fieldName: string = 'input'): string => {
    if (!value) return value;

    let sanitized = value;
    let hasXSS = false;

    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        hasXSS = true;
        if (logWarnings) {
          console.warn(`XSS pattern detected in ${fieldName}:`, pattern.source);
        }
        if (throwOnXSS) {
          throw new Error(`Potentially dangerous content detected in ${fieldName}`);
        }
        // Remove dangerous content if sanitize is enabled
        if (sanitize) {
          sanitized = sanitized.replace(pattern, '');
        }
      }
    }

    // Remove HTML tags (basic sanitization)
    if (sanitize) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    return sanitized;
  }, [sanitize, throwOnXSS, logWarnings]);

  return {
    validateString,
  };
}
