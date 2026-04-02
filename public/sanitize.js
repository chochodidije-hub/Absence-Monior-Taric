/**
 * Sanitize input to prevent XSS and other injections
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate if a string is alphanumeric
 */
function isAlphanumeric(input) {
  return /^[a-z0-9]+$/i.test(input);
}

// Export for browser
window.sanitizeUtils = { sanitizeInput, isAlphanumeric };
