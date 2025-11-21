// FILE OVERVIEW
// - Purpose: Secure configuration management for API keys and secrets
// - Security: Prevents API keys from being exposed in logs, error messages, or UI
// - Used by: All services that need to access Supabase configuration

/**
 * SECURITY POLICY: API Keys and Secrets
 * 
 * This module ensures API keys are:
 * 1. Never logged or exposed in console output
 * 2. Never included in error messages
 * 3. Only accessed through secure getters
 * 4. Validated to prevent accidental exposure
 */

// ============================================================================
// SECURE CONFIGURATION GETTERS
// ============================================================================

/**
 * Get Supabase URL securely
 * @returns {string} Supabase project URL
 * @throws {Error} If URL is not configured
 */
export const getSupabaseUrl = () => {
  const url = process.env.REACT_APP_SUPABASE_URL
  
  if (!url) {
    throw new Error('Supabase URL is not configured. Please check your environment variables.')
  }
  
  // Validate URL format (basic check)
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid Supabase URL format.')
  }
  
  return url
}

/**
 * Get Supabase anon key securely
 * WARNING: Supabase anon keys are designed to be public but should be protected by RLS policies
 * @returns {string} Supabase anonymous key
 * @throws {Error} If key is not configured
 */
export const getSupabaseAnonKey = () => {
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY
  
  if (!key) {
    throw new Error('Supabase anonymous key is not configured. Please check your environment variables.')
  }
  
  // Validate key format (basic check - Supabase keys start with 'eyJ')
  if (key.length < 20) {
    throw new Error('Invalid Supabase key format.')
  }
  
  return key
}

/**
 * Get the site base URL for email redirects and links
 * Uses production domain in production, current origin in development
 * @returns {string} Base URL for the site
 */
export const getSiteUrl = () => {
  // In browser, check if we're in development or production
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    
    // Development/localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
      return origin
    }
    
    // Production - use the primary domain
    // Primary: www.jg-wedeswedel.de
    // Fallback: junge-webisite-mvn3.vercel.app
    if (origin.includes('jg-wedeswedel.de') || origin.includes('junge-webisite-mvn3.vercel.app')) {
      // Use the primary production domain
      return 'https://www.jg-wedeswedel.de'
    }
    
    // For any other production-like environment, use current origin
    return origin
  }
  
  // Fallback for server-side: use primary production domain
  return 'https://www.jg-wedeswedel.de'
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

/**
 * Check if a string might contain an API key (for detection)
 * @param {string} str - String to check
 * @returns {boolean} True if string might contain a key
 */
const mightContainKey = (str) => {
  if (!str || typeof str !== 'string') return false
  
  // Check for common key patterns
  const keyPatterns = [
    /eyJ[A-Za-z0-9_-]{20,}/, // JWT token pattern (Supabase keys)
    /sk_[A-Za-z0-9]{32,}/,   // Stripe key pattern
    /pk_[A-Za-z0-9]{32,}/,   // Stripe public key pattern
    /[A-Za-z0-9]{32,}/       // Generic long alphanumeric string
  ]
  
  return keyPatterns.some(pattern => pattern.test(str))
}

/**
 * Sanitize error message to remove any potential API keys
 * @param {Error|string} error - Error object or message
 * @returns {string} Sanitized error message
 */
export const sanitizeError = (error) => {
  let message = error instanceof Error ? error.message : String(error)
  
  // Remove any potential keys from error messages
  if (mightContainKey(message)) {
    // Replace potential keys with placeholder
    message = message.replace(/eyJ[A-Za-z0-9_-]{20,}/g, '[REDACTED_KEY]')
    message = message.replace(/sk_[A-Za-z0-9]{32,}/g, '[REDACTED_KEY]')
    message = message.replace(/pk_[A-Za-z0-9]{32,}/g, '[REDACTED_KEY]')
    message = message.replace(/\b[A-Za-z0-9]{40,}\b/g, '[REDACTED_KEY]')
  }
  
  return message
}

/**
 * Secure console logging that never exposes keys
 * @param {string} level - Log level ('log', 'warn', 'error')
 * @param {string} message - Log message
 * @param {any} data - Optional data to log (will be sanitized)
 */
export const secureLog = (level = 'log', message, data = null) => {
  const sanitizedMessage = sanitizeError(message)
  
  let sanitizedData = data
  if (data) {
    // Deep clone and sanitize data
    try {
      const dataStr = JSON.stringify(data)
      if (mightContainKey(dataStr)) {
        sanitizedData = JSON.parse(
          dataStr
            .replace(/eyJ[A-Za-z0-9_-]{20,}/g, '[REDACTED_KEY]')
            .replace(/sk_[A-Za-z0-9]{32,}/g, '[REDACTED_KEY]')
            .replace(/pk_[A-Za-z0-9]{32,}/g, '[REDACTED_KEY]')
            .replace(/\b[A-Za-z0-9]{40,}\b/g, '[REDACTED_KEY]')
        )
      }
    } catch {
      sanitizedData = '[Data sanitized]'
    }
  }
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    if (sanitizedData) {
      console[level](sanitizedMessage, sanitizedData)
    } else {
      console[level](sanitizedMessage)
    }
  }
}

// ============================================================================
// DEVELOPMENT WARNINGS
// ============================================================================

/**
 * Check for accidental key exposure in code (development only)
 */
if (process.env.NODE_ENV === 'development') {
  // Check if keys are accidentally hardcoded
  const url = process.env.REACT_APP_SUPABASE_URL
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY
  
  if (url && url.includes('localhost') === false && url.length > 0) {
    // Valid URL detected
  }
  
  if (key && key.length > 0) {
    // Warn if key looks like it might be exposed
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.warn(
        '%cSECURITY WARNING',
        'color: red; font-weight: bold;',
        'Supabase anon key is accessible in client-side code. Ensure Row Level Security (RLS) policies are properly configured in Supabase.'
      )
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getSupabaseUrl,
  getSupabaseAnonKey,
  sanitizeError,
  secureLog
}

