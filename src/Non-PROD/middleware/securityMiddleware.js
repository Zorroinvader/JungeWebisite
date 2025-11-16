// FILE OVERVIEW
// - Purpose: Security middleware for API calls that adds security headers, rate limiting, and input validation.
// - Used by: Currently NOT USED IN PRODUCTION - security features are implemented directly in httpApi.js.
// - Notes: NOT USED IN PRODUCTION - This file is in Non-PROD folder. The currently used security implementation is in src/services/httpApi.js which includes security validation, rate limiting, SQL injection detection, and input validation inline. This middleware file is legacy and not imported anywhere.

// Security Middleware for API calls
// This middleware adds security headers, rate limiting, and input validation to all API requests

import { securityAPI } from '../services/httpApi'

// Security middleware wrapper
export const withSecurity = (apiFunction) => {
  return async (...args) => {
    try {
      // Add security headers to the request
      const securityHeaders = {
        'X-Request-ID': generateRequestId(),
        'X-Timestamp': new Date().toISOString(),
        'X-User-Agent': navigator.userAgent,
        'X-Request-Source': 'web-app'
      }

      // Log the API call for monitoring
      await securityAPI.logSuspiciousActivity(
        'api_call',
        `API call: ${apiFunction.name}`,
        'low',
        null,
        null
      )

      // Execute the original API function with security context
      const result = await apiFunction(...args)
      
      return result
    } catch (error) {
      // Log security-relevant errors
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        await securityAPI.logSuspiciousActivity(
          'rate_limit_exceeded',
          `Rate limit exceeded for ${apiFunction.name}`,
          'medium',
          null,
          null
        )
      } else if (error.message.includes('Invalid input') || error.message.includes('SQL injection')) {
        await securityAPI.logSuspiciousActivity(
          'invalid_input_detected',
          `Invalid input detected in ${apiFunction.name}: ${error.message}`,
          'high',
          null,
          null
        )
      } else {
        await securityAPI.logSuspiciousActivity(
          'api_error',
          `API error in ${apiFunction.name}: ${error.message}`,
          'medium',
          null,
          null
        )
      }
      
      throw error
    }
  }
}

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Input validation middleware
export const validateInput = (validationRules) => {
  return (data) => {
    const errors = []
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = data[field]
      
      if (rules.required && (!value || value.trim() === '')) {
        errors.push(`${field} is required`)
        continue
      }
      
      if (value && rules.type === 'email' && !isValidEmail(value)) {
        errors.push(`${field} must be a valid email address`)
      }
      
      if (value && rules.type === 'phone' && !isValidPhone(value)) {
        errors.push(`${field} must be a valid phone number`)
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`)
      }
      
      if (value && rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`)
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
    
    return true
  }
}

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

// Phone validation (German format)
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/
  return phoneRegex.test(phone) && phone.length <= 20
}

// Rate limiting middleware
export const withRateLimit = (endpoint, maxRequests = 100, windowMinutes = 60) => {
  return async (apiFunction) => {
    return async (...args) => {
      try {
        // Check rate limit
        const rateLimitOk = await securityAPI.checkRateLimit(
          'web-app',
          endpoint,
          maxRequests,
          windowMinutes
        )
        
        if (!rateLimitOk) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        return await apiFunction(...args)
      } catch (error) {
        throw error
      }
    }
  }
}

// Security headers middleware
export const addSecurityHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// CSRF protection middleware
export const withCSRFProtection = (apiFunction) => {
  return async (...args) => {
    // Generate CSRF token if not exists
    let csrfToken = sessionStorage.getItem('csrfToken')
    if (!csrfToken) {
      csrfToken = generateCSRFToken()
      sessionStorage.setItem('csrfToken', csrfToken)
    }
    
    // Add CSRF token to headers
    const originalHeaders = args[0]?.headers || {}
    args[0] = {
      ...args[0],
      headers: {
        ...originalHeaders,
        'X-CSRF-Token': csrfToken
      }
    }
    
    return await apiFunction(...args)
  }
}

// Generate CSRF token
const generateCSRFToken = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Audit logging middleware
export const withAuditLog = (action) => {
  return (apiFunction) => {
    return async (...args) => {
      const startTime = Date.now()
      let success = false
      let error = null
      
      try {
        const result = await apiFunction(...args)
        success = true
        return result
      } catch (err) {
        error = err.message
        throw err
      } finally {
        const duration = Date.now() - startTime
        
        // Log audit event
        await securityAPI.logSuspiciousActivity(
          'audit_log',
          `Action: ${action}, Success: ${success}, Duration: ${duration}ms${error ? `, Error: ${error}` : ''}`,
          success ? 'low' : 'medium',
          null,
          null
        )
      }
    }
  }
}

// Export all middleware functions
export const SecurityMiddleware = {
  withSecurity,
  validateInput,
  withRateLimit,
  addSecurityHeaders,
  withCSRFProtection,
  withAuditLog
}

export default SecurityMiddleware
